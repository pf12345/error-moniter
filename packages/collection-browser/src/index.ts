export * from './window';
export * from './console';
export * from './promise';
export * from './cdn';
export * from './perfomance';
export * from './xmlHttpRequest';
export * from './fetch';

import { setOptions } from './util';
import { OptionsType } from './types';

// init collcetion
export const initCollection = (options:OptionsType) => {
  setOptions(options);
}