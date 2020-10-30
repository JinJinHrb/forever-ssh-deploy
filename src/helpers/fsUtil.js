// import Q from 'q';
// import hdlUtil from './hdlUtil';
// import _L from 'lodash';
// import fs from 'fs';
// import Path from "path";

const Q = require('q');
const hdlUtil = require('./hdlUtil');
// const _L = require('lodash');
const fs = require('fs');
const Path = require('path');

const {COPYFILE_EXCL} = fs.constants;

const getFileSeparator = (filePath) => {
    if(!filePath){
        filePath = '';
    }
    const regex = new RegExp('^[C-Z]:\\\\');
    if(regex.test(filePath)){
        return '\\';
    }else{
        return '/';
    }
}

/** 
 * 创建文件夹
 * @param url
 * @param mode
 * cb 调用时不传
 */
const mkdirSync = function(url, mode, cb){
    const fileSeparator = getFileSeparator(url);
    var arr = url.split(fileSeparator);
    mode = mode || 0o755;
    cb = cb || function(){};
    if(arr[0]==="."){ // 处理 ./aaa
        arr.shift();
    }
    if(arr[0] === ".."){ // 处理 ../ddd/d
        arr.splice(0,2,arr[0]+ fileSeparator +arr[1])
    }
    function inner(cur){
        if(cur && !fs.existsSync(cur)){ // 不存在就创建一个
            fs.mkdirSync(cur, mode)
        }
        if(arr.length){
            inner(cur + fileSeparator +arr.shift());
        }else{
            cb();
        }
    }
    arr.length && inner(arr.shift());
}
module.exports.mkdirSync = mkdirSync;

/** 
 * options.overwrite: "Y", No error will be reported
 */
const copyFilePromise = (oldPath, newPath, options={}) => {
    return Q.promise((rsv, rej) => {
        const callback = function(err){
            if(err){
                rej(err)
            }else{
                rsv(null)
            }
        }
        if(options.overwrite === 'Y'){
            fs.copyFile.call(this, oldPath, newPath, callback);
        }else{
            fs.copyFile.call(this, oldPath, newPath, COPYFILE_EXCL, callback);
        }
    })
}
module.exports.copyFilePromise = copyFilePromise;

const listStatsPromise = (folderPath, filterHandler) => {
    return Q.promise((rsv_root, rej_root) => {
        let fileNames = [];
        Q.promise(function(rsv, rej){
            fs.readdir(folderPath, function(err, rsp){
                if(err){
                    return rej(err);
                }
                rsv(rsp);
            })
        }).then(function(feed){
            if(feed.length < 1){
                rsv_root(null);
                return Q.reject(null);
            }
            fileNames = feed;
            var q_all = feed.map(function(elem){
                return Q.promise(function(rsv, rej){
                    var filePath = folderPath + Path.sep + elem;
                    fs.stat(filePath, function(err, rsp){
                        if(err){
                            return rej(err);
                        }
                        rsv(rsp);
                    })
                });
            })
            return Q.all(q_all);
        }).then(function(feed){
            var now = new Date();
            feed.forEach(function(elem, i){
                if(elem.birthtime instanceof Date){
                    elem.life = hdlUtil.getTimeGap(elem.birthtime, now);
                }
                elem.fname = fileNames[i];
                elem.isFile = elem.isFile();
                elem.isDirectory = elem.isDirectory();
                elem.isSymbolicLink = elem.isSymbolicLink();
            });
            if(filterHandler && filterHandler instanceof Function){
                feed = feed.filter(filterHandler);
            }
            rsv_root(feed);
        }, err => {
            if(!err){
                return;
            }
            rej_root(err);
        })
    })
}
module.exports.listStatsPromise = listStatsPromise;

/**
 * Breadth-first search files
 */
const listFilteredFilesPromise = ({folderPath, filterHandler, isRecur}) => {
    const recurHandler = function( rsv, rej, subFolderPath, filterHandler, stats = {depth: 0, results: [], sameLevel: [], nextLevel: []} ){
        listStatsPromise(subFolderPath, a => a.isDirectory).then(feed => {
            feed.forEach(a => {
                stats.nextLevel.push(Path.resolve(subFolderPath, a.fname));
            })
            return listStatsPromise(subFolderPath, filterHandler);
        }).then(feed => {
            feed.forEach(a => {
                a.absPath = Path.resolve(subFolderPath, a.fname);
                a.depth = stats.depth;
                stats.results.push(a);
            })
            if(stats.sameLevel.length > 0){
                const nextFolderPath = stats.sameLevel.shift();
                recurHandler( rsv, rej, nextFolderPath, filterHandler, stats );
                return Q.reject(null);
            }
            if(stats.nextLevel.length < 1 || !isRecur){
                rsv(stats.results);
                return Q.reject(null);
            }
            stats.sameLevel = stats.nextLevel;
            stats.nextLevel = [];
            stats.depth = stats.depth + 1;
            const nextFolderPath = stats.sameLevel.shift();
            recurHandler( rsv, rej, nextFolderPath, filterHandler, stats );
        }).done(null, err => {
            if(!err){
                return;
            }
            rej(err);
        })
    }
    return Q.promise((rsvRoot, rejRoot) => {
        recurHandler(rsvRoot, rejRoot, folderPath, filterHandler);
    })
}
module.exports.listFilteredFilesPromise = listFilteredFilesPromise;

/**
 * Recursively find out the modified files within limit hours and copy them to the temporary folder
 * @param {Number} hours select files modified within limit hours
 */
module.exports.copyFilteredFilesPromise = function(folderPath, hours){
    let tmpFolderPath, results;
    return Q.promise((rsv, rej) => {
        listFilteredFilesPromise({folderPath, filterHandler: a => a.isFile && a.mtime && hdlUtil.getTimeGap(a.mtime, new Date(), 'h') < 24, isRecur: true}).then(feed => {
            const folderName = Path.basename(folderPath);
            const parentFolderPath = Path.dirname(folderPath);
            tmpFolderPath = Path.resolve(parentFolderPath, `.${folderName}`);
            if(!fs.existsSync(tmpFolderPath)){
                mkdirSync(tmpFolderPath);
            }
            results = feed.map(a => {
                const b = {};
                b.depth = a.depth;
                b.absPath = a.absPath;
                b.destPath = a.absPath.replace(folderPath, tmpFolderPath);
                b.fname = a.fname;
                return b;
            })
            const qAll = results.map(a => {
                const dir = Path.dirname(a.destPath);
                if(!fs.existsSync(dir)){
                    mkdirSync(dir);
                }
                return copyFilePromise(a.absPath, a.destPath, {overwrite: 'Y'});
            });
            return Q.all(qAll);
        }).then(() => {
            const modFiles = results.map(a => a.absPath);
            console.log(`modified files within ${hours}:`, modFiles);
            rsv(tmpFolderPath)
        }).done(null, err => {
            console.error('copyFilteredFiles #74', err);
            rej(err);
        })
    })
}