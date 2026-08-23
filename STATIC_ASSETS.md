# 静态资源清单

本清单记录官网源码直接使用的静态资源。构建工具会对图片、CSS 与 JavaScript 文件名增加内容哈希；后续人工部署应上传完整 `dist/`，不要只挑选部分文件。

## 应用素材

| 路径 | 用途 | 源文件大小 |
| --- | --- | ---: |
| `assets/images/app-icon.png` | 顶部品牌、站点图标与下载卡片 | 18,846 B |
| `assets/images/app-home.png` | 首页手机展示画面 | 179,736 B |
| `assets/docs/MyChangli-V1.0.0-User-Manual.pdf` | V1.0.0 软件使用说明书 | 1,757,336 B |

以上素材来自“我的长理”项目现有材料。本阶段没有生成、替换或伪造 APP 截图、安装包与二维码。

## 线性图标

`assets/icons/` 当前包含 17 个 SVG：

- `badge-info.svg`
- `bell-ring.svg`
- `calendar-days.svg`
- `calendar-range.svg`
- `chart-no-axes-column-increasing.svg`
- `clipboard-check.svg`
- `door-open.svg`
- `file-text.svg`
- `languages.svg`
- `library-big.svg`
- `mail.svg`
- `notebook-tabs.svg`
- `panels-top-left.svg`
- `search.svg`
- `shield-alert.svg`
- `smartphone.svg`
- `zap.svg`

图标来自 Lucide，许可边界见 `THIRD_PARTY_NOTICES.md`。

## 页面运行资源

| 路径 | 用途 | 源文件大小 |
| --- | --- | ---: |
| `assets/styles/site.css` | 全站视觉、响应式布局与交互状态 | 24,022 B |
| `assets/scripts/site.js` | 导航、配置、下载状态、锚点、时间线与支持页交互 | 9,542 B |
| `config/site-config.json` | 版本、下载、邮箱、备案与更新日志配置 | 配置文件 |
| `config/support-config.json` | 支付宝/微信支持二维码路径配置 | 配置文件 |

网站不加载第三方字体、远程脚本、统计 SDK 或外部样式表。开源项目按钮只在用户点击后跳转到 GitHub，不作为页面运行依赖。

## 预留支持二维码

当前仓库没有支付宝或微信二维码图片，两个配置字段均为空。未来人工补充时：

1. 把开发者确认可公开展示的压缩图片放入 `assets/images/support/`；
2. 在 `config/support-config.json` 填写对应站内路径；
3. 执行 `pnpm test`、`pnpm build` 与本地浏览器复验；
4. 确认页面初始状态仍不显示二维码，点击对应按钮后才显示图片。

不要把支付账号、密钥、登录凭据或其他敏感信息写入配置文件。
