"use strict";

var _this = void 0;

// import Q from 'q';
// import hdlUtil from './hdlUtil';
// import _L from 'lodash';
// import fs from 'fs';
// import Path from "path";
var Q = require('q');

var hdlUtil = require('./hdlUtil'); // const _L = require('lodash');


var fs = require('fs');

var Path = require('path');

var COPYFILE_EXCL = fs.constants.COPYFILE_EXCL;

var getFileSeparator = function getFileSeparator(filePath) {
  if (!filePath) {
    filePath = '';
  }

  var regex = new RegExp('^[C-Z]:\\\\');

  if (regex.test(filePath)) {
    return '\\';
  } else {
    return '/';
  }
};
/** 
 * 创建文件夹
 * @param url
 * @param mode
 * cb 调用时不传
 */


var mkdirSync = function mkdirSync(url, mode, cb) {
  var fileSeparator = getFileSeparator(url);
  var arr = url.split(fileSeparator);
  mode = mode || 493;

  cb = cb || function () {};

  if (arr[0] === ".") {
    // 处理 ./aaa
    arr.shift();
  }

  if (arr[0] === "..") {
    // 处理 ../ddd/d
    arr.splice(0, 2, arr[0] + fileSeparator + arr[1]);
  }

  function inner(cur) {
    if (cur && !fs.existsSync(cur)) {
      // 不存在就创建一个
      fs.mkdirSync(cur, mode);
    }

    if (arr.length) {
      inner(cur + fileSeparator + arr.shift());
    } else {
      cb();
    }
  }

  arr.length && inner(arr.shift());
};

module.exports.mkdirSync = mkdirSync;
/** 
 * options.overwrite: "Y", No error will be reported
 */

var copyFilePromise = function copyFilePromise(oldPath, newPath) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return Q.promise(function (rsv, rej) {
    var callback = function callback(err) {
      if (err) {
        rej(err);
      } else {
        rsv(null);
      }
    };

    if (options.overwrite === 'Y') {
      fs.copyFile.call(_this, oldPath, newPath, callback);
    } else {
      fs.copyFile.call(_this, oldPath, newPath, COPYFILE_EXCL, callback);
    }
  });
};

module.exports.copyFilePromise = copyFilePromise;

var listStatsPromise = function listStatsPromise(folderPath, filterHandler) {
  return Q.promise(function (rsv_root, rej_root) {
    var fileNames = [];
    Q.promise(function (rsv, rej) {
      fs.readdir(folderPath, function (err, rsp) {
        if (err) {
          return rej(err);
        }

        rsv(rsp);
      });
    }).then(function (feed) {
      if (feed.length < 1) {
        rsv_root(null);
        return Q.reject(null);
      }

      fileNames = feed;
      var q_all = feed.map(function (elem) {
        return Q.promise(function (rsv, rej) {
          var filePath = folderPath + Path.sep + elem;
          fs.stat(filePath, function (err, rsp) {
            if (err) {
              return rej(err);
            }

            rsv(rsp);
          });
        });
      });
      return Q.all(q_all);
    }).then(function (feed) {
      var now = new Date();
      feed.forEach(function (elem, i) {
        if (elem.birthtime instanceof Date) {
          elem.life = hdlUtil.getTimeGap(elem.birthtime, now);
        }

        elem.fname = fileNames[i];
        elem.isFile = elem.isFile();
        elem.isDirectory = elem.isDirectory();
        elem.isSymbolicLink = elem.isSymbolicLink();
      });

      if (filterHandler && filterHandler instanceof Function) {
        feed = feed.filter(filterHandler);
      }

      rsv_root(feed);
    }, function (err) {
      if (!err) {
        return;
      }

      rej_root(err);
    });
  });
};

module.exports.listStatsPromise = listStatsPromise;
/**
 * Breadth-first search files
 */

var listFilteredFilesPromise = function listFilteredFilesPromise(_ref) {
  var folderPath = _ref.folderPath,
      filterHandler = _ref.filterHandler,
      isRecur = _ref.isRecur;

  var recurHandler = function recurHandler(rsv, rej, subFolderPath, filterHandler) {
    var stats = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
      depth: 0,
      results: [],
      sameLevel: [],
      nextLevel: []
    };
    listStatsPromise(subFolderPath, function (a) {
      return a.isDirectory;
    }).then(function (feed) {
      feed.forEach(function (a) {
        stats.nextLevel.push(Path.resolve(subFolderPath, a.fname));
      });
      return listStatsPromise(subFolderPath, filterHandler);
    }).then(function (feed) {
      feed.forEach(function (a) {
        a.absPath = Path.resolve(subFolderPath, a.fname);
        a.depth = stats.depth;
        stats.results.push(a);
      });

      if (stats.sameLevel.length > 0) {
        var _nextFolderPath = stats.sameLevel.shift();

        recurHandler(rsv, rej, _nextFolderPath, filterHandler, stats);
        return Q.reject(null);
      }

      if (stats.nextLevel.length < 1 || !isRecur) {
        rsv(stats.results);
        return Q.reject(null);
      }

      stats.sameLevel = stats.nextLevel;
      stats.nextLevel = [];
      stats.depth = stats.depth + 1;
      var nextFolderPath = stats.sameLevel.shift();
      recurHandler(rsv, rej, nextFolderPath, filterHandler, stats);
    }).done(null, function (err) {
      if (!err) {
        return;
      }

      rej(err);
    });
  };

  return Q.promise(function (rsvRoot, rejRoot) {
    recurHandler(rsvRoot, rejRoot, folderPath, filterHandler);
  });
};

module.exports.listFilteredFilesPromise = listFilteredFilesPromise;
/**
 * Recursively find out the modified files within limit hours and copy them to the temporary folder
 * @param {Number} hours select files modified within limit hours
 */

module.exports.copyFilteredFilesPromise = function (folderPath, hours) {
  var tmpFolderPath, results;
  return Q.promise(function (rsv, rej) {
    listFilteredFilesPromise({
      folderPath: folderPath,
      filterHandler: function filterHandler(a) {
        return a.isFile && a.mtime && hdlUtil.getTimeGap(a.mtime, new Date(), 'h') < 24;
      },
      isRecur: true
    }).then(function (feed) {
      var folderName = Path.basename(folderPath);
      var parentFolderPath = Path.dirname(folderPath);
      tmpFolderPath = Path.resolve(parentFolderPath, ".".concat(folderName));

      if (!fs.existsSync(tmpFolderPath)) {
        mkdirSync(tmpFolderPath);
      }

      results = feed.map(function (a) {
        var b = {};
        b.depth = a.depth;
        b.absPath = a.absPath;
        b.destPath = a.absPath.replace(folderPath, tmpFolderPath);
        b.fname = a.fname;
        return b;
      });
      var qAll = results.map(function (a) {
        var dir = Path.dirname(a.destPath);

        if (!fs.existsSync(dir)) {
          mkdirSync(dir);
        }

        return copyFilePromise(a.absPath, a.destPath, {
          overwrite: 'Y'
        });
      });
      return Q.all(qAll);
    }).then(function () {
      var modFiles = results.map(function (a) {
        return a.absPath;
      });
      console.log("modified files within ".concat(hours, ":"), modFiles);
      rsv(tmpFolderPath);
    }).done(null, function (err) {
      console.error('copyFilteredFiles #74', err);
      rej(err);
    });
  });
};
//# sourceMappingURL=fsUtil.js.map
