import config from './../config';
import $ from 'jquery';

const errorData = {
	systemErrorUrl: `${config.errorLogUrl}/saveWebSysErrorLog`, //错误上报地址
	proxyConsole: true, //是否代理console下所有方法
	errorMessage: { // 错误日志信息
		msg: '',
		url: '', //错误来源页面url
		line: '',
		col: '',
		stack: '',
		from: '', // 错误来源
		"navigator.userAgent": '' //浏览器信息
	} 
}

const evtMoniterTypes = ['click', 'tap', 'input']; // 需要跟踪的用户事件

const isPro = process.env.NODE_ENV === 'production'; // production or development

const debug = {
	user: {

	}, // 用户信息
	evtMoniters: [], //用户事件监控数组
	maxError: 3, // 每个页面错误数
	currentError: 0, // 当前错误数
	init(user) {
		this.user = user || {};
		this.proxyWindowError()
		.proxyConsoleError()
		.evtMoniter();
	},
	// 用户操作跟踪
	evtMoniter() {
		if(EventTarget) {
			let original_addEventListener = EventTarget.prototype.addEventListener, self = this;
			EventTarget.prototype.addEventListener = function(type, listener, options) {
				let that = this;
				original_addEventListener.call(this, type, (function() {
					return function(evt) {
						if(evtMoniterTypes.indexOf(type) != -1) {
							let attrs = {}, _attrs = {};
							if(_attrs = that.attributes) {
								for(let key in _attrs) {
									if(_attrs[key]['value'] != undefined) {
										attrs[_attrs[key]['name']] = _attrs[key]['value'];
									}
								}
							}
							self.evtMoniters.push({
								node: {
									url: that.baseURI,
									nodeName: that.nodeName,
									attrs: attrs,
									textContent: that.textContent
								},
								type: type
							});
							if(self.evtMoniters.length > 10) {
								self.evtMoniters.shift();
							}
						}
						listener(evt);
					}
				})(), options);
			}
		}
		return this;
	},
	/*
	* 手动保存错误信息
	* error: Object 错误信息
	*/
	saveError(error) {
		let newError, _error = Object.assign({}, errorData.errorMessage, {
			error: error.stack || error,
			msg: (newError = debug.processError(error)) && newError.msg,
			col: newError.col,
			line: newError.line,
			stack: newError._orgMsg,
			path: newError.target,
			from: '自定义错误'
		})
		debug.sendSystermReport(_error);
	},
	// 代理window.onerror方法，可在里面做其他事情，如上报错误信息
	proxyWindowError() {
		let self = this, f_error = window.onerror;
		if(isPro) {
			window.onerror = function(msg, url, line, col, error) {
				let newError, _error = Object.assign({}, errorData.errorMessage, {
					msg,
					path: url,
					line,
					col,
					error: newError = self.processError(error),
					stack: newError ? newError.msg : '',
					from: 'window onError'
				});

				try {
					self.sendSystermReport(_error);
				} catch(e) {}

				f_error.call(window, msg, url, line, col, error);
				// console.log(_error);
			}
		} else {
			window.onError = function(msg, url, line, col, error) {
				console.log('windowError');
				f_error.call(window, msg, url, line, col, error);
			}
		}
		return this;
	},
	// 代理console.error方法，可在里面做其他事情，如上报错误信息
	proxyConsoleError() {
		var f_error = console.error, self = this;
		if(isPro) {
			console.error = function(error) {
				let newError, _error = Object.assign({}, errorData.errorMessage, {
					error: error.stack || error,
					msg: (newError = self.processError(error)) && newError.msg,
					col: newError.col,
					line: newError.line,
					stack: newError._orgMsg,
					path: newError.target,
					from: 'console error',
					evtMoniter: self.evtMoniters
				})

				try {
					// console.log(_error)
					self.sendSystermReport(_error);
				} catch(e) {}

				f_error.call(window, error);
			};
		} else {
			console.error = function(error) {
				console.log('consoleError');
				f_error.call(window, error);
			}
		}
		return this;
	},
	processError(errObj) {
		try {
			if (errObj.stack) {
				var url = errObj.stack.match("https?://[^\n]+");
				url = url ? url[0] : "";
				var rowCols = url.match(":(\\d+):(\\d+)");
				if (!rowCols) {
					rowCols = [0, 0, 0];
				}

				var stack = errObj.stack;
				return {
					msg: stack,
					line: rowCols[1],
					col: rowCols[2],
					target: url.replace(rowCols[0], "").replace(')', ''),
					_orgMsg : errObj.toString()
				};
			} else {
                //ie 独有 error 对象信息，try-catch 捕获到错误信息传过来，造成没有msg
                if (errObj.name && errObj.message && errObj.description) {
                	return {
                		msg: JSON.stringify(errObj)
                	};
                }
                return errObj;
            }
        } catch (err) {
        	return errObj;
        }
    },
    _get(url, cb) {
    	let xmlhttp;
    	if (window.XMLHttpRequest) {
    		xmlhttp=new XMLHttpRequest();
    	} else if (window.ActiveXObject) {
    		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    	}
    	if(xmlhttp) {
    		xmlhttp.onreadystatechange = function() {
    			if (xmlhttp.readyState == 4) {
    				if (xmlhttp.status == 200) {
    					if(cb && typeof cb === 'function') {
    						cb(xmlhttp.responseText)
    					}
    				}
    			}
    		};
    		xmlhttp.open("GET", url, true);
    		xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    		xmlhttp.send();
    	}
    },
    // 发送系统错误，来自window.onerror, console.error, 自定义错误;
    sendSystermReport(report) {
    	// console.log(report)
    	// 每个页面每次只能保存最多三个错误信息
    	if(report && typeof report === 'object' && (this.currentError <= this.maxError)) {
    		report.user = this.user;
    		this.currentError += 1;
    		this._get(errorData.systemErrorUrl + '?report='+JSON.stringify(report))
    	}
    }
}

export default debug;