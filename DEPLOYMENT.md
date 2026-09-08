# 部署与更新说明

本文记录官网静态发布与 Android Release 的长期操作约束。生产部署由项目级 `Local-Automation/Invoke-MyChangliReleaseClosure.ps1` 统一编排；本仓库不保存生产凭据。

## 1. 发布前置条件

生产部署前应先取得并核验：

- 最终签名 APK 与确定的对外下载位置；
- 最终 APK 文件大小和 SHA-256；
- 确认后的发布日期；
- 已签发的 ICP/公安备案信息（如适用）；
- 源码验收结论和单独的生产变更授权。

缺少的事实继续留空，不使用示例值代替。

## 2. APK 替换流程

1. 将最终签名 APK 保存到发布流程指定的位置，不把签名密钥或密码放入本仓库。
2. 在 Windows 本地计算最终文件校验值：

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath "D:\明确路径\my-changli-v1.0.0.apk"
   ```

3. 核对文件大小，并确认下载地址使用 HTTPS。
4. 修改 `config/site-config.json` 中的 `androidDownloadUrl`、`releaseDate`、`apkSize` 与 `apkSha256`。
5. 执行 `pnpm test` 和 `pnpm build`。
6. 使用 `pnpm preview` 检查下载按钮、文件信息和 SHA-256 展示。
7. 在单独批准的生产部署阶段，将 APK 与 `dist/` 一并发布，再从公网完成下载、哈希和签名复核。

当 `androidDownloadUrl` 为空时，网站会自动移除下载链接并显示“下载地址待配置”。

## 3. 版本更新流程

1. 更新 `version` 与 `displayVersion`。
2. 把新版本记录插入 `releases` 数组顶部，并只保留一个 `current: true`。
3. 仅填写已经确认发布的内容；规划版本保持空 `summary` 与空 `items`，页面只展示版本号和状态。
4. 若说明书随版本更新，替换 `assets/docs/` 中的正式 PDF，并同步调整 `manual.html` 和 `vite.config.js` 中的文件名引用。
5. 更新 APK 信息，执行测试、构建与浏览器复验。

未来 iOS 正式发布时，同时把 `iosStatus` 改为 `open` 并填写真实 `iosDownloadUrl`；两项未同时满足时，入口继续保持禁用。

版本时间线完全由 `releases` 配置生成，新增时间线节点不需要改页面结构。

## 4. 支持入口替换流程

1. 仅使用开发者本人确认可公开展示的支付宝收款码和微信商家码图片。
2. 如需优先跳转，在 `config/support-config.json` 的 `alipaySupportUrl` 或 `wechatSupportUrl` 填写经确认的 HTTPS 地址；留空则不跳转。
3. 二维码兜底图片保存到 `assets/images/support/`，文件名使用稳定的英文小写名称，例如 `alipay.png`，并在对应 `QrImage` 字段填写站内路径；不要填写外部短链、统计链接或不明来源图片。
4. 执行 `pnpm test`、`pnpm build` 和 `pnpm preview`。
5. 检查 `support.html` 初始状态不显示支付信息；链接存在时点击后打开链接，链接为空时点击后才显示已配置图片。

链接、二维码均为空或图片加载失败时，页面自动显示占位信息，不展示无效图片。

支付链接的逐字段配置与真实手机验收清单见 `config/SUPPORT_CONFIG.md`。

## 5. 备案信息更新

当前已核实的网站 ICP 备案号为 `湘ICP备2026035265号-1`，已写入 `config/site-config.json` 的 `filing.icpNumber`，备案链接为 `https://beian.miit.gov.cn/`。公安联网备案字段仍为空并保持隐藏。

以后取得新的真实信息时，只填写 `filing.icpNumber`、`filing.publicSecurityNumber` 和对应链接；任何空字段都应保持隐藏，禁止使用示例编号或占位号码。备案信息变更属于静态源码变更，需重新执行 `pnpm test`、`pnpm build` 并发布新的 `dist/`。

## 6. 未来静态站点上传流程（仅说明，待单独授权）

1. 在本地执行 `pnpm install --frozen-lockfile`、`pnpm test` 和 `pnpm build`。
2. 将 `dist/` 作为唯一网站静态发布目录，不上传 `node_modules/`、`.git/`、本地 QA 文件、密钥或凭据。
3. 在另行批准的服务器变更窗口中确认官网静态目录与 API 后端目录完全隔离。
4. 备份当前官网静态目录，再上传 `dist/` 内的文件；不要覆盖后端目录或修改 API 代理逻辑。
5. 检查首页、其余 9 个 HTML 页面、两个配置 JSON、说明书 PDF、图片、图标、CSS 与 JavaScript 均可访问。
6. 检查域名、HTTPS 证书链、HTTP 到 HTTPS 跳转、混合内容与移动端访问。
7. 配置 APK 后，从公网下载并重新计算 SHA-256，与网页及发布记录比对。
8. 记录发布时间、Git 提交、构建哈希、文件清单和回退位置。

以上步骤描述静态站点的文件边界；实际生产上传由项目级自动化执行并在发布报告中记录备份、Git SHA 和公网结果。本仓库不包含生产凭据或服务器配置。

## Release manifest 与日期约束

每个正式 Android Release 都要同步维护 `releases/latest.json`。它只保存可缓存的 Release Metadata，必须与 APK 的 `versionName`、`versionCode`、下载 URL、SHA-256、文件大小和正式发布日期一致；Vite 构建会把它复制到 `dist/releases/latest.json`。`forceUpdate`、`minimumVersionCode`、策略 Revision 等实时控制字段禁止写入该静态文件，统一由 Backend Update Policy API 返回。

正式发布节点必须填写经发布记录核实的 `releaseDate`；规划中的版本不填写日期。当前已核实的正式日期为 V1.0.0 `2026-08-24`、V1.0.1 `2026-08-25`、V1.0.2 `2026-09-05`。部署前后要请求 manifest、下载页和线上 APK，并确认后端 `GET /api/v1/public/version/android` 返回同一 `versionCode`；客户端以生产后端为主源，只有后端失败或响应异常时才读取 manifest。

从 V1.0.3 起，正式 Release 必须以真实 APK 为唯一版本事实源。不要手工分别填写官网与 Backend 的版本号、SHA 或大小；使用项目级 Release Closure 自动提取并同步。ProductionRelease 模式会强制执行官网 APK、`latest.json`、下载页、更新日志、Backend Update API、公网一致性和 Git gate，要求 `-CommitRelease` 提交官网 release metadata/APK，任何缺项都是 `FAIL / INCOMPLETE`。官网单独上传 APK 或只构建 `dist/` 不构成 Release。

## 7. 动态公告接入（未来部署说明）

公告不写入官网 HTML，也不需要每次发布公告都重新构建网站。管理员在后端 `/admin/` 的“网站公告”栏目发布、编辑或撤回；首页下一次加载会读取独立的 `GET /api/v1/public/website-announcements`。

`config/site-config.json` 中的 `publicApiBaseUrl` 当前留空，表示使用同源 `/api/v1`；`publicWebsiteAnnouncementsPath` 为 `/public/website-announcements`。生产网关应只把官网的 `/api/v1/public/website-announcements` 精确转发到 `api.mychangliapp.cn` 的同一路径，并禁止把 `/api/v1/admin/` 暴露给官网静态资源。若改为官网直接请求 API 子域，必须在后端/网关设置精确的 `https://mychangliapp.cn` CORS allowlist，不能使用 `Access-Control-Allow-Origin: *`。

部署后人工检查：公告存在时栏位位于导航与 Hero 之间；无公告或 API 失败时栏位完全隐藏；长正文在对话框内部滚动；确认已读只影响当前浏览器；管理员编辑后 `updatedAt` 变化会再次提示。公告接口异常不得阻塞 Hero、下载、导航或其他页面。

详细响应字段、已读 key、文本安全规则和跨域边界见 [ANNOUNCEMENTS.md](ANNOUNCEMENTS.md)。公告模块仍不参与 Release 版本同步；Release 的 Backend 版本发布和 Nginx/静态目录变更只由项目级自动化执行并记录。
