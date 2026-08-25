# 动态公告与 ICP 本地验收记录

日期：2026-08-25
范围：官网源码、隔离 mock 公共 API、后端临时测试数据库。
明确未做：生产域名/API、服务器、Nginx、SSL、DNS、USB/ADB、真机或微信浏览器。

## 自动化检查

| 检查 | 结果 |
| --- | --- |
| 官网 `pnpm test` | PASS：10 个公开页面、13 项功能和内容边界 |
| 官网 `pnpm build` | PASS：Vite 多页面构建，`dist/` 含公告 dialog、ICP 静态页脚和运行时配置 |
| 后端 `python -m unittest discover -s tests -p 'test_api.py'` | PASS：24 tests，使用临时隔离数据库；覆盖网站公告 CRUD 与 APP/网站隔离 |
| 公共字段 | PASS：`website-announcements` 只含 `id/title/content/publishedAt/updatedAt` |
| ICP 构建产物 | PASS：10 个 HTML 均含 `© 2026 我的长理`、`湘ICP备2026035265号-1` 和备案链接属性 |

## 本地浏览器场景

通过 `qa/mock-public-api.mjs` 在 `127.0.0.1:8788` 提供只读 `website-announcements` fixture，并临时将 `publicApiBaseUrl` 指向该地址；验收完成后已恢复为空并重新构建。

| 视口/场景 | 结果 |
| --- | --- |
| 390 × 844：有公告、首次未读自动弹窗 | PASS：栏位在导航下方，正文安全渲染，dialog 打开 |
| 390 × 844：确认已读后刷新 | PASS：栏位保留，dialog 不再自动弹出 |
| 390 × 844：关闭 × 后刷新 | PASS：再次自动弹出，未误记为已读 |
| 390 × 844：长标题/长正文 | PASS：摘要单行省略；dialog 约 80vh，正文内部滚动，无横向溢出 |
| 360 × 780 | PASS：公告栏和 dialog 适配，`scrollWidth` 无横向溢出 |
| 1440 × 900 | PASS：公告栏与现有 `1120px` container 对齐，无横向溢出 |
| 无公告空数组 | PASS：公告栏和 dialog 完全隐藏，Hero 正常 |
| API 500 | PASS：fail open，页面其余内容正常 |
| JSON 异常 | PASS：fail open，页面其余内容正常 |
| 4.5 秒超时 | PASS：AbortController 中止请求，公告区域隐藏 |
| Escape / × / 顶部公告入口 | PASS：关闭、重新打开和焦点返回均正常 |
| 移动端汉堡菜单 | PASS：6 个导航项、`z-index:100` 浮层、无横向溢出 |
| 10 个公开页面 | PASS：页脚 ICP 一致，390px 下无横向溢出 |

mock 服务只使用本地内存 fixture，未创建公告、未写入生产数据库，也未请求生产 API。
