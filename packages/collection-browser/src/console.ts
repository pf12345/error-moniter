import { defaultErrorData } from './defaultData';
import { processError, getDefaultError } from './util';
import { Fn } from './types';

export const collectionConsoleError = (resolve:Fn) => {
  const callback = console.error || function() {};
  console.error = function (error: any) {
    const newError = processError(error)
    const data: object = Object.assign(defaultErrorData, getDefaultError(), {
      error: error.stack || error,
      msg: newError ? newError.msg : '',
      col: newError.col,
      line: newError.line,
      stack: newError._orgMsg,
      path: newError.target,
      type: 'CONSOLE',
      from: 'console error',
    })

    callback && callback.call(window, error);
    resolve(data);
  };
}