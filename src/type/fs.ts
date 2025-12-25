export namespace fs {
  export interface ITenantAccessTokenReqeust {
    /** 应用唯一标识，创建应用后获得 */
    app_id: string;
    /** 应用秘钥，创建应用后获得*/
    app_secret: string;
  }
  export interface ITenantAccessTokenResponse {
    /** 错误码，非 0 取值表示失败 */
    code: number;
    /** 错误描述 */
    msg?: string;
    /** 租户访问凭证 */
    tenant_access_token: string;
    /** tenant_access_token 的过期时间，单位为秒 */
    expire: number;
  }

  export interface IBlocksResponse {
    code: number;
    data: Data;
    msg: string;
  }

  export interface Data {
    has_more: boolean;
    items: Item[];
  }

  /**
   * 块的元数据结构
   */
  export interface Item {
    /**
     * 块的唯一标识。创建块时会自动生成
     */
    block_id: string;
    /**
     * 块的枚举值，表示块的类型
     * @document https://open.feishu.cn/document/docs/docs/data-structure/block
     */
    block_type: number;
    /**
     * 块的子块 ID 列表
     */
    children?: string[];
    page?: Page;
    parent_id: string;
    text?: Text;
    table?: {
      cells?: Array<string>;
    };
    /**
     * @document https://open.feishu.cn/document/docs/docs/data-structure/block
     */
    bitable?: {
      /**
       * 文档中嵌入的多维表格，需要调用文档相关接口获取多维表格的 app_token。
       * 调用获取文档所有块，在返回结果中检索，其中 bitable.token 字段的值
       * AW3Qbtr2cakCnesXzXVbbsrIcVT_tblkIYhz52o6G5nx是用 _ 隔开的 app_token 和 table_id
       * @document https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview#-752212c
       */
      token: string;
    };
    /** 三级标题 Block */
    heading3?: Text;
  }

  export interface Text {
    elements?: Element2[];
    style: Textelementstyle;
  }

  export interface Element2 {
    text_run: Textrun2;
  }

  export interface Textrun2 {
    content: string;
    text_element_style: Textelementstyle2;
  }

  export interface Textelementstyle2 {
    link?: Link;
    background_color?: number;
    text_color?: number;
    bold?: boolean;
  }

  export interface Link {
    url: string;
  }

  export interface Page {
    elements: Element[];
    style: Textelementstyle;
  }

  export interface Element {
    text_run: Textrun;
  }

  export interface Textrun {
    content: string;
    text_element_style: Textelementstyle;
  }

  export interface Textelementstyle {}

  /**
   * 多维表格记录请求
   * @document https://open.feishu.cn/document/docs/bitable-v1/app-table-record/search?appId=cli_a81aada7b793d00d
   */
  export interface IBitableRecordsRequest {
    /** 分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果 */
    page_token?: string;
    /**
     * 分页大小。最大值为 500
     * @default 20
     */
    page_size?: number;
  }

  /** 多维表格记录响应 */
  export interface IBitableRecordsResponse {
    code: number;
    data: BitableRecordsData;
    msg: string;
  }

  export interface BitableRecordsData {
    has_more: boolean;
    items: BitableRecord[];
    total: number;
    page_token?: string;
  }

  /** 多维表格记录 */
  export interface BitableRecord {
    /** 记录创建人信息 */
    created_by: UserInfo;
    /** 记录创建时间（毫秒时间戳） */
    created_time: number;
    /** 记录字段数据 */
    fields: RecordFields;
    /** 记录最后修改人信息 */
    last_modified_by: UserInfo;
    /** 记录最后修改时间（毫秒时间戳） */
    last_modified_time: number;
    /** 记录 ID */
    record_id: string;
  }

  export interface BitableRecordItemText {
    text: string;
    type: string;
  }

  /** 用户信息 */
  export interface UserInfo {
    /** 用户头像 URL */
    avatar_url: string;
    /** 用户邮箱 */
    email: string;
    /** 用户英文名 */
    en_name: string;
    /** 用户 ID */
    id: string;
    /** 用户名称 */
    name: string;
  }

  /** 记录字段数据（动态字段） */
  export interface RecordFields {
    /** 人员字段 */
    人员?: UserInfo[];
    /** 修改人字段 */
    修改人?: UserInfo[];
    /** 创建人字段 */
    创建人?: UserInfo[];
    /** 创建时间（毫秒时间戳） */
    创建时间?: number;
    /** 单向关联字段 */
    单向关联?: LinkField;
    /** 单选字段 */
    单选?: string;
    /** 双向关联字段 */
    双向关联?: LinkField;
    /** 地理位置字段 */
    地理位置?: LocationField;
    /** 复选框字段 */
    复选框?: boolean;
    /** 多行文本字段 */
    多行文本?: TextElement[];
    /** 多选字段 */
    多选?: string[];
    /** 数字字段 */
    数字?: number;
    /** 日期字段（毫秒时间戳） */
    日期?: number;
    /** 最后更新时间（毫秒时间戳） */
    最后更新时间?: number;
    /** 条码字段 */
    条码?: TextElement[];
    /** 电话号码字段 */
    电话号码?: string;
    /** 自动编号字段 */
    自动编号?: string;
    /** 群组字段 */
    群组?: GroupInfo[];
    /** 评分字段 */
    评分?: number;
    /** 货币字段 */
    货币?: number;
    /** 超链接字段 */
    超链接?: HyperlinkField;
    /** 进度字段（0-1 之间的小数） */
    进度?: number;
    /** 附件字段 */
    附件?: AttachmentField[];
    前置条件: Array<BitableRecordItemText>;
    "步骤【必填】": Array<BitableRecordItemText>;
    "测试人员【必填】": Array<BitableRecordItemText>;
    "测试端【必填】": string;
    状态: string;
    "用例标题「同端不可重复」【必填】": Array<BitableRecordItemText>;
    "用例等级【必填】": Array<BitableRecordItemText>;
    "预期效果【必填】": Array<BitableRecordItemText>;
    /** 其他动态字段 */
    [key: string]: any;
  }

  /** 关联字段 */
  export interface LinkField {
    /** 关联的记录 ID 列表 */
    link_record_ids: string[];
  }

  /** 地理位置字段 */
  export interface LocationField {
    /** 地址 */
    address: string;
    /** 区域名称 */
    adname: string;
    /** 城市名称 */
    cityname: string;
    /** 完整地址 */
    full_address: string;
    /** 经纬度坐标 */
    location: string;
    /** 地点名称 */
    name: string;
    /** 省份名称 */
    pname: string;
  }

  /** 文本元素 */
  export interface TextElement {
    /** 文本内容 */
    text: string;
    /** 元素类型 */
    type: "text" | "mention";
    /** @提及是否通知（仅 mention 类型） */
    mentionNotify?: boolean;
    /** @提及类型（仅 mention 类型） */
    mentionType?: "User" | "Doc" | "Chat";
    /** @提及的名称（仅 mention 类型） */
    name?: string;
    /** @提及的 token（仅 mention 类型） */
    token?: string;
  }

  /** 群组信息 */
  export interface GroupInfo {
    /** 群组头像 URL */
    avatar_url: string;
    /** 群组 ID */
    id: string;
    /** 群组名称 */
    name: string;
  }

  /** 超链接字段 */
  export interface HyperlinkField {
    /** 链接地址 */
    link: string;
    /** 链接文本 */
    text: string;
  }

  /** 附件字段 */
  export interface AttachmentField {
    /** 文件 token */
    file_token: string;
    /** 文件名称 */
    name: string;
    /** 文件大小（字节） */
    size: number;
    /** 临时下载 URL */
    tmp_url: string;
    /** 文件类型 */
    type: string;
    /** 下载 URL */
    url: string;
  }
}
