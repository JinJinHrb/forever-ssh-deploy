/* eslint-disable arrow-parens */
import Path from 'path'
import fs from 'fs'
import Q from 'q';
import zipFolder from 'zip-folder';
import _L from 'lodash';
import hdlUtil from './helpers/hdlUtil';
import fsUtil from './helpers/fsUtil';
import { NodeSSH } from 'node-ssh'

const _defaultInitScript = [
    '#!/bin/bash',
    '# author: WangFan',
    '# description: backup server directory',
    'time1=$(date +"%Y-%m-%dT%H-%M-%S")',
    'str1=\'server.\'',
    'str2=\'改前.tar.gz\'',
    'time2=$str1$time1$str2',
    'tar -czvf $time2 server &&',
    'unzip -o server.zip -d ${destFolderPath} &&',
    'sleep 2 &&',
    'rm -f server.zip &',
    'nohup forever stop index.js &',
    'forever start -o nohup.out -e nohup.out index.js'
    ].join('\n');

class Deploy {
    constructor (args = {}) {
        const mandatoryFields = ['author', 'srcFolderPath']; // 'destFolderPath', 'host', 'username'
        // const mandatoryOneFields = ['privateKeyPath', 'password']
        // const optionalFields = ['initScript', modifiedHours];
        for(let fd of mandatoryFields){
            if(!hdlUtil.getDeepVal(args, fd)){
                throw new Error(`mandatory field "${fd}" is missing`);
            }
        }
        /* let isMandatoryOneOk = false; // 二选一
        for(let fd of mandatoryOneFields){
            if(hdlUtil.getDeepVal(args, fd)){
                isMandatoryOneOk = true;
                break;
            }
        }
        if(!isMandatoryOneOk){
            throw new Error(`mandatory field "privateKeyPath / password" is missing`);
        } */
        this.args = args;
    }

    getInitScriptPromise ({leafFolderName, destFolderPath}) {
        if ( this.args.initScript ) {
            return Q.resolve(this.args.initScript);
        }
        // const destFolderPath = this.args.destFolderPath;
        const author = this.args.author;
        return Q.promise((rsv, rej) => {
            /* const bashFilePath = Path.resolve(__dirname, 'helpers/backupServer.sh');
            fs.readFile(bashFilePath, 'utf8', (err, rst) => {
                if (err) {
                    return rej(err);
                } */
                let rst = _defaultInitScript;
                if(author){
                    const regex2 = new RegExp('改前');
                    rst = rst.replace(regex2, `.${author}.backup`);
                }
                rst = rst.replace(/\$\{destFolderPath\}/g, destFolderPath);
                if(!leafFolderName || leafFolderName === 'server'){
                    return rsv(rst);
                }else{
                    const regex = new RegExp('server', 'g');
                    rst = rst.replace(regex, leafFolderName);
                    rsv(rst);
                }
            // })
        })
    }

    removeFilePromise (filePath) {
        return Q.promise((rsv/* , rej */) => {
            // eslint-disable-next-line no-sync
            if (!fs.existsSync(filePath)) {
                return rsv(`removeFilePromise #111 not found: ${filePath}`);
            }
            fs.unlink(filePath, function (err) {
                if (err) {
                    console.error('removefilePromise #27', err);
                }
                rsv(filePath);
            });
        })
    }

    removeFolderPromise (folerPath) {
        return Q.promise((rsv, rej) => {
            // delete directory recursively
            fs.rmdir(folerPath, { recursive: true }, (err) => {
                if (err) {
                    console.error(`fail to delete ${folerPath}, ERROR:`, err);
                    rej(err);
                }else{
                    console.log(hdlUtil.date2string(new Date(), 'ms'), `#268 ${folerPath} is deleted!`);
                    rsv(null);
                }
            });
        })
    }
    
    /** 
     * @param {String} folderPath the path of folder to be zipped
     * @param {String} options options.deleteFolder Y 压缩后删除文件 
     * @returns {String} zipPath
     * */
    zipFolderHandler (folderPath, options = {}) {
        if (_L.endsWith(folderPath, Path.sep)) {
            folderPath = folderPath.slice(0, folderPath.length - 1);
        }
        const zipPath = _L.trim(hdlUtil.getDeepVal(options, 'zipPath') || `${folderPath}.zip`);
        return Q.promise(function (rsv, rej) {
            // eslint-disable-next-line no-sync
            if (!fs.existsSync(folderPath)) {
                return rsv({ code: 113 });
            }
            zipFolder(folderPath, zipPath, err => {
                if (err) {
                    rej(err)
                } else {
                    rsv({ code: 111, zipPath });
                }
            });
        });
    }

    exec () {
        const { srcFolderPath, modifiedHours } = this.args;
        let servers = this.args.servers;
        if(!servers){
            const {destFolderPath, privateKeyPath, host, port, username, password} = this.args;
            servers = [{destFolderPath, privateKeyPath, host, port, username, password}];
        }
        const _this = this;
        const recur = (feed = {}) => {
            const {tmpFolderPath, localBashFilePath, zipPath} = feed;
            if(servers.length < 1){
                const qAll = [];
                qAll.push( this.removeFilePromise(zipPath) );
                qAll.push( this.removeFilePromise(localBashFilePath) );
                qAll.push( this.removeFolderPromise(tmpFolderPath) );
                return;
            }
            const task = Object.assign({}, servers.shift(), {srcFolderPath, modifiedHours});
            if(zipPath){
                task.preparedZipPath = zipPath;
                task.preparedTmpFolderPath = tmpFolderPath;
            }
            _this.exec2(task).then(recur);
        }
        recur();
    }

    exec2 (params = {}) {
        const { srcFolderPath, modifiedHours, destFolderPath, privateKeyPath, host, port = 22, username, password } = params;
        const preparedZipPath = params.preparedZipPath; // 同一批部署，不重复制作压缩包
        const preparedTmpFolderPath = params.preparedTmpFolderPath; // 同一批部署，不重复制作压缩包
        let tmpFolderPath; // if modifiedHours, copy selected files to ${tmpFolderPath} first
        let lastSlashIdx = srcFolderPath.lastIndexOf(Path.sep);
        if (lastSlashIdx === srcFolderPath.length - 1) {
            lastSlashIdx = srcFolderPath.slice(0, -1).lastIndexOf(Path.sep);
        }

        let leafFolderName = srcFolderPath.slice(lastSlashIdx + 1);
        if(hdlUtil.endsWith(leafFolderName, Path.sep)){
            leafFolderName = leafFolderName.slice(0, leafFolderName.length - 1);
        }
        const zipFileName = `${leafFolderName}.zip`;

        const parentFolderPath = srcFolderPath.slice(0, lastSlashIdx);
        const zipPath = Path.resolve(parentFolderPath, zipFileName);

        let destPathSep;
        if(destFolderPath.indexOf('/') !== 0 || destFolderPath.slice(0, 4).indexOf(':') > 0){
            destPathSep = '\\';
        }else{
            destPathSep = '/';
        }
        lastSlashIdx = destFolderPath.lastIndexOf(destPathSep);
        if (lastSlashIdx === destFolderPath.length - 1) {
            lastSlashIdx = destFolderPath.slice(0, -1).lastIndexOf(destPathSep);
        }
        const parentDestFolderPath = destFolderPath.slice(0, lastSlashIdx);
        const destFilePath = `${parentDestFolderPath}${destPathSep}${zipFileName}`; // Path.resolve(parentDestFolderPath, zipFileName);
        const localBashFilePath = Path.resolve(__dirname, '.backupServer.sh');
        const _this = this;
        let toPrint;
        return Q.promise((rsvRoot, rejRoot) => {
            (() => {
                // eslint-disable-next-line no-sync
                if(fs.existsSync(zipPath) && !preparedZipPath){ // 不删除同一批任务留下的压缩包
                    return this.removeFilePromise (zipPath);
                }else{
                    return Q.resolve(null);
                }
            })().then(() => {
                if(hdlUtil.oType(modifiedHours) === 'number'){
                    if(preparedZipPath && fs.existsSync(zipPath)){ // 不重复制作压缩包
                        return preparedTmpFolderPath;
                    }
                    return fsUtil.copyFilteredFilesPromise(srcFolderPath, modifiedHours);
                }else{
                    return;
                }
            }).then(feed => {
                let thePath;
                if(feed){
                    thePath = tmpFolderPath = feed;
                }else{
                    thePath = srcFolderPath;
                }
                if(fs.existsSync(zipPath) && preparedZipPath){ // 不重复制作压缩包
                    return;
                }
                return this.zipFolderHandler(thePath, { zipPath });
            }).then(() => {
                if(!privateKeyPath || !fs.existsSync(privateKeyPath)){
                    if(password){
                        return null;
                    }else{
                        return Q.reject({code: 110, msg: 'no password'});
                    }
                }
                return Q.promise((rsv, rej) => {
                    fs.readFile(privateKeyPath, 'utf8', (err, rst) => {
                        if (err) {
                            return rej(err);
                        }
                        rsv(rst);
                    })
                })
            }).then(( feed ) => {
                _this.ssh = new NodeSSH();
                const sshOptions = {
                    host,
                    port,
                    username
                }
                if(feed){
                    sshOptions.privateKey = feed;
                }else{
                    sshOptions.password = password;
                }
                const sshOptionsCopy = { ...sshOptions };
                delete sshOptionsCopy.privateKey;
                toPrint = {host, port, username}
                return _this.ssh.connect(sshOptions);
            }).then(() => {
                if(toPrint){
                    console.log(hdlUtil.date2string(new Date(), 'ms'), 'SSH Login:', toPrint);
                }
                return Q.promise((rsv, rej) => {
                    _this.ssh.putFile(zipPath, destFilePath).then(function () {
                        rsv({ destFilePath, msg: 'OK', zipPath });
                    }, function (error) {
                        rej(error);
                    })
                })
            /* }).then(function () {
                return Q.promise((rsv, rej) => {
                    _this.ssh.exec('ls', ['-l', zipFileName], {
                        cwd: parentDestFolderPath,
                        onStdout (chunk) {
                            const str = chunk.toString('utf8');
                            console.log('#108 stdoutChunk:', str)
                            rsv(str)
                        },
                        onStderr (chunk) {
                            const str = chunk.toString('utf8');
                            console.log('#113 stderrChunk:', str)
                            rej(str);
                        }
                    })
                }) */
            }).then(() => {
                return this.getInitScriptPromise({leafFolderName, destFolderPath});
            }).then(feed => {
                return Q.promise((rsv, rej) => {
                    fs.writeFile(localBashFilePath, feed, { encoding: 'utf8', mode: 0o644, flag: 'w' }, (err, rst) => {
                        if(err){
                            rej(err);
                        }else{
                            rsv(rst);
                        }
                    });
                })
            }).then(() => {
                const remoteBashFilePath = `${parentDestFolderPath}${destPathSep}backupServer.sh`; // Path.resolve(parentDestFolderPath, 'backupServer.sh');
                return Q.promise((rsv, rej) => {
                    _this.ssh.putFile(localBashFilePath, remoteBashFilePath).then(function () {
                        rsv({ destFilePath, msg: 'OK', zipPath });
                    }, function (error) {
                        rej(error);
                    })
                })
            }).then(() => {
                return _this.ssh.execCommand('chmod +x backupServer.sh', { cwd: parentDestFolderPath })
            }).then(() => {
                return _this.ssh.execCommand('./backupServer.sh', { cwd: parentDestFolderPath });
            })/* .then(() => {
                const qAll = [];
                qAll.push( this.removeFilePromise(zipPath) );
                qAll.push( this.removeFilePromise(localBashFilePath) );
                return Q.all(qAll);
            }) *//* .then(() => {
                const deferred = Q.defer();
                setTimeout(function(){deferred.resolve()}, 10000);
                return deferred.promise;
            }) *//* .then(() => {
                if(!tmpFolderPath){
                    return;
                }
                return Q.promise((rsv, rej) => {
                    // delete directory recursively
                    fs.rmdir(tmpFolderPath, { recursive: true }, (err) => {
                        if (err) {
                            rej(err);
                        }else{
                            console.log(`#268 ${tmpFolderPath} is deleted!`);
                            rsv(null);
                        }
                    });
                })
            }) */.then(() => {
                _this.ssh.dispose();
                rsvRoot({code: 111, msg: 'OK', tmpFolderPath, localBashFilePath, zipPath});
            }).done(null, err => {
                if (!err) {
                    return;
                }
                console.error('#75', err);
                rsvRoot({code: 110, msg: 'ERROR'});
            })
        })
    }

}
module.exports = Deploy;