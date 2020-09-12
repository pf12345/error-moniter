import { defaultErrorData } from './defaultData';
import { getDefaultError } from './util';
import { Fn } from './types';

/**
 * 目前无法实现对跨域的收集
 * @param resolve 
 */
export const collectionXmlHttpRequestError = (resolve: Fn) => {
  if (!window.XMLHttpRequest) {
    return;
  }
  const xmlHttp = window.XMLHttpRequest;
  const oldSend = xmlHttp.prototype.send;
  const handleError = function(event:any) {
    if (event && event.currentTarget && event.currentTarget.status !== 200) {
      const node = event.srcElement;
      const data: object = Object.assign(defaultErrorData, getDefaultError(), {
        url: node.responseURL || '',
        status: node.status,
        statusText: node.statusText,
        type: 'XMLHttpRequest',
        from: 'XMLHttpRequest onError'
      });
  
      resolve(data);
    }
  }
  xmlHttp.prototype.send = function () {
    if (this['addEventListener']) {
      this['addEventListener']('error', handleError);
      this['addEventListener']('load', handleError);
      this['addEventListener']('abort', handleError);
    } else {
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
  }

  console.log(xmlHttp.prototype)
}