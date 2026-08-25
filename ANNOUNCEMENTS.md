# 官网动态公告架构说明

官网保持 Vite 静态外壳；公告内容由现有“我的长理”后端的独立网站公告模块提供。没有引入 CMS、第二套管理后台或管理员接口到官网。

## 审计与实现结论

- APP公告继续使用原有 `announcements` 表、`/api/v1/admin/announcements` CRUD、`/api/v1/public/bootstrap` 和 `/api/v1/public/service-updates`，`service_visible` 语义保持不变。
- 新增 `website_announcements` 表，字段为 `id`、`title`、`content`、`enabled`、`published_at`、`updated_at`。它只控制官网发布，不参与 App 接口。
- 后台“内容运营”分为“APP公告”和“网站公告”。网站公告使用独立的 `/api/v1/admin/website-announcements` CRUD，仍由 `CONTENT_OPERATOR` / `SUPER_ADMIN` 权限保护。
- 官网只调用公开的 `GET /api/v1/public/website-announcements`，公开字段只有 `id`、`title`、`content`、`publishedAt`、`updatedAt`。管理员身份、审计字段、Token、内部备注和系统路径不会进入官网。
- 本轮没有连接服务器、生产 API 或生产数据库；数据库表创建和 API 测试均使用本地隔离测试数据库。

## 公共 API 数据样例

```json
{
  "ok": true,
  "data": {
    "websiteAnnouncements": [
      {
        "id": "website-announcement-id",
        "title": "关于近期服务说明",
        "content": "公告正文第一段。\\n\\n公告正文第二段。",
        "publishedAt": 1787616000000,
        "updatedAt": 1787616000000
      }
    ]
  }
}
```

接口从 `enabled=1` 的网站公告中按 `published_at DESC, updated_at DESC` 选择最新内容；没有公告时返回空数组。

## 公告生命周期

后台“网站公告”发布 → `GET /api/v1/public/website-announcements` → 官网导航下方“最新公告”置顶栏 → 首次未读自动打开详情 → 用户可用 `×` 关闭，或点击“确认已读”保存本地状态。

- 置顶栏位于导航下方、Hero 之前；摘要单行省略。没有启用公告、接口失败、超时或 JSON 无效时，整个区域隐藏且不留下占位高度。
- 详情使用原生 `<dialog>`，支持 `showModal()`、Escape、关闭按钮、焦点回收、Tab 循环和移动端内部滚动。
- 正文只用 `textContent` 渲染并保留换行，不执行后台传入的 HTML、JavaScript、CSS 或 iframe。
- 请求使用 `cache: "no-cache"` 和 4.5 秒 `AbortController` 超时；页面重新回到前台且超过 5 分钟时轻量刷新，不轮询、不建立长连接。

已读 key 形如：

```text
mychangli:web-announcement-read:<announcement.id>:<announcement.updatedAt>
```

点击 `×` 只关闭本次弹窗；只有“确认已读”才写入 `localStorage`。同一公告编辑后 `updatedAt` 改变，会再次提示。

## 跨域与未来部署

源码阶段未连接生产验证。当前配置 `publicApiBaseUrl` 留空时，官网请求同源 `/api/v1/public/website-announcements`。未来部署可以：

1. 由官网同源代理精确转发 `/api/v1/public/website-announcements` 到 `https://api.mychangliapp.cn/api/v1/public/website-announcements`；或
2. 在后端/网关只允许 `https://mychangliapp.cn` 的精确 CORS Origin 后，把 `publicApiBaseUrl` 配置为 API 基地址。

两种方案都不能代理或在官网代码中保存 `/api/v1/admin/` 凭据。未来人工部署示例（仅文档，不执行）：

```nginx
location = /api/v1/public/website-announcements {
    proxy_pass https://api.mychangliapp.cn/api/v1/public/website-announcements;
    proxy_set_header Host api.mychangliapp.cn;
    proxy_ssl_server_name on;
}
```

## ICP 页脚

真实备案号配置在 `config/site-config.json`：

```json
"filing": {
  "icpNumber": "湘ICP备2026035265号-1",
  "icpUrl": "https://beian.miit.gov.cn/",
  "publicSecurityNumber": "",
  "publicSecurityUrl": "",
  "publicSecurityIcon": ""
}
```

公开页面保留 `© 2026 我的长理` 和备案链接；公安联网备案信息为空时完全隐藏，不生成占位号码或假链接。

## 未来第二阶段建议

如果以后需要把少量运营字段后台化，可新增白名单字段的 `website_settings` 或 `website_content`，例如首页副标题、未来展望、APK 下载地址、版本信息、支持链接和联系邮箱。布局、样式和脚本仍由源码控制；本轮不提前建立这套表或接口。
