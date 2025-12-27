# fs-testcase-mcp

基于 MCP（Model Context Protocol）的飞书文档测试用例提取工具，可自动从飞书文档中提取测试用例数据，供 AI 工具使用。提取测试用例的方法是基于我司写的，可以参考并提供方法

## 功能亮点

### 核心功能

- 🔗 **自动提取测试用例**：通过飞书开放平台 API 自动提取文档中的多维表格测试用例
- 🤖 **AI 工具集成**：基于 MCP 协议，可与 Claude、Kiro 等支持 MCP 的 AI 工具无缝集成
- 📊 **结构化数据输出**：将飞书文档中的测试用例转换为结构化数据

### 技术特性

- ⚙️ **灵活配置**：支持类似 Vite 的配置文件机制，可自定义核心逻辑
- 🎯 **智能定位**：自动识别文档中的"2.1 用例编写"章节和多维表格
- 📝 **测试指导**：内置测试执行流程和标准化报告模板

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 获取飞书应用凭证

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建应用，获取 `app_id` 和 `app_secret`
3. 为应用开通以下权限：
   - 查看、评论和编辑云空间中所有文件
   - 获取与更新多维表格信息

参考文档：[获取 tenant_access_token](https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal)

### 3. 启动服务

**开发模式**

```bash
pnpm serve
```

### 4. 配置到 AI 工具

在 Kiro 或 Claude 的 MCP 配置文件（`.kiro/settings/mcp.json` 或 `~/.kiro/settings/mcp.json`）中添加：

```json
{
  "mcpServers": {
    "fs-testcase-mcp": {
      "command": "npx",
      "args": [
        "fs-testcase-mcp@latest",
        "--id=你的app_id",
        "--secret=你的app_secret"
      ]
    }
  }
}
```

## 使用方法

### MCP 工具调用

**工具名称**：`fs_document_mcp_test_case`

**参数说明**：

- `documentId`（必填）：飞书文档 ID（从文档 URL 中获取）
- `pageSize`（可选）：每页返回记录数量，默认 30 条，最大 500 条
- `pageToken`（可选）：分页标记，首次请求不填。如果上次返回 `hasMore=true`，使用返回的 `nextPageToken` 继续获取
- `fields`（可选）：指定返回字段，可选范围: `['前置条件', '步骤', '用例标题', '预期效果']`，不传则返回所有关键字段

**分页机制**：

- 首次调用时只传 `documentId`，系统会返回第一页数据
- 如果返回结果中 `hasMore=true`，说明还有更多数据
- 使用返回的 `nextPageToken` 作为参数继续调用，获取下一页数据
- 重复此过程直到 `hasMore=false`

**示例**：

```
请帮我获取飞书文档 doccnXXXXXXXXXXXX 中的测试用例
```

AI 工具会自动调用 MCP 工具，如果数据较多会自动分页获取。

### 自定义配置（可选）

如需自定义核心逻辑，可创建配置文件：

1. 复制示例配置：

```bash
cp fstestcase.config.example.ts fstestcase.config.ts
```

2. 编辑 `fstestcase.config.ts`，自定义以下函数：

```typescript
import { defineConfig } from "./src/types";

export default defineConfig({
  // 自定义 Token 获取逻辑
  async getToken(id, secret) {
    // 你的实现
    return accessToken;
  },

  // 自定义表格定位逻辑
  async getTableParamsInDocument(documentId, accessToken) {
    // 你的实现
    return [appToken, tableId];
  },

  // 自定义测试用例提取逻辑
  async getTestCase(accessToken, appToken, tableId, pageToken, pageSize) {
    // 你的实现
    return {
      items: testCases,
      hasMore: false,
      nextPageToken: undefined,
      total: testCases.length,
    };
  },
});
```

## 典型使用场景

通过 AI 工具调用此 MCP 服务，可实现：

- ✅ 自动执行测试用例并记录结果
- 📊 生成标准化测试报告
- 📈 分析测试覆盖率和缺陷分布
- 💡 提供测试改进建议
- 🔄 自动化测试流程

## 项目结构

```
fs-testcase-mcp/
├── src/
│   ├── index.ts              # MCP 服务主入口
│   ├── types.ts              # 公共类型导出
│   ├── utils.ts              # 工具函数
│   ├── constant.ts           # 常量定义
│   └── type/
│       ├── config.ts         # 配置类型定义
│       ├── fs.ts             # 飞书 API 类型定义
│       └── common.ts         # 通用类型定义
├── fstestcase.config.example.ts  # 配置文件示例
├── package.json
└── README.md
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm start --id=xxx --secret=xxx

# 构建项目
pnpm build

# 构建并启动 MCP Inspector 调试（需要设置环境变量）
export FS_APP_ID=your_app_id
export FS_APP_SECRET=your_app_secret
pnpm serve
```

## 注意事项

1. 确保飞书应用已开通必要的权限
2. 文档中必须包含"2.1 用例编写"标题和多维表格
3. 首次使用建议先用小数据量测试（设置较小的 pageSize 值）
4. 配置文件支持 `.ts`、`.mts`、`.js`、`.mjs` 等多种格式
5. **分页获取**：如果测试用例较多，工具会自动提示继续获取，AI 会使用 `pageToken` 参数继续调用

## 更新日志

### v0.0.1

- ✨ 支持基于 pageToken 的分页获取机制
- ✨ 支持自定义返回字段，减少上下文占用
- ✨ 内置测试执行指导和报告模板
- ✨ 支持类似 Vite 的配置文件机制

### v0.0.2

- ✨ 支持分批执行测试用例，防止上下文瞬间爆炸

## License

ISC
