import { defaultErrorData } from './defaultData';
import { processError, getDefaultError } from './util';
import { Fn } from './types';

export const collectionWindowError = (resolve:Fn) => {
  const callback = window.onerror || function() {};
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
  }
}