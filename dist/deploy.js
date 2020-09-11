"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _q = _interopRequireDefault(require("q"));

var _zipFolder = _interopRequireDefault(require("zip-folder"));

var _lodash = _interopRequireDefault(require("lodash"));

var _hdlUtil = _interopRequireDefault(require("./helpers/hdlUtil"));

var _fsUtil = _interopRequireDefault(require("./helpers/fsUtil"));

var _nodeSsh = require("node-ssh");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

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

      if (!_hdlUtil["default"].getDeepVal(args, fd)) {
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
        return _q["default"].resolve(this.args.initScript);
      } // const destFolderPath = this.args.destFolderPath;


      var author = this.args.author;
      return _q["default"].promise(function (rsv, rej) {
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
      return _q["default"].promise(function (rsv
      /* , rej */
      ) {
        // eslint-disable-next-line no-sync
        if (!_fs["default"].existsSync(filePath)) {
          return rsv("removeFilePromise #111 not found: ".concat(filePath));
        }

        _fs["default"].unlink(filePath, function (err) {
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
      return _q["default"].promise(function (rsv, rej) {
        // delete directory recursively
        _fs["default"].rmdir(folerPath, {
          recursive: true
        }, function (err) {
          if (err) {
            console.error("fail to delete ".concat(folerPath, ", ERROR:"), err);
            rej(err);
          } else {
            console.log(_hdlUtil["default"].date2string(new Date(), 'ms'), "#268 ".concat(folerPath, " is deleted!"));
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

  }, {
    key: "zipFolderHandler",
    value: function zipFolderHandler(folderPath) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (_lodash["default"].endsWith(folderPath, _path["default"].sep)) {
        folderPath = folderPath.slice(0, folderPath.length - 1);
      }

      var zipPath = _lodash["default"].trim(_hdlUtil["default"].getDeepVal(options, 'zipPath') || "".concat(folderPath, ".zip"));

      return _q["default"].promise(function (rsv, rej) {
        // eslint-disable-next-line no-sync
        if (!_fs["default"].existsSync(folderPath)) {
          return rsv({
            code: 113
          });
        }

        (0, _zipFolder["default"])(folderPath, zipPath, function (err) {
          if (err) {
            rej(err);
          } else {
            rsv({
              code: 111,
              zipPath: zipPath
            });
          }
        });
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

      var lastSlashIdx = srcFolderPath.lastIndexOf(_path["default"].sep);

      if (lastSlashIdx === srcFolderPath.length - 1) {
        lastSlashIdx = srcFolderPath.slice(0, -1).lastIndexOf(_path["default"].sep);
      }

      var leafFolderName = srcFolderPath.slice(lastSlashIdx + 1);

      if (_hdlUtil["default"].endsWith(leafFolderName, _path["default"].sep)) {
        leafFolderName = leafFolderName.slice(0, leafFolderName.length - 1);
      }

      var zipFileName = "".concat(leafFolderName, ".zip");
      var parentFolderPath = srcFolderPath.slice(0, lastSlashIdx);

      var zipPath = _path["default"].resolve(parentFolderPath, zipFileName);

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

      var localBashFilePath = _path["default"].resolve(__dirname, '.backupServer.sh');

      var _this = this;

      var toPrint;
      return _q["default"].promise(function (rsvRoot, rejRoot) {
        (function () {
          // eslint-disable-next-line no-sync
          if (_fs["default"].existsSync(zipPath) && !preparedZipPath) {
            // 不删除同一批任务留下的压缩包
            return _this3.removeFilePromise(zipPath);
          } else {
            return _q["default"].resolve(null);
          }
        })().then(function () {
          if (_hdlUtil["default"].oType(modifiedHours) === 'number') {
            if (preparedZipPath && _fs["default"].existsSync(zipPath)) {
              // 不重复制作压缩包
              return preparedTmpFolderPath;
            }

            return _fsUtil["default"].copyFilteredFilesPromise(srcFolderPath, modifiedHours);
          } else {
            return;
          }
        }).then(function (feed) {
          var thePath;

          if (feed) {
            thePath = tmpFolderPath = feed;
          } else {
            thePath = srcFolderPath;
          }

          if (_fs["default"].existsSync(zipPath) && preparedZipPath) {
            // 不重复制作压缩包
            return;
          }

          return _this3.zipFolderHandler(thePath, {
            zipPath: zipPath
          });
        }).then(function () {
          if (!privateKeyPath || !_fs["default"].existsSync(privateKeyPath)) {
            if (password) {
              return null;
            } else {
              return _q["default"].reject({
                code: 110,
                msg: 'no password'
              });
            }
          }

          return _q["default"].promise(function (rsv, rej) {
            _fs["default"].readFile(privateKeyPath, 'utf8', function (err, rst) {
              if (err) {
                return rej(err);
              }

              rsv(rst);
            });
          });
        }).then(function (feed) {
          _this.ssh = new _nodeSsh.NodeSSH();
          var sshOptions = {
            host: host,
            port: port,
            username: username
          };

          if (feed) {
            sshOptions.privateKey = feed;
          } else {
            sshOptions.password = password;
          }

          var sshOptionsCopy = _objectSpread({}, sshOptions);

          delete sshOptionsCopy.privateKey;
          toPrint = {
            host: host,
            port: port,
            username: username
          };
          return _this.ssh.connect(sshOptions);
        }).then(function () {
          if (toPrint) {
            console.log(_hdlUtil["default"].date2string(new Date(), 'ms'), 'SSH Login:', toPrint);
          }

          return _q["default"].promise(function (rsv, rej) {
            _this.ssh.putFile(zipPath, destFilePath).then(function () {
              rsv({
                destFilePath: destFilePath,
                msg: 'OK',
                zipPath: zipPath
              });
            }, function (error) {
              rej(error);
            });
          });
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
          return _q["default"].promise(function (rsv, rej) {
            _fs["default"].writeFile(localBashFilePath, feed, {
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

          return _q["default"].promise(function (rsv, rej) {
            _this.ssh.putFile(localBashFilePath, remoteBashFilePath).then(function () {
              rsv({
                destFilePath: destFilePath,
                msg: 'OK',
                zipPath: zipPath
              });
            }, function (error) {
              rej(error);
            });
          });
        }).then(function () {
          return _this.ssh.execCommand('chmod +x backupServer.sh', {
            cwd: parentDestFolderPath
          });
        }).then(function () {
          return _this.ssh.execCommand('./backupServer.sh', {
            cwd: parentDestFolderPath
          });
        })
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
          _this.ssh.dispose();

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
