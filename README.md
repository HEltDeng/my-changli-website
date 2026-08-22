# 我的长理官方发布官网

“我的长理”V1.0.0 的官方发布与下载页面源码。网站是个人开发者项目发布站，采用纯静态 HTML、CSS 与原生 JavaScript，不包含用户系统、数据库、评论、社区、在线表单或第三方统计 SDK。

## 当前状态

- 源码与本地页面验收已完成。
- Android 平台展示为开放，但真实 APK 地址、发布日期、文件大小和 SHA-256 尚未提供，下载按钮会保持禁用。
- iOS 入口为灰色不可点击状态。
- ICP 与公安备案号为空时，页脚备案区域自动隐藏。
- 本阶段没有连接或修改生产服务器。

## 页面

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页、应用定位、Android/iOS 入口与非官方声明 |
| `features.html` | 13 项真实功能，按学习、生活、考试与智能辅助分类 |
| `download.html` | Android 下载中心、文件信息与校验值 |
| `updates.html` | 配置驱动的纵向版本时间线 |
| `contact.html` | 联系反馈与投诉举报邮件入口 |
| `privacy.html` | 网站与 APP 信息处理边界说明 |
| `terms.html` | 服务范围、信息核对与使用边界 |
| `manual.html` | V1.0.0 软件使用说明书查看与下载 |

## 项目结构

```text
my-changli-website/
├─ index.html
├─ features.html
├─ download.html
├─ updates.html
├─ contact.html
├─ privacy.html
├─ terms.html
├─ manual.html
├─ assets/
│  ├─ docs/
│  ├─ icons/
│  ├─ images/
│  ├─ scripts/site.js
│  └─ styles/site.css
├─ config/site-config.json
├─ qa/
│  ├─ screenshots/
│  └─ TEST_REPORT.md
├─ scripts/validate-site.mjs
├─ DEPLOYMENT.md
└─ vite.config.js
```

## 本地运行

需要 Node.js 22.13 或更高版本，以及 pnpm。

```powershell
pnpm install
pnpm dev
```

默认本地地址为 `http://127.0.0.1:5173/`。

执行内容边界检查与生产构建：

```powershell
pnpm test
pnpm build
pnpm preview
```

构建产物位于 `dist/`。部署与 APK/版本替换流程见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 配置文件

所有发布状态集中在 `config/site-config.json`：

| 字段 | 说明 | 当前值 |
| --- | --- | --- |
| `version` | 纯版本号 | `1.0.0` |
| `displayVersion` | 页面展示版本 | `V1.0.0` |
| `releaseDate` | 实际发布日期；未确认时留空 | 空 |
| `androidDownloadUrl` | 实际 APK 地址；未确认时留空 | 空 |
| `apkSize` | 文件大小展示文本 | 空 |
| `apkSha256` | 最终 APK 的 SHA-256 | 空 |
| `iosStatus` | iOS 发布状态 | `coming-soon` |
| `iosDownloadUrl` | iOS 正式发布地址；未发布时留空 | 空 |
| `releases` | 最新在前的版本时间线数据 | V1/V2/V3 |
| `contact` | 邮箱地址拆分字段，由脚本生成 `mailto:` | 已配置 |
| `filing` | ICP 与公安备案信息 | 编号为空 |

不要填写占位下载地址、未签发的备案号或未经最终安装包核验的校验值。

## 内容边界

网站明确说明：“我的长理”由个人开发者开发和维护，是非官方校园辅助工具，与长沙理工大学不存在官方隶属、授权或合作关系。页面功能以 V1.0.0 软件使用说明书为准，不扩展未存在的能力。

## 素材与许可

- 应用图标、APP 界面截图与软件说明书来自“我的长理”V1.0.0 项目材料。
- 线性界面图标来自 Lucide，许可说明见 `THIRD_PARTY_NOTICES.md`。
