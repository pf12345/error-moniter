'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const defaultErrorData = {
    msg: '',
    url: '',
    line: '',
    col: '',
    stack: '',
    from: ''
};

let options; // 存储用户信息
// get userInfo
const getOptions = () => {
    return options;
};
const setOptions = (opt) => {
    options = Object.assign({
        user: {}
    }, opt);
};
const getDefaultError = () => {
    return {
        userAgent: window.navigator.userAgent,
        location: window.location,
        ...getOptions(),
    };
};
const processError = (error) => {
    try {
        if (error.stack) {
            const stacks = error.stack.match("https?://[^\n]+");
            const url = stacks ? stacks[0] : "";
            let rowCols = url.match(":(\\d+):(\\d+)") || [];
            if (!rowCols) {
                rowCols = ['0', '0', '0'];
            }
            var stack = error.stack;
            return {
                msg: stack,
                line: rowCols[1],
                col: rowCols[2],
                target: url.replace(rowCols[0], "").replace(')', ''),
                _orgMsg: error.toString()
            };
        }
        else {
            //ie 独有 error 对象信息，try-catch 捕获到错误信息传过来，造成没有msg
            if (error.name && error.message && error.description) {
                return {
                    msg: JSON.stringify(error)
                };
            }
            return error;
        }
    }
    catch (err) {
        return error;
    }
};

const collectionWindowError = (resolve) => {
    const callback = window.onerror || function () { };
    window.onerror = (msg, url, line, col, error) => {
        const newError = processError(error);
        const data = Object.assign(defaultErrorData, getDefaultError(), {
            msg,
            path: url,
            line,
            col,
            error: newError,
            stack: newError ? newError.msg : '',
            type: 'WINDOW',
            from: 'window onError'
        });
        callback && callback.call(window, msg, url, line, col, error);
        resolve(data);
    };
};

const collectionConsoleError = (resolve) => {
    const callback = console.error || function () { };
    console.error = function (error) {
        const newError = processError(error);
        const data = Object.assign(defaultErrorData, getDefaultError(), {
            error: error.stack || error,
            msg: newError ? newError.msg : '',
            col: newError.col,
            line: newError.line,
            stack: newError._orgMsg,
            path: newError.target,
            type: 'CONSOLE',
            from: 'console error',
        });
        callback && callback.call(window, error);
        resolve(data);
    };
};

const collectionPromiseError = (resolve) => {
    window.addEventListener('unhandledrejection', event => {
        const newError = processError(event.reason);
        const data = Object.assign(defaultErrorData, getDefaultError(), {
            error: newError,
            stack: newError ? newError.msg : '',
            ...newError,
            type: 'PROMISE',
            from: 'promise onError'
        });
        resolve(data);
    });
};

const tagNameMaps = {
    SCRIPT: 'js',
    IMG: 'image',
    LINK: 'css'
};
const collectionCdnError = (resolve) => {
    window.addEventListener('error', (event) => {
        const node = event.srcElement;
        if (node) {
            const tagName = node.tagName || '';
            const tagNameUpper = tagName.toUpperCase();
            let url = '';
            switch (tagNameUpper) {
                case 'IMG':
                case 'SCRIPT':
                    url = node.getAttribute('src') || '';
                    break;
                case 'LINK':
                    url = node.getAttribute('href') || '';
                    break;
            }
            const data = Object.assign(defaultErrorData, getDefaultError(), {
                url,
                tagName: tagNameMaps[tagNameUpper],
                type: 'CDN',
                from: 'cdn onError'
            });
            resolve(data);
        }
    }, true);
};

const collectionPerformace = (resolve) => {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const { domainLookupStart, domainLookupEnd, // 域名解析时间
            connectStart, connectEnd, // TCP建立连接
            secureConnectionStart, // 建立安全连接
            requestStart, // 请求建立
            responseStart, // 开始传输
            responseEnd, // 传输结束
            domInteractive, // 开始解析
            domLoading, domComplete, //解析完成
            fetchStart, // 浏览器准备好使用HTTP请求来获取(fetch)文档时间
            domContentLoadedEventEnd, loadEventEnd // 资源加载完成
             } = window.performance.timing;
            // dns查询时间
            const dnsLookup = domainLookupEnd - domainLookupStart;
            // 建立tcp连接
            const tcpConnect = connectEnd - connectStart;
            // SSL连接
            const sslConnect = secureConnectionStart ? requestStart - secureConnectionStart : 0;
            // 文档请求建立时间
            const requestConnect = responseStart - requestStart;
            // 文档传输时间
            const domContentLoad = responseEnd - responseStart;
            // 白屏时间: 当前网页DOM结构结束解析、开始加载内嵌资源时间 - 开始请求网页时间
            const blank = domInteractive - fetchStart;
            // 文档解析解析时间：文档解析完成时间 - DOM结构开始解析时间
            const domParse = domComplete - domLoading;
            // dom ready时间：脚本已经被执行 - 开始请求网页时间
            const domready = domContentLoadedEventEnd - fetchStart;
            // 资源加载时间：加载事件完成 - 开始加载内嵌资源时间
            const resourceLoad = loadEventEnd - domInteractive;
            // 整体加载完成，包括dom及资源
            const completeLoaded = loadEventEnd - fetchStart;
            const data = Object.assign(getDefaultError(), {
                type: 'PERFORMACE',
                dnsLookup, tcpConnect, sslConnect, requestConnect, domContentLoad, domParse, resourceLoad, blank, domready, completeLoaded,
                from: 'performance timing'
            });
            resolve(data);
        }, 500);
    }, true);
};

/**
 * 目前无法实现对跨域的收集
 * @param resolve
 */
const collectionXmlHttpRequestError = (resolve) => {
    if (!window.XMLHttpRequest) {
        return;
    }
    const xmlHttp = window.XMLHttpRequest;
    const oldSend = xmlHttp.prototype.send;
    const handleError = function (event) {
        if (event && event.currentTarget && event.currentTarget.status !== 200) {
            const node = event.srcElement;
            const data = Object.assign(defaultErrorData, getDefaultError(), {
                url: node.responseURL || '',
                status: node.status,
                statusText: node.statusText,
                type: 'XMLHttpRequest',
                from: 'XMLHttpRequest onError'
            });
            resolve(data);
        }
    };
    xmlHttp.prototype.send = function () {
        if (this['addEventListener']) {
            this['addEventListener']('error', handleError);
            this['addEventListener']('load', handleError);
            this['addEventListener']('abort', handleError);
        }
        else {
            const oldStateChange = this['onreadystatechange'];
            this['onreadystatechange'] = function (event) {
                console.log('onreadystatechange', event);
                if (this.readyState === 4) {
                    handleError(event);
                }
                oldStateChange && oldStateChange.call(this, event);
            };
        }
        return oldSend.call(this, ...arguments);
    };
    console.log(xmlHttp.prototype);
};

/**
 * 目前无法获取详细的异常信息
 * @param resolve
 */
const collectionFetchRequestError = (resolve) => {
    if (!window.fetch) {
        return;
    }
    const oldFetch = window.fetch;
    const win = window;
    win.fetch = function () {
        const args = arguments;
        return oldFetch.apply(this, args).then(res => {
            if (!res.ok) {
                const data = Object.assign({}, getDefaultError(), {
                    url: res.url || '',
                    status: res.status,
                    statusText: res.statusText,
                    arguments: [...arguments],
                    type: 'fetch',
                    from: 'fetch Error'
                });
                resolve(data);
            }
            return res;
        }).catch(error => {
            // 上报错误
            const data = Object.assign({}, getDefaultError(), {
                stack: error.stack || '',
                msg: error.msg || '',
                type: 'fetch',
                from: 'fetch Error',
                arguments: [...arguments]
            });
            resolve(data);
            throw error;
        });
    };
};

// init collcetion
const initCollection = (options) => {
    setOptions(options);
};

exports.collectionCdnError = collectionCdnError;
exports.collectionConsoleError = collectionConsoleError;
exports.collectionFetchRequestError = collectionFetchRequestError;
exports.collectionPerformace = collectionPerformace;
exports.collectionPromiseError = collectionPromiseError;
exports.collectionWindowError = collectionWindowError;
exports.collectionXmlHttpRequestError = collectionXmlHttpRequestError;
exports.initCollection = initCollection;
