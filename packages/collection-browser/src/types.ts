export interface OptionsType {
  user: object
}

export type Fn = (item:object) => void

export interface DefaultErrorMessage {
  msg: string, // 错误信息
  url: string, // 错误来源页面url
  line: string, // 错误行
  col: string, // 错误列
  stack: string, // 栈信息
  from: string // 来源
}