import { getDefaultError } from './util';
import { Fn } from './types';

export const collectionPerformace = (resolve: Fn) => {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const {
        domainLookupStart, domainLookupEnd, // 域名解析时间
        connectStart, connectEnd, // TCP建立连接
        secureConnectionStart, // 建立安全连接
        requestStart, // 请求建立
        responseStart, // 开始传输
        responseEnd, // 传输结束
        domInteractive, // 开始解析
        domLoading,
        domComplete, //解析完成
        fetchStart, // 浏览器准备好使用HTTP请求来获取(fetch)文档时间
        domContentLoadedEventEnd,
        loadEventEnd // 资源加载完成
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
  
      const data: object = Object.assign(getDefaultError(), {
        type: 'PERFORMACE',
        dnsLookup, tcpConnect, sslConnect, requestConnect, domContentLoad, domParse, resourceLoad, blank, domready, completeLoaded,
        from: 'performance timing'
      });
  
      resolve(data)
    }, 500)
  }, true);
}