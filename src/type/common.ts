export interface IBaseRes<T = unknown> {
  code: number;
  msg: string;
  data: T;
}
