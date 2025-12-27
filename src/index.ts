import type { fs } from "./type/fs";
import type { UserConfig } from "./type/config";
import { findFromIndex, myFetch } from "./utils";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NAME, PROMPT_TIPS, VERSION, REPORT_TEMPLATE } from "./constant";
import { Command } from "commander";
import { pathToFileURL } from "url";
import { existsSync } from "fs";
import { resolve } from "path";

const DEFAULT_PAGE_SIZE = 20;

/**
 * 加载用户配置文件
 * 支持多种配置文件格式，类似 Vite 的配置加载机制
 */
async function loadUserConfig(): Promise<UserConfig | null> {
  const configFiles = [
    "fstestcase.config.ts",
    "fstestcase.config.mts",
    "fstestcase.config.js",
    "fstestcase.config.mjs",
  ];

  for (const configFile of configFiles) {
    const configPath = resolve(process.cwd(), configFile);

    if (!existsSync(configPath)) {
      continue;
    }

    try {
      const configUrl = pathToFileURL(configPath).href;
      const configModule = await import(configUrl);
      const config = configModule.default || configModule;
      console.log(`已加载配置文件: ${configFile}`);
      return config;
    } catch (error) {
      console.error(`加载配置文件失败 (${configFile}):`, error);
      return null;
    }
  }

  return null;
}

/**
 * 获取飞书文档的token
 * 用于后续飞书请求登录态
 */
async function getToken(id: string, secret: string) {
  const [accessTokenError, accessTokenData] = await myFetch.post<
    fs.ITenantAccessTokenReqeust,
    fs.ITenantAccessTokenResponse
  >(`https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal`, {
    app_id: id,
    app_secret: secret,
  });
  if (accessTokenError) {
    throw new Error(accessTokenError?.message ?? "获取token错误");
  }
  const accessToken = accessTokenData?.tenant_access_token;
  if (!accessToken) {
    throw new Error("获取token错误");
  }

  return accessToken;
}

/**
 * 获取飞书文档的测试用例的二维表格appToken以及tableId
 */
async function getTableParamsInDocument(
  documentId: string,
  accessToken: string
) {
  const [blocksError, blocksData] = await myFetch.get<
    unknown,
    fs.IBlocksResponse
  >(
    `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks`,
    null,
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );
  if (blocksError || !blocksData) {
    throw new Error(blocksError?.message ?? "获取测试用例错误");
  }
  const { items } = blocksData.data;

  //   从 items找到 标题内容为2.1 用例编写
  const testCaseTitleItemIndex = items.findIndex((item) => {
    return item.heading3?.elements?.[0]?.text_run?.content === "2.1 用例编写";
  });
  if (testCaseTitleItemIndex === -1) {
    console.error("没有找到测试用例标题");
    return;
  }

  const bitableItem = findFromIndex(items, testCaseTitleItemIndex, (item) => {
    /**
     * 多维表格
     * @document https://open.feishu.cn/document/docs/docs/data-structure/block
     */
    if (item.block_type === 18 && item.bitable?.token) {
      return true;
    }
    return false;
  });

  if (!bitableItem) {
    console.error("没有找到测试用例表格");
    return;
  }

  const [appToken, tableId] = bitableItem.bitable?.token.split("_")!;

  return [appToken, tableId] as const;
}

/**
 * 获取测试用例（支持分页）
 * @returns 返回测试用例数组、是否有更多数据、下一页的 pageToken
 */
async function getTestCase(
  accessToken: string,
  appToken: string,
  tableId: string,
  pageToken?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const queryParams = new URLSearchParams();
  queryParams.append("page_size", pageSize + "");
  if (pageToken) {
    queryParams.append("page_token", pageToken);
  }
  const [recordsError, recordsRes] = await myFetch.post<
    fs.IBitableRecordsRequest,
    fs.IBitableRecordsResponse
  >(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search?${queryParams}`,
    {
      page_token: pageToken,
      page_size: pageSize,
    },
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  if (recordsError || !recordsRes) {
    console.error(recordsError);
    throw new Error(recordsError?.message || "获取测试用例失败");
  }

  return {
    items: recordsRes.data.items,
    hasMore: recordsRes.data.has_more,
    nextPageToken: recordsRes.data.page_token,
    total: recordsRes.data.total,
  };
}

const program = new Command();

program
  .option(
    "--id <string>",
    "getToken应用唯一标识，创建应用后获得。具体可参考：https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal。"
  )
  .option(
    "--secret <string>",
    "https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal"
  )
  .allowUnknownOption()
  .parse(process.argv);

const cliOptions = program.opts<{
  id: string;
  secret: string;
}>();

if (!cliOptions.id || !cliOptions.secret) {
  throw new Error(
    `Invalid id or secret value: '${cliOptions.id}', '${cliOptions.secret}'.`
  );
}

async function main() {
  // 加载用户配置
  const userConfig = await loadUserConfig();

  // 根据用户配置选择实现
  const getTokenFn = userConfig?.getToken || getToken;
  const getTableParamsInDocumentFn =
    userConfig?.getTableParamsInDocument || getTableParamsInDocument;
  const getTestCaseFn = userConfig?.getTestCase || getTestCase;

  const server = new McpServer({
    name: NAME,
    version: VERSION,
  });

  server.registerPrompt(
    "fs_document_mcp_assistant",
    {
      title: "根据飞书文档ID获取测试用例",
      description: "根据飞书文档ID获取测试用例",
      argsSchema: {
        documentId: z.string().describe("飞书文档ID"),
      },
    },
    ({ documentId }) => {
      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: `根据飞书文档ID获取测试用例: ${documentId}，并根据测试用例进行测试
              相关测试地址：等待用户告知测试地址`,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    "fs_document_mcp_test_case",
    {
      title: "获取测试用例摘要（支持分页pageSize字段）",
      description:
        "根据飞书文档ID获取测试用例摘要，支持分页获取，避免上下文过长。如果返回 hasMore=true，需要使用 pageToken 继续获取下一页数据。分批次获取测试用例，执行当前批次的测试用例后再获取下批次测试用例",
      inputSchema: {
        documentId: z.string().describe("飞书文档ID"),
        pageSize: z
          .number()
          .optional()
          .default(DEFAULT_PAGE_SIZE)
          .describe(
            `每页返回的记录数量，默认${DEFAULT_PAGE_SIZE}条，最大500条`
          ),
        pageToken: z
          .string()
          .optional()
          .describe(
            "分页标记，首次请求不填。如果上次返回 hasMore=true，使用返回的 nextPageToken 继续获取"
          ),
        // ✨ 新增：动态字段过滤
        fields: z
          .array(z.string())
          .optional()
          .describe(
            "指定返回字段，可选范围: ['前置条件', '步骤', '用例标题', '预期效果']。不传则返回所有关键字段。"
          ),
      },
    },
    async ({ documentId, pageSize = DEFAULT_PAGE_SIZE, pageToken, fields }) => {
      const accessToken = await getTokenFn(cliOptions.id, cliOptions.secret);
      if (!accessToken) {
        return {
          content: [
            {
              type: "text",
              text: "获取token失败",
            },
          ],
          isError: true,
        };
      }

      const tableParams = await getTableParamsInDocumentFn(
        documentId,
        accessToken
      );

      if (!tableParams) {
        return {
          content: [
            {
              type: "text",
              text: `获取表格参数失败`,
            },
          ],
          isError: true,
        };
      }
      const [appToken, tableId] = tableParams;
      const result = await getTestCaseFn(
        accessToken,
        appToken,
        tableId,
        pageToken,
        pageSize
      );

      // 字段映射
      const fieldMap: Record<string, string> = {
        前置条件: "前置条件",
        步骤: "步骤【必填】",
        用例标题: "用例标题「同端不可重复」【必填】",
        预期效果: "预期效果【必填】",
      };
      // 确定返回哪些字段
      const targetFields =
        fields && fields.length > 0 ? fields : Object.keys(fieldMap);

      // 数据摘要 提取关键字段，减少上下文占用
      const summary = result.items.map((record, index) => {
        const entry: Record<string, any> = {
          序号: index + 1,
          记录ID: record.record_id,
        };
        targetFields.forEach((f) => {
          const originalKey = fieldMap[f] || f;
          if (record.fields[originalKey] !== undefined) {
            entry[f] = record.fields[originalKey];
          }
        });
        return entry;
      });

      // 构建响应提示
      const currentBatchCount = summary.length;
      const paginationHint = result.hasMore
        ? `\n **当前批次：${currentBatchCount} 条用例**
      **请立即执行以上 ${currentBatchCount} 条测试用例**，完成后再获取下一批。

      获取下一批用例时，请调用此工具并传入：
      - documentId: "${documentId}"
      - pageToken: "${result.nextPageToken}"
      - pageSize: ${pageSize}

      ⚠️ 注意：请勿跳过当前批次，必须先执行完当前用例再继续获取！`
        : `\n✅ **已获取最后一批测试用例（${currentBatchCount} 条）**
      📋 请执行以上用例，完成后请依据以下模板汇总所有批次结果生成完整测试报告：

      ${REPORT_TEMPLATE}`;

      // 元信息
      const payload = {
        meta: {
          total: result.total,
          currentBatchCount: summary.length,
          hasMore: result.hasMore,
          nextPageToken: result.nextPageToken,
          fields: targetFields,
          pageSize,
          instruction: result.hasMore
            ? "请先执行当前批次的所有用例，完成后再使用 nextPageToken 获取下一批"
            : "这是最后一批用例，执行完成后请生成完整测试报告",
        },
        items: summary,
      };

      return {
        content: [
          ...(!pageToken ? PROMPT_TIPS : []),
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
          {
            type: "text",
            text: paginationHint,
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("fatal error in main():", error);
  process.exit(1);
});
