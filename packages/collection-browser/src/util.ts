import { OptionsType } from './types';

let options:OptionsType // 存储用户信息

// get userInfo
export const getOptions = () => {
  return options;
}

export const setOptions = (opt: OptionsType) => {
  options = Object.assign({
    user: {}
  }, opt);
}

export const getDefaultError = () => {
  return {
    userAgent: window.navigator.userAgent,
    location: window.location,
    ...getOptions(),
  }
}

export const processError = (error: any) => {
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
    } else {
      //ie 独有 error 对象信息，try-catch 捕获到错误信息传过来，造成没有msg
      if (error.name && error.message && error.description) {
        return {
          msg: JSON.stringify(error)
        };
      }
      return error;
    }
  } catch (err) {
    return error;
  }
}