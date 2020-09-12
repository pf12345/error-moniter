import { defaultErrorData } from './defaultData';
import { processError, getDefaultError } from './util';
import { Fn } from './types';

export const collectionPromiseError = (resolve:Fn) => {
  window.addEventListener('unhandledrejection', event => {
    const newError = processError(event.reason);
    const data: object = Object.assign(defaultErrorData, getDefaultError(), {
      error: newError,
      stack: newError ? newError.msg : '',
      ...newError,
      type: 'PROMISE',
      from: 'promise onError'
    });

    resolve(data);
  });
}