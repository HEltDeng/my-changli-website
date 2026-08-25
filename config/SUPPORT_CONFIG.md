# 开发者支持入口配置

`support-config.json` 必须保持为标准 JSON，因此不要在 JSON 文件中加入 `//` 或 `/* */` 注释。本文件用于说明各字段和处理顺序。

## 配置结构

```json
{
  "alipaySupportUrl": "",
  "wechatSupportUrl": "",

  "alipayQrImage": "/assets/images/support/alipay.png",
  "wechatQrImage": "/assets/images/support/wechat.png"
}
```

## 处理顺序

1. 用户点击“支持支付宝”或“支持微信”；
2. 对应 `SupportUrl` 非空时，当前页面直接跳转该 HTTPS 地址，由目标页面处理浏览器跳转或支付应用调起；
3. 对应 `SupportUrl` 为空时，当前页面展开对应 `QrImage`；
4. URL 与二维码都为空，或二维码加载失败时，显示未配置占位信息。

配置值会自动去除首尾空格。自动校验和页面运行时都会要求支付链接为包含主机名的绝对 HTTPS URL；不接受 HTTP、相对地址、纯文本账号或带首尾空格的值。无效链接不会被打开，页面会回退到对应二维码。

## 填写方法

- `alipaySupportUrl`：填写开发者确认的支付宝商户经营收款 HTTPS 入口；
- `wechatSupportUrl`：填写开发者确认的微信商户经营收款 HTTPS 入口；
- `alipayQrImage`：支付宝二维码的站内路径；
- `wechatQrImage`：微信二维码的站内路径。

链接示意仅用于说明格式，不要把示意地址写入生产配置：

```json
{
  "alipaySupportUrl": "https://已确认的支付宝商户域名/实际入口",
  "wechatSupportUrl": "https://已确认的微信商户域名/实际入口"
}
```

## 边界与验收

- 这里只提供自愿支持入口，不创建商品、固定金额订单、充值流程或 APP 内支付；
- 不使用外部短链、统计跳转或来源不明的中转地址；
- 不在配置中保存商户密钥、登录凭据、Token、Cookie 或其他敏感信息；
- 填入真实链接后，先执行 `pnpm test`、`pnpm build` 和本地浏览器检查；
- 支付应用能否调起、是否允许用户自行输入金额、收款主体是否正确，必须由开发者在真实手机和对应支付应用中最终确认。
