# 我的长理 website 来源与开发入口

仓库：HEltDeng/my-changli-website；main 持续向前，不可 reset 回历史提交。组件基线：`196a6ff64080e19eb148e8f2f99791c67a232c3b`。
本机固定目录：`D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\03_Website`。本机统一导航在项目根 SOURCE_OF_TRUTH.md，本文件仅说明本组件。

便携身份规则与唯一实现位于 Android tools/source-identity.json、Test-MyChangliSourceIdentity.ps1；本机路径在项目外 local-source-entrypoints.json。受控克隆显式使用 Validation，仍检查 origin、产品和基线。
正式 V1.0.5 和生产部署不能被验证产物替换。历史说明不是默认开发入口。

既有 qa/TEST_REPORT.md 修改与 qa/screenshots 4项删除保留待验收，不混入本轮提交。downloads/我的长理-V1.0.5-20261001.apk 是未跟踪正式站点制品。独立恢复从正式 Release/官网下载匹配 SHA 的 APK；只有 Git 源码不足以恢复完整下载站点附件。
