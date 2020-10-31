"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/* eslint-disable arrow-parens */
// import Path from 'path'
// import fs from 'fs'
// import Q from 'q';
// // import zipFolder from 'zip-folder';
// import archiver from 'archiver'
// import _L from 'lodash';
// import hdlUtil from './helpers/hdlUtil';
// import fsUtil from './helpers/fsUtil';
// import { NodeSSH } from 'node-ssh'
var Path = require('path');

var fs = require('fs');

var Q = require('q');

var archiver = require('archiver'); // const _L = require('lodash');


var hdlUtil = require('./helpers/hdlUtil');

var fsUtil = require('./helpers/fsUtil'); // const { NodeSSH } = require('node-ssh');
// https://www.npmjs.com/package/ssh2-sftp-client


var Ssh2SftpClient = require('ssh2-sftp-client');

var _defaultInitScript = ['#!/bin/bash', '# author: WangFan', '# description: backup server directory', 'time1=$(date +"%Y-%m-%dT%H-%M-%S")', 'str1=\'server.\'', 'str2=\'改前.tar.gz\'', 'time2=$str1$time1$str2', 'tar -czvf $time2 server &&', 'unzip -o server.zip -d ${destFolderPath} &&', 'sleep 2 &&', 'rm -f server.zip &', 'nohup forever stop index.js &', 'forever start -o nohup.out -e nohup.out index.js'].join('\n');

var Deploy = /*#__PURE__*/function () {
  function Deploy() {
    var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, Deploy);
    var mandatoryFields = ['author', 'srcFolderPath']; // 'destFolderPath', 'host', 'username'
    // const mandatoryOneFields = ['privateKeyPath', 'password']
    // const optionalFields = ['initScript', modifiedHours];

    for (var _i = 0, _mandatoryFields = mandatoryFields; _i < _mandatoryFields.length; _i++) {
      var fd = _mandatoryFields[_i];

      if (!hdlUtil.getDeepVal(args, fd)) {
        throw new Error("mandatory field \"".concat(fd, "\" is missing"));
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

  (0, _createClass2["default"])(Deploy, [{
    key: "getInitScriptPromise",
    value: function getInitScriptPromise(_ref) {
      var leafFolderName = _ref.leafFolderName,
          destFolderPath = _ref.destFolderPath;

      if (this.args.initScript) {
        return Q.resolve(this.args.initScript);
      } // const destFolderPath = this.args.destFolderPath;


      var author = this.args.author;
      return Q.promise(function (rsv
      /* , rej */
      ) {
        /* const bashFilePath = Path.resolve(__dirname, 'helpers/backupServer.sh');
        fs.readFile(bashFilePath, 'utf8', (err, rst) => {
            if (err) {
                return rej(err);
            } */
        var rst = _defaultInitScript;

        if (author) {
          var regex2 = new RegExp('改前');
          rst = rst.replace(regex2, ".".concat(author, ".backup"));
        }

        rst = rst.replace(/\$\{destFolderPath\}/g, destFolderPath);

        if (!leafFolderName || leafFolderName === 'server') {
          return rsv(rst);
        } else {
          var regex = new RegExp('server', 'g');
          rst = rst.replace(regex, leafFolderName);
          rsv(rst);
        } // })

      });
    }
  }, {
    key: "removeFilePromise",
    value: function removeFilePromise(filePath) {
      return Q.promise(function (rsv
      /* , rej */
      ) {
        // eslint-disable-next-line no-sync
        if (!fs.existsSync(filePath)) {
          return rsv("removeFilePromise #111 not found: ".concat(filePath));
        }

        fs.unlink(filePath, function (err) {
          if (err) {
            console.error('removefilePromise #27', err);
          }

          rsv(filePath);
        });
      });
    }
  }, {
    key: "removeFolderPromise",
    value: function removeFolderPromise(folerPath) {
      return Q.promise(function (rsv, rej) {
        // delete directory recursively
        fs.rmdir(folerPath, {
          recursive: true
        }, function (err) {
          if (err) {
            console.error("fail to delete ".concat(folerPath, ", ERROR:"), err);
            rej(err);
          } else {
            console.log(hdlUtil.date2string(new Date(), 'ms'), "#268 ".concat(folerPath, " is deleted!"));
            rsv(null);
          }
        });
      });
    }
    /** 
     * @param {String} folderPath the path of folder to be zipped
     * @param {String} options options.deleteFolder Y 压缩后删除文件 
     * @returns {String} zipPath
     * */
    // zipFolderHandler (folderPath, options = {}) {
    //     if (_L.endsWith(folderPath, Path.sep)) {
    //         folderPath = folderPath.slice(0, folderPath.length - 1);
    //     }
    //     const zipPath = _L.trim(hdlUtil.getDeepVal(options, 'zipPath') || `${folderPath}.zip`);
    //     return Q.promise(function (rsv, rej) {
    //         // eslint-disable-next-line no-sync
    //         if (!fs.existsSync(folderPath)) {
    //             return rsv({ code: 113 });
    //         }
    //         zipFolder(folderPath, zipPath, err => {
    //             if (err) {
    //                 rej(err)
    //             } else {
    //                 rsv({ code: 111, zipPath });
    //             }
    //         });
    //     });
    // }

    /**
     * 压缩文件夹
     */

  }, {
    key: "archiveFolderPromise",
    value: function archiveFolderPromise(folderPath, targetPath) {
      return Q.promise(function (rsv, rej) {
        var promiseReturned = false;

        if (!fs.existsSync(folderPath)) {
          return rej({
            code: 110,
            msg: "folderPath not exists: ".concat(folderPath)
          });
        }
        /*
            stats.isFile()
            stats.isDirectory()
            stats.isBlockDevice()
            stats.isCharacterDevice()
            stats.isSymbolicLink() (only valid with fs.lstat())
            stats.isFIFO()
            stats.isSocket()
        */


        if (!fs.lstatSync(folderPath).isDirectory()) {
          return rej({
            code: 110,
            msg: "folderPath is not of folder: ".concat(folderPath)
          });
        }

        if (!targetPath) {
          targetPath = "".concat(folderPath, ".zip"); // Zip 文件不带.开头
        } // create a file to stream archive data to.


        var output = fs.createWriteStream(targetPath);
        var archive = archiver('zip', {
          zlib: {
            level: 9
          } // Sets the compression level.

        }); // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved

        output.on('close', function () {
          console.log(archive.pointer() + ' total bytes');
          console.log('archiver has been finalized and the output file descriptor has closed.');

          if (promiseReturned) {
            return;
          }

          promiseReturned = true;
          rsv({
            sourcePath: folderPath,
            targetPath: targetPath
          });
        });
        output.on('end', function () {
          console.log('Data has been drained'); // if(promiseReturned){
          //     return;
          // }
          // promiseReturned = true;
          // rsv({sourcePath: folderPath, targetPath});
        }); // good practice to catch this error explicitly

        archive.on('error', function (err) {
          // throw err;
          if (promiseReturned) {
            return;
          }

          promiseReturned = true;
          rej(err);
        }); // pipe archive data to the file

        archive.pipe(output);
        archive.bulk([{
          expand: true,
          cwd: folderPath,
          src: ['**/*']
        }]).finalize();
        archive.finalize();
      });
    }
  }, {
    key: "exec",
    value: function exec() {
      var _this2 = this;

      var _this$args = this.args,
          srcFolderPath = _this$args.srcFolderPath,
          modifiedHours = _this$args.modifiedHours;
      var servers = this.args.servers;

      if (!servers) {
        var _this$args2 = this.args,
            destFolderPath = _this$args2.destFolderPath,
            privateKeyPath = _this$args2.privateKeyPath,
            host = _this$args2.host,
            port = _this$args2.port,
            username = _this$args2.username,
            password = _this$args2.password;
        servers = [{
          destFolderPath: destFolderPath,
          privateKeyPath: privateKeyPath,
          host: host,
          port: port,
          username: username,
          password: password
        }];
      }

      var _this = this;

      var recur = function recur() {
        var feed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var tmpFolderPath = feed.tmpFolderPath,
            localBashFilePath = feed.localBashFilePath,
            zipPath = feed.zipPath;

        if (servers.length < 1) {
          var qAll = [];
          qAll.push(_this2.removeFilePromise(zipPath));
          qAll.push(_this2.removeFilePromise(localBashFilePath));
          qAll.push(_this2.removeFolderPromise(tmpFolderPath));
          return;
        }

        var task = Object.assign({}, servers.shift(), {
          srcFolderPath: srcFolderPath,
          modifiedHours: modifiedHours
        });

        if (zipPath) {
          task.preparedZipPath = zipPath;
          task.preparedTmpFolderPath = tmpFolderPath;
        }

        _this.exec2(task).then(recur);
      };

      recur();
    }
  }, {
    key: "exec2",
    value: function exec2() {
      var _this3 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var srcFolderPath = params.srcFolderPath,
          modifiedHours = params.modifiedHours,
          destFolderPath = params.destFolderPath,
          privateKeyPath = params.privateKeyPath,
          host = params.host,
          _params$port = params.port,
          port = _params$port === void 0 ? 22 : _params$port,
          username = params.username,
          password = params.password;
      var preparedZipPath = params.preparedZipPath; // 同一批部署，不重复制作压缩包

      var preparedTmpFolderPath = params.preparedTmpFolderPath; // 同一批部署，不重复制作压缩包

      var tmpFolderPath; // if modifiedHours, copy selected files to ${tmpFolderPath} first

      var lastSlashIdx = srcFolderPath.lastIndexOf(Path.sep);

      if (lastSlashIdx === srcFolderPath.length - 1) {
        lastSlashIdx = srcFolderPath.slice(0, -1).lastIndexOf(Path.sep);
      }

      var leafFolderName = srcFolderPath.slice(lastSlashIdx + 1);

      if (hdlUtil.endsWith(leafFolderName, Path.sep)) {
        leafFolderName = leafFolderName.slice(0, leafFolderName.length - 1);
      }

      var zipFileName = "".concat(leafFolderName, ".zip");
      var parentFolderPath = srcFolderPath.slice(0, lastSlashIdx);
      var zipPath = Path.resolve(parentFolderPath, zipFileName);
      var destPathSep;

      if (destFolderPath.indexOf('/') !== 0 || destFolderPath.slice(0, 4).indexOf(':') > 0) {
        destPathSep = '\\';
      } else {
        destPathSep = '/';
      }

      lastSlashIdx = destFolderPath.lastIndexOf(destPathSep);

      if (lastSlashIdx === destFolderPath.length - 1) {
        lastSlashIdx = destFolderPath.slice(0, -1).lastIndexOf(destPathSep);
      }

      var parentDestFolderPath = destFolderPath.slice(0, lastSlashIdx);
      var destFilePath = "".concat(parentDestFolderPath).concat(destPathSep).concat(zipFileName); // Path.resolve(parentDestFolderPath, zipFileName);

      var localBashFilePath = Path.resolve(__dirname, '.backupServer.sh');
      var sshClient
      /* , toPrint */
      ;
      return Q.promise(function (rsvRoot
      /* , rejRoot */
      ) {
        (function () {
          // eslint-disable-next-line no-sync
          if (fs.existsSync(zipPath) && !preparedZipPath) {
            // 不删除同一批任务留下的压缩包
            return _this3.removeFilePromise(zipPath);
          } else {
            return Q.resolve(null);
          }
        })().then(function () {
          if (hdlUtil.oType(modifiedHours) === 'number') {
            if (preparedZipPath && fs.existsSync(zipPath)) {
              // 不重复制作压缩包
              return preparedTmpFolderPath;
            }

            return fsUtil.copyFilteredFilesPromise(srcFolderPath, modifiedHours);
          } else {
            return;
          }
        }).then(function (feed) {
          /* let thePath;
          if(feed){
              thePath = tmpFolderPath = feed;
          }else{
              thePath = srcFolderPath;
          } */
          tmpFolderPath = feed;

          if (fs.existsSync(zipPath) && preparedZipPath) {
            // 不重复制作压缩包
            return;
          } // return this.zipFolderHandler(thePath, { zipPath });


          console.log('archive #305 path:', tmpFolderPath, srcFolderPath + '.zip');
          return _this3.archiveFolderPromise(tmpFolderPath, srcFolderPath + '.zip');
        }).then(function () {
          if (!privateKeyPath || !fs.existsSync(privateKeyPath)) {
            if (password) {
              return null;
            } else {
              return Q.reject({
                code: 110,
                msg: 'no password'
              });
            }
          }

          return Q.promise(function (rsv, rej) {
            fs.readFile(privateKeyPath, 'utf8', function (err, rst) {
              if (err) {
                return rej(err);
              }

              rsv(rst);
            });
          });
        }).then(function (feed) {
          // sshClient = new NodeSSH();
          sshClient = new Ssh2SftpClient();
          var sshOptions = {
            host: host,
            port: port,
            username: username
          };

          if (feed) {
            sshOptions.privateKey = feed;
          } else {
            sshOptions.password = password;
          } // const sshOptionsCopy = { ...sshOptions };
          // delete sshOptionsCopy.privateKey;
          // toPrint = {host, port, username, sshOptionsCopy}


          return sshClient.connect(sshOptions);
        }).then(function () {
          var deferred = Q.defer();
          setTimeout(function () {
            deferred.resolve();
          }, 1000);
          return deferred.promise;
        }).then(function () {
          return sshClient.put(zipPath, destFilePath);
          /* return Q.promise((rsv, rej) => {
              sshClient.putFile(zipPath, destFilePath, undefined, {
                  step: (total_transferred, chunk, total) => {
                      console.log('Uploaded', total_transferred, 'of', total);
                  }
              }).then(function () {
                  rsv({ destFilePath, msg: 'OK', zipPath });
              }, function (error) {
                  rej(error);
              })
          }) */

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
        }).then(function () {
          return _this3.getInitScriptPromise({
            leafFolderName: leafFolderName,
            destFolderPath: destFolderPath
          });
        }).then(function (feed) {
          return Q.promise(function (rsv, rej) {
            fs.writeFile(localBashFilePath, feed, {
              encoding: 'utf8',
              mode: 420,
              flag: 'w'
            }, function (err, rst) {
              if (err) {
                rej(err);
              } else {
                rsv(rst);
              }
            });
          });
        }).then(function () {
          var remoteBashFilePath = "".concat(parentDestFolderPath).concat(destPathSep, "backupServer.sh"); // Path.resolve(parentDestFolderPath, 'backupServer.sh');

          return Q.promise(function (rsv, rej) {
            /* sshClient.putFile(localBashFilePath, remoteBashFilePath).then(function () {
                rsv({ destFilePath, msg: 'OK', zipPath });
            }, function (error) {
                rej(error);
            }) */
            sshClient.put(localBashFilePath, remoteBashFilePath).then(function () {
              rsv({
                destFilePath: destFilePath,
                msg: 'OK',
                zipPath: zipPath
              });
            }, function (error) {
              rej(error);
            });
          });
        })
        /* .then(() => { // WangFan TODO 2020-10-31 08:46:32
          return sshClient.execCommand('chmod +x backupServer.sh', { cwd: parentDestFolderPath })
        }).then(() => {
          return sshClient.execCommand('./backupServer.sh', { cwd: parentDestFolderPath });
        }) */

        /* .then(() => {
        const qAll = [];
        qAll.push( this.removeFilePromise(zipPath) );
        qAll.push( this.removeFilePromise(localBashFilePath) );
        return Q.all(qAll);
        }) */

        /* .then(() => {
        const deferred = Q.defer();
        setTimeout(function(){deferred.resolve()}, 10000);
        return deferred.promise;
        }) */

        /* .then(() => {
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
        }) */
        .then(function () {
          // sshClient.dispose();
          sshClient.end();
          rsvRoot({
            code: 111,
            msg: 'OK',
            tmpFolderPath: tmpFolderPath,
            localBashFilePath: localBashFilePath,
            zipPath: zipPath
          });
        }).done(null, function (err) {
          if (!err) {
            return;
          }

          console.error('#75', err);
          rsvRoot({
            code: 110,
            msg: 'ERROR'
          });
        });
      });
    }
  }]);
  return Deploy;
}();

module.exports = Deploy;
//# sourceMappingURL=deploy.js.map
