import { defineConfig } from "./src/types";

/**
 * 用户自定义配置示例
 */
export default defineConfig({
  /**
   * 自定义获取Token的实现
   * 如果不配置，将使用默认实现
   */
  async getToken(id, secret) {
    // 自定义实现
    console.log("使用自定义 getToken");

    // 示例：调用自定义API
    // const response = await fetch("https://your-api.com/token", {
    //   method: "POST",
    //   body: JSON.stringify({ app_id: id, app_secret: secret }),
    // });
    // const data = await response.json();
    // return data.access_token;

    // 或者返回 undefined
    return undefined;
  },

  /**
   * 自定义获取表格参数的实现
   * 如果不配置，将使用默认实现
   */
  async getTableParamsInDocument(documentId, accessToken) {
    // 你的自定义实现
    console.log("使用自定义 getTableParamsInDocument");

    // 返回 [appToken, tableId] 或 undefined
    return undefined;
  },

  /**
   * 自定义获取测试用例的实现（支持分页）
   * 如果不配置，将使用默认实现
   */
  async getTestCase(accessToken, appToken, tableId, pageToken, pageSize) {
    // 你的自定义实现
    console.log("使用自定义 getTestCase");

    // 返回分页结果
    return {
      items: [], // 测试用例数组
      hasMore: false, // 是否还有更多数据
      nextPageToken: undefined, // 下一页的 token
      total: 0, // 总记录数
    };
  },
});
