"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _q = _interopRequireDefault(require("q"));

var _hdlUtil = _interopRequireDefault(require("./hdlUtil"));

var _lodash = _interopRequireDefault(require("lodash"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _this = void 0;

var COPYFILE_EXCL = _fs["default"].constants.COPYFILE_EXCL;

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
    if (cur && !_fs["default"].existsSync(cur)) {
      // 不存在就创建一个
      _fs["default"].mkdirSync(cur, mode);
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
  return _q["default"].promise(function (rsv, rej) {
    var callback = function callback(err) {
      if (err) {
        rej(err);
      } else {
        rsv(null);
      }
    };

    if (options.overwrite === 'Y') {
      _fs["default"].copyFile.call(_this, oldPath, newPath, callback);
    } else {
      _fs["default"].copyFile.call(_this, oldPath, newPath, COPYFILE_EXCL, callback);
    }
  });
};

module.exports.copyFilePromise = copyFilePromise;

var listStatsPromise = function listStatsPromise(folderPath, filterHandler) {
  return _q["default"].promise(function (rsv_root, rej_root) {
    var fileNames = [];

    _q["default"].promise(function (rsv, rej) {
      _fs["default"].readdir(folderPath, function (err, rsp) {
        if (err) {
          return rej(err);
        }

        rsv(rsp);
      });
    }).then(function (feed) {
      if (feed.length < 1) {
        rsv_root(null);
        return _q["default"].reject(null);
      }

      fileNames = feed;
      var q_all = feed.map(function (elem) {
        return _q["default"].promise(function (rsv, rej) {
          var filePath = folderPath + _path["default"].sep + elem;

          _fs["default"].stat(filePath, function (err, rsp) {
            if (err) {
              return rej(err);
            }

            rsv(rsp);
          });
        });
      });
      return _q["default"].all(q_all);
    }).then(function (feed) {
      var now = new Date();
      feed.forEach(function (elem, i) {
        if (elem.birthtime instanceof Date) {
          elem.life = _hdlUtil["default"].getTimeGap(elem.birthtime, now);
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
        stats.nextLevel.push(_path["default"].resolve(subFolderPath, a.fname));
      });
      return listStatsPromise(subFolderPath, filterHandler);
    }).then(function (feed) {
      feed.forEach(function (a) {
        a.absPath = _path["default"].resolve(subFolderPath, a.fname);
        a.depth = stats.depth;
        stats.results.push(a);
      });

      if (stats.sameLevel.length > 0) {
        var _nextFolderPath = stats.sameLevel.shift();

        recurHandler(rsv, rej, _nextFolderPath, filterHandler, stats);
        return _q["default"].reject(null);
      }

      if (stats.nextLevel.length < 1 || !isRecur) {
        rsv(stats.results);
        return _q["default"].reject(null);
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

  return _q["default"].promise(function (rsvRoot, rejRoot) {
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
  return _q["default"].promise(function (rsv, rej) {
    listFilteredFilesPromise({
      folderPath: folderPath,
      filterHandler: function filterHandler(a) {
        return a.isFile && a.mtime && _hdlUtil["default"].getTimeGap(a.mtime, new Date(), 'h') < 24;
      },
      isRecur: true
    }).then(function (feed) {
      var folderName = _path["default"].basename(folderPath);

      var parentFolderPath = _path["default"].dirname(folderPath);

      tmpFolderPath = _path["default"].resolve(parentFolderPath, ".".concat(folderName));

      if (!_fs["default"].existsSync(tmpFolderPath)) {
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
        var dir = _path["default"].dirname(a.destPath);

        if (!_fs["default"].existsSync(dir)) {
          mkdirSync(dir);
        }

        return copyFilePromise(a.absPath, a.destPath, {
          overwrite: 'Y'
        });
      });
      return _q["default"].all(qAll);
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
