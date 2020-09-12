import { getDefaultError } from './util';
import { Fn } from './types';

/**
 * 目前无法获取详细的异常信息
 * @param resolve 
 */
export const collectionFetchRequestError = (resolve: Fn) => {
  if (!window.fetch) {
    return
  }
  const oldFetch = window.fetch;
  const win: any = window;
  win.fetch = function() {
    const args:any = arguments;
    return oldFetch.apply(this, args).then(res => {
      if(!res.ok) {
        const data: object = Object.assign({}, getDefaultError(), {
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
    })
  }
}