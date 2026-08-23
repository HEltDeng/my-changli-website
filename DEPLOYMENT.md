# 部署与更新说明

本文只说明后续操作流程。本阶段未执行生产部署、服务器连接、Nginx 修改或线上服务变更。

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

## 4. 支持二维码替换流程

1. 仅使用开发者本人确认可公开展示的支付宝收款码和微信商家码图片。
2. 压缩图片并保存到 `assets/images/support/`，文件名使用稳定的英文小写名称，例如 `alipay.png`。
3. 在 `config/support-config.json` 中填写站内路径，例如 `/assets/images/support/alipay.png`；不要填写外部短链、统计链接或不明来源图片。
4. 执行 `pnpm test`、`pnpm build` 和 `pnpm preview`。
5. 检查 `support.html` 初始状态仍不显示二维码；只有点击对应按钮后才显示已配置图片。

配置为空或图片加载失败时，页面自动显示占位信息，不展示无效图片。

## 5. 备案信息更新

取得真实编号后再填写 `filing.icpNumber`、`filing.publicSecurityNumber` 和对应链接。两类编号均为空时，备案区域保持隐藏；禁止使用示例编号。

## 6. 未来静态站点上传流程（仅说明，待单独授权）

1. 在本地执行 `pnpm install --frozen-lockfile`、`pnpm test` 和 `pnpm build`。
2. 将 `dist/` 作为唯一网站静态发布目录，不上传 `node_modules/`、`.git/`、本地 QA 文件、密钥或凭据。
3. 在另行批准的服务器变更窗口中确认官网静态目录与 API 后端目录完全隔离。
4. 备份当前官网静态目录，再上传 `dist/` 内的文件；不要覆盖后端目录或修改 API 代理逻辑。
5. 检查首页、其余 9 个 HTML 页面、两个配置 JSON、说明书 PDF、图片、图标、CSS 与 JavaScript 均可访问。
6. 检查域名、HTTPS 证书链、HTTP 到 HTTPS 跳转、混合内容与移动端访问。
7. 配置 APK 后，从公网下载并重新计算 SHA-256，与网页及发布记录比对。
8. 记录发布时间、Git 提交、构建哈希、文件清单和回退位置。

以上步骤仅是未来部署说明。本阶段不执行 SSH、上传、Nginx、SSL、云服务器或生产后端操作；本仓库不包含生产凭据或服务器配置。
