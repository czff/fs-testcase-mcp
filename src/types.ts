/**
 * Public type exports for fs-testcase-mcp
 * Users can import these types to create custom configuration files
 */

export type {
  UserConfig,
  GetTokenFn,
  GetTableParamsInDocumentFn,
  GetTestCaseFn,
  TestCasePageResult,
} from "./type/config";

export { defineConfig } from "./type/config";

export type { fs } from "./type/fs";
