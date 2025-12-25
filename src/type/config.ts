import type { fs } from "./fs";

/**
 * 获取飞书访问令牌的函数类型
 */
export type GetTokenFn = (
  id: string,
  secret: string
) => Promise<string | undefined>;

/**
 * 获取文档中表格参数的函数类型
 */
export type GetTableParamsInDocumentFn = (
  documentId: string,
  accessToken: string
) => Promise<readonly [string, string] | undefined>;

/**
 * 测试用例分页结果
 */
export interface TestCasePageResult {
  /** 当前页的测试用例数组 */
  items: Array<fs.BitableRecord>;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 下一页的 pageToken */
  nextPageToken?: string;
  /** 总记录数 */
  total: number;
}

/**
 * 获取测试用例的函数类型（支持分页）
 */
export type GetTestCaseFn = (
  accessToken: string,
  appToken: string,
  tableId: string,
  pageToken?: string,
  pageSize?: number
) => Promise<TestCasePageResult>;

/**
 * 用户配置接口
 */
export interface UserConfig {
  /**
   * 自定义获取Token的实现
   */
  getToken?: GetTokenFn;

  /**
   * 自定义获取表格参数的实现
   */
  getTableParamsInDocument?: GetTableParamsInDocumentFn;

  /**
   * 自定义获取测试用例的实现
   */
  getTestCase?: GetTestCaseFn;
}

/**
 * 定义配置的辅助函数，提供类型提示
 * 类似于 Vite 的 defineConfig
 */
export function defineConfig(config: UserConfig): UserConfig {
  return config;
}
