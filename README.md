> 当前入口（2026-10-01 第二阶段整理）：Android `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\01_Android`；Backend/Admin `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\02_Backend-Admin`；Website `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\03_Website`。
> 以项目根目录 SOURCE_OF_TRUTH.md 与 04_Tools/source-identity.json 为现行导航。下文旧路径、候选状态、V1.0.4/2.0.9 环境验证属于历史记录，不得作为新的开发起点。

# 我的长理独立发布官网

“我的长理”独立发布与下载页面源码。网站是个人开发者项目发布站，采用纯静态 HTML、CSS 与原生 JavaScript，不包含用户系统、数据库、评论、社区、在线表单或第三方统计 SDK。

## 当前状态

- 源码与本地页面检查已完成，真实设备和上线验收仍由开发者执行。
- 已借鉴 PriceAI 的胶囊导航、圆形快捷入口、移动端左侧抽屉和页脚入口卡片；站点保留自己的品牌、蓝白色调与内容，不使用 PriceAI 商标或品牌素材。
- 页眉快捷入口为明暗、直接邮箱、公告和 QQ；QQ 交流群支持群号复制、一键加群链接与二维码三种方式。GitHub 地址未配置时入口自动隐藏。
- 新增“入门指南”和“商业合作”页面；指南支持左侧目录与关键词过滤，商业合作页面只描述沟通材料与边界，不预设未确认的承诺。
- 首页学习、生活与提醒入口可跳转到功能页对应分区，并在视口中部定位。
- 已增加“感谢开源”“支持开发者”页面；支持信息默认不显示，点击后优先打开已配置链接，链接为空时再显示对应二维码。
- 首页已接入独立网站公告接口：公告栏位于导航下方，详情使用可访问的原生弹窗，未读状态按公告 `id + updatedAt` 保存在浏览器本地；APP公告不会串入官网。
- Android V1.0.2 的 APK 地址、发布日期、文件大小和 SHA-256 已按当前发布配置展示。
- iOS 入口为灰色不可点击状态。
- ICP 备案号 `湘ICP备2026035265号-1` 已写入配置并出现在十二个公开页面页脚；公安联网备案字段为空并自动隐藏。
- 本阶段仅执行本地开发与验收，不连接或修改生产服务器；网站公告表、后台 CRUD 与公开接口均在本地代码和隔离测试数据库验证。

## 页面

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页、应用定位、Android/iOS 入口与非官方声明 |
| `features.html` | 13 项真实功能，按学习、生活、考试与智能辅助分类 |
| `download.html` | Android 下载中心、文件信息与校验值 |
| `updates.html` | 配置驱动的纵向版本时间线 |
| `contact.html` | 联系反馈与投诉举报邮件入口 |
| `thanks.html` | 开源感谢、上游项目致谢与开发者支持入口 |
| `support.html` | 配置驱动的支付宝/微信支持入口，链接优先、二维码兜底 |
| `guides.html` | 常用功能指南、左侧目录与关键词搜索 |
| `commercial.html` | 商务合作沟通方向、材料清单与边界 |
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
├─ thanks.html
├─ support.html
├─ guides.html
├─ commercial.html
├─ privacy.html
├─ terms.html
├─ manual.html
├─ assets/
│  ├─ docs/
│  ├─ icons/
│  ├─ images/
│  ├─ scripts/site.js
│  └─ styles/site.css
├─ downloads/
│  └─ 我的长理-V1.0.2.apk
├─ config/
│  ├─ site-config.json
│  ├─ support-config.json
│  └─ SUPPORT_CONFIG.md
├─ ANNOUNCEMENTS.md
├─ qa/
│  ├─ ANNOUNCEMENT_TEST_REPORT.md
│  ├─ mock-public-api.mjs
│  ├─ screenshots/
│  └─ TEST_REPORT.md
├─ scripts/validate-site.mjs
├─ DEPLOYMENT.md
├─ STATIC_ASSETS.md
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
| `version` | 纯版本号 | `1.0.2` |
| `displayVersion` | 页面展示版本 | `V1.0.2` |
| `releaseDate` | 实际发布日期 | `2026-09-05` |
| `androidDownloadUrl` | APK 地址 | `/downloads/我的长理-V1.0.2.apk` |
| `apkSize` | 文件大小展示文本 | `5.75 MiB` |
| `apkSha256` | 最终 APK 的 SHA-256 | 已配置 |
| `iosStatus` | iOS 发布状态 | `coming-soon` |
| `iosDownloadUrl` | iOS 正式发布地址；未发布时留空 | 空 |
| `publicApiBaseUrl` | 公共 API 基地址；留空使用同源 `/api/v1` | 空（待人工部署网关） |
| `publicWebsiteAnnouncementsPath` | 网站公告公开路径 | `/public/website-announcements` |
| `releases` | 最新在前的版本时间线数据 | V1/V2/V3 |
| `contact` | 邮箱地址拆分字段，由脚本生成 `mailto:` | 已配置 |
| `community` | QQ/GitHub 快捷入口配置 | QQ 群号、加群链接与二维码已配置；GitHub 地址留空并隐藏 |
| `filing` | ICP 与公安备案信息 | ICP `湘ICP备2026035265号-1`；公安备案为空 |

不要填写占位下载地址、未签发的备案号或未经最终安装包核验的校验值。

开发者支持入口集中在 `config/support-config.json`：

| 字段 | 说明 | 当前值 |
| --- | --- | --- |
| `alipaySupportUrl` | 支付宝 HTTPS 支持链接；存在时优先打开 | 空 |
| `wechatSupportUrl` | 微信 HTTPS 支持链接；存在时优先打开 | 空 |
| `alipayQrImage` | 支付宝二维码图片的站内路径 | `/assets/images/support/alipay.png` |
| `wechatQrImage` | 微信二维码图片的站内路径 | `/assets/images/support/wechat.png` |

页面初始状态不展示链接或二维码。点击按钮时会优先打开对应 `SupportUrl`；链接为空时读取对应 `QrImage` 并在当前页面显示。支持链接必须使用 HTTPS，二维码必须放在 `assets/images/support/` 并使用站内路径；构建流程会自动复制该目录。不要填写外部短链、跟踪链接或任何密钥、令牌与登录凭据。

逐字段填写、验收顺序和安全边界见 [`config/SUPPORT_CONFIG.md`](config/SUPPORT_CONFIG.md)。

动态公告的后端审计、响应样例、同源代理和本地已读逻辑见 [`ANNOUNCEMENTS.md`](ANNOUNCEMENTS.md)。本地 mock API 可用 `node qa/mock-public-api.mjs` 启动在 `127.0.0.1:8788`，仅供浏览器场景测试，不连接生产服务。

## 内容边界

网站明确说明：“我的长理”由个人开发者开发和维护，是非官方校园辅助工具，与长沙理工大学不存在官方隶属、授权或合作关系。页面功能以 V1.0.0 软件使用说明书为准，不扩展未存在的能力。

## 素材与许可

- 应用图标、APP 界面截图与软件说明书来自“我的长理”V1.0.0 项目材料。
- 线性界面图标来自 Lucide，许可说明见 `THIRD_PARTY_NOTICES.md`。
- 上游开源项目致谢见 `thanks.html` 与 `THIRD_PARTY_NOTICES.md`。
- 静态资源明细见 `STATIC_ASSETS.md`。
