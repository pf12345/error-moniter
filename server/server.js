var path = require('path');
var express = require('express');
var router = express.Router();
var moment = require('moment');
var fs = require('fs');
var request = require('request');
var sourcemap = require('./../public/source-map.js');
var resolve = file => path.resolve(__dirname, file);
var log = require('./log.js');

// 保存错误日志
router.get('/saveWebSysErrorLog', function(req, res) {
	var report = req.query.report, 
		line, 
		column, 
		fileName, 
		_arr, mapPath;

	try {
		report = report = JSON.parse(report);
		setReportOtherInfo(req, report);
		line = report.line;
		column = report.col;
		mapPath = (fileName = report.path ? ((_arr = report.path.split('/')) && _arr[_arr.length - 1]) : '') 
				&& resolve('./../dist/static/js'+(report.path.match('chunk') ? 'chunk/' : '')+fileName+'.map'),
		logPath = resolve('./../logs/' + moment().format('YYYY-MM-DD') + '.js'),
		logDirPath = resolve('./../logs/');
	}catch(e) {
		log.error(e);
	}
	
	try {
		if(line && column && mapPath) {
			fileExist(logDirPath).then(function() {
				// 存在logs文件夹
				return new Promise(function(resolve) {
					resolve();
				})
			}, function(exists, cb) {
				// 不存在logs文件夹
				if(exists != undefined) {
					return new Promise(function(resolve, reject) {
						fs.mkdir(logDirPath, function (err) {
						  if(err) {
						  	log.error(err);
						  	reject();
						  } else {
						  	resolve();
						  }
						});
					})
				}
			}).then(function() {
				// 是否存在source map文件
				return fileExist(mapPath);
			}).then(function() {
				// 存在source map文件
				var smc = new sourcemap.SourceMapConsumer(fs.readFileSync(resolve(mapPath),'utf8'));
				var ret = smc.originalPositionFor({
					line: line,
					column: column
				});
				report.ret = ret;
				// 是否存在日志文件
				return fileExist(logPath);
			}, function() {
				// 是否存在日志文件
				return fileExist(logPath);
			}).then(function() {
				var w_data = new Buffer(JSON.stringify(report));
				// 存在日志文件，直接在文件后继续添加
				fs.appendFile(logPath, ',' + JSON.stringify(report), function (err) {
					if(err) {
						log.error(err);
					}
				})
			}, function(exists) {
				var w_data = new Buffer(JSON.stringify(report));
					// 不存在日志文件，直接创建文件后添加
					return new Promise(function(resolve, reject) {
						fs.writeFile(logPath, w_data, {flag: 'a'}, function (err) {
							if(err) {
								log.error(err);
							} else {
								resolve();
							}
						})
					})
			}).then(function() {
				// 检测logs文件夹目录信息
				return readLogsDir(resolve('./../logs/'));
			}).then(function(files) {
				// logs文件夹文件数超过60，自动删除文件
				if(files.length > 60) {
					return deleteLogFile(resolve('./../logs/' + files.shift()));
				} else {
					return new Promise(function(resolve, reject) {
						reject();
					})
				}
			}).then(function(filePath) {
				log.log('成功删除文件：' + filePath, {
					file: 'webErrorLog.js',
					line: 96
				});
			})
		}
	} catch(e) {
		log.error(e);
	}
	res.send({
		result: 'ok'
	});
})

//查看错误日志
router.get('/showLog/:date', function(req, res) {
	let date = req.params.date;
	let jsPath = resolve('./../logs/' + date + '.js');
	fileExist(jsPath).then(function() {
		fs.readFile(jsPath, {flag: 'r+', encoding: 'utf8'}, function(err, data) {
			if(err) {
				res.send({
					result: 'FALSE',
					error: err
				})
			} else {
				var _data = '[' + data + ']';
				try {
					res.render('./../template/log.ejs', {
						data: JSON.parse(_data)
					});
				}catch(e) {
					log.error(e);
					res.send({
						result: 'FALSE',
						error: e
					})
				}
			}
		})
	}, function() {
		res.send({
			result: 'FALSE',
			error: '未检测到当前日期：'+ date +' 的错误日志'
		})
	})
})

// 获取日志文件夹目录
var readLogsDir = function(logDirPath) {
	return new Promise(function(resolve, reject) {
		fs.readdir(logDirPath, function(err, files) {
			if(err) {
				log.error(err);
				reject();
			} else {
				resolve(files);
			}
		})
	})
}

// 删除单个文件
var deleteLogFile = function(filePath) {
	return new Promise(function(resolve, reject) {
		fs.unlink(filePath, function(err, files) {
			if(err) {
				log.error(err);
				reject();
			} else {
				resolve(filePath);
			}
		})
	})
}

// 判断文件是否存在
var fileExist = function(path, cb) {
	return new Promise(function(resolve, reject) {
		if(path) {
			fs.exists(path, function(exists) {
				if(exists) {
					resolve(exists);
				} else {
					// console.log('no file: ' + path);
					reject();
				}
			})
		} else {
			reject();
		}
	})
}

var setReportOtherInfo = function(req, report) {
	report['navigator.userAgent'] = req.headers['user-agent'];
	report['url'] = req.headers['referer'];
	report['created'] = moment().format('YYYY-MM-DD HH:mm:ss');
}

module.exports = router;