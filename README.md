# 构建前端异常监控系统

### 背景

最近，刚到新公司，对公司产品进行前端重构；在来公司近一个月中，发现以前产品问题很多，尤其兼容性问题等；在以前项目中也会经常遇到，可能因为某个兼容性问题，导致js代码出错，从而导致整个应用无法运行；但市场上，无论是pc端还是移动端，会有各种不同的系统，不同的浏览器内核，不管是从开发还是测试，都无法完全去兼容和测试所有系统的问题；

所以，使用一个方法能够尽快的定位错误问题就变的紧急及必需；在有一天，看到有一篇专门谈“前端异常监控”的文章，在以前，也有关注此问题，但是从来没有真正去实现过。这次，借助重构机会，在新的架构中，进行前端异常监控系统的搭建，从而能够更快，更好的定位错误，能够更及时的处理错误；

### 实现功能

为了能够达到以上目的，异常监控系统至少应该包含以下几个基础功能：

- 前端错误日志收集，包括通过```window.onerror```及```console.error```报出的错误信息；
- 保存开发过程中的自定义错误，如```try{}catch(e){}```、调用第三方功能错误等；
- 后台保存日志数据(目前通过日志文件进行保存，根据日期，每天一个日志文件保存)；
- 后台对source map压缩文件进行还原定位处理；
- 日志查看，能够通过日期，快速、简明的查看每天的日志数据；
- 用户行为简单跟踪，主要包括点击、输入等操作；

因为错误发生原因很多，为了能够更好的定位错误发生原因及触发发生的时机，后面添加了用户行为跟踪数据，主要包括点击、输入等操作；

### 日志接口数据

```
errorData.errorMessage ＝ { // 错误日志信息
	msg: '',
	url: '', // 错误来源页面url
	line: '', // 错误行数
	col: '', // 错误列数
	stack: '',
	from: '', // 错误来源
	"navigator.userAgent": '', //浏览器信息
	ret: {}, // 解析source map后原始准确定位数据
	evtMoniter: [] //用户行为保存数组,保存最近10次行为操作
} 

```

### 前端错误拦截

对```window.onerror```进行拦截，方法是通过变量保存原生onerror方法，然后，重新定义onerror方法，在方法中进行错误拦截，然后再重新调用保存下的原生方法；对```console.error```使用同理方式处理即可；详细源码可见：[debug.js](https://github.com/pf12345/error-moniter/blob/master/debug.js);

```
debug = {
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
					self.sendSystermReport(_error); //发送报告到后台
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
	}
}
```

而对错误信息，会进行转化，返回最终的错误相关数据；包括错误的行数、列数、错误消息、错误文件等；

```
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
    }
```

### 对用户行为进行获取

用户行为包括用户的点击、输入等各种事件操作行为，所以，为了获取相关行为数据，必须去拦截所有页面上已经定义的操作事件，并在拦截函数中，获取相关的行为数据，这儿使用了```EventTarget```进行拦截，相关api说明可见：[EventTarget](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget)；

```
// 用户操作跟踪
	evtMoniter() {
		if(EventTarget) {
			let original_addEventListener = EventTarget.prototype.addEventListener, self = this;
			EventTarget.prototype.addEventListener = function(type, listener, options) {
				let that = this;
				original_addEventListener.call(this, type, (function() {
					return function(evt) {
					   // 需要跟踪的用户事件
					   // const evtMoniterTypes = ['click', 'tap', 'input']; 
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
									url: that.baseURI, //错误页面地址
									nodeName: that.nodeName, //事件节点名
									attrs: attrs, //事件节点属性列表
									textContent: that.textContent // 节点内容
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
	}
```

### 后台处理保存日志数据

后台主要对错误日志进行处理及保存，在处理时，需要处理将压缩、webpack编译过的错误文件能够精确定位的处理，就是如何才能从压缩过或者编译过的文件中，精确定位真正的错误文件呢？在浏览器中，如果你在打包时，开启了source map，它就可以进行精确定位；同理，可以使用source map，根据前端传的行数和列数，就可以进行精确定位；api参见：[source-map](https://www.npmjs.com/package/source-map)；更多源代码见：[server.js](https://github.com/pf12345/error-moniter/blob/master/server/server.js)

```
var smc = new sourcemap.SourceMapConsumer(fs.readFileSync(resolve(mapPath),'utf8'));
var ret = smc.originalPositionFor({
	line: line,
	column: column
});
report.ret = ret;
```

最后，就是将日志信息通过页面进行展示，能够更加简单的查看；
