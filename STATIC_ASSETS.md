# 静态资源清单

本清单记录官网源码直接使用的静态资源。构建工具会对图片、CSS 与 JavaScript 文件名增加内容哈希；后续人工部署应上传完整 `dist/`，不要只挑选部分文件。

## 应用素材

| 路径 | 用途 | 源文件大小 |
| --- | --- | ---: |
| `assets/images/app-icon.png` | 顶部品牌、站点图标与下载卡片 | 18,846 B |
| `assets/images/app-home.jpg` | 首页手机展示画面 | 310,440 B |
| `assets/images/support/alipay.png` | 支付宝支持二维码，默认不展示 | 224,870 B |
| `assets/images/support/wechat.png` | 微信支持二维码，默认不展示 | 154,011 B |
| `assets/docs/MyChangli-V1.0.0-User-Manual.pdf` | V1.0.0 软件使用说明书 | 1,757,336 B |

首页画面使用开发者本轮提供的 1200 × 2664 原始截图，未进行缩放重编码；支持二维码沿用开发者已放入仓库的本地图片。未生成或伪造 APP 截图、安装包与支付信息。

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
| `config/support-config.json` | 支付宝/微信支持链接与二维码兜底配置 | 配置文件 |

网站不加载第三方字体、远程脚本、统计 SDK 或外部样式表。开源项目按钮只在用户点击后跳转到 GitHub，不作为页面运行依赖。

## 支持入口配置

当前支持链接为空，二维码路径已配置。后续人工调整时：

1. 如使用支付链接，只填写开发者确认的 HTTPS 地址；
2. 如使用二维码兜底，把确认可公开展示的图片放入 `assets/images/support/`，并填写对应站内路径；
3. 执行 `pnpm test`、`pnpm build` 与本地浏览器复验；
4. 确认页面初始状态不展示支付信息；链接存在时点击后打开链接，链接为空时点击后才显示二维码。

不要把支付账号、密钥、登录凭据或其他敏感信息写入配置文件。
