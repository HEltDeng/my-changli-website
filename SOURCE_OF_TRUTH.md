# 我的长理唯一开发入口与正式发布来源

生效：2026-10-01 第二阶段整理。正式发布身份固定；当前开发分支持续向前演进，不得每次重置回发布提交。

| 职责 | 唯一日常入口 | 仓库 | 开发入口 |
|---|---|---|---|
| Android | `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\01_Android` | HEltDeng/my-changli-android | main（已确认正确版本线的快进后继；实际执行结果见第二阶段报告） |
| Backend/Admin | `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\02_Backend-Admin`，管理后台为其 admin 子目录 | HEltDeng/my-changli-backend | main |
| Website | `D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Source-当前源码\03_Website` | HEltDeng/my-changli-website | main |

使用项目根目录 MyChangLi.code-workspace 可同时打开三仓。执行 `git status`、`git remote -v`、`git rev-parse HEAD` 查看当前状态；不将文档中某个旧 HEAD 当作回退指令。

## 不变的 V1.0.5 发布身份

- applicationId：com.mychangli.app；versionName：1.0.5；versionCode：37。
- APK：MyChangli-V1.0.5-20261001-release.apk；7163474 字节。
- APK SHA-256：936223F8A7D7E40DBB1929433190CE325073AE689E1BA36C4B90B7E56B538E0A。
- 签名证书 SHA-256：2C3B934931C26719C1A55FA707760A41E18BA15B00561F97691FE1D452F4BF3D。
- 发布归档提交：d56fc5efc8f1584309a7bc348035780e2c816c27。
- Tag：v1.0.5-release-20261001；Release：https://github.com/HEltDeng/my-changli-android/releases/tag/v1.0.5-release-20261001。
- 正式制品目录：`D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\02_Releases-正式发布\V1.0.5`。原 `05_Output/v1.0.5-release-20261001` 发布证明保留。
- 官网正式下载：https://mychangliapp.cn/downloads/我的长理-V1.0.5-20261001.apk。
- APK SHA 与 Git Commit SHA 不可混用。旧 v1.0.5 Tag/撤回包不是本次正式制品。

发布包在 c01915ca1b1164c548f8322218baa41d7846506b 加已验收未提交 UI 修改时构建，随后归档到 d56fc5e。原始构建现场完整脏树快照仍缺失；本轮恢复快照不能补充冒充该证据，也不承诺重建 APK 哈希相同。

## 当前开发与服务关系

整理前 Android 有效 HEAD：1d19370dc9a22817b0286372f5f663a3e36ae889。整理提交只调整说明、身份检查与工具；业务源码和现用资源不作变更。
Backend/Admin 线上 RELEASE_SHA：30a1c5fb37e7803ecadb2fd43b5b05c34f61eb37；本地后继文档提交不代表部署。
官网页面发布提交：88d610779d4b821afe883ee610f89484fa78252f；整理前开发 HEAD：196a6ff64080e19eb148e8f2f99791c67a232c3b。官网既有 qa 修改、截图删除及未跟踪正式下载文件单独保留。

官网 config/site-config.json 与 releases/latest.json 提供展示/下载。实际更新策略来自 `https://api.mychangliapp.cn/api/v1/public/version/android` 及后端发布/策略表。本轮不修改服务器文件、数据库、线上策略或正式 APK。

CSUST 安全 AAR：app/libs/CSUSTDataGet-1.1.4-no-sensitive-logs.aar，SHA256=9B03523FA04E9C8B3F5CAAAD49DC282B17EB2AC82E69A49E89764B21ABF71C29。
完整依赖源码：`D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\01_Repositories\CodexWorkspace-projects\CSUSTDataGet-1.1.4-safe`；10 项 tracked 修改与 SafeLog.kt 未跟踪文件必须一并保护，不能只恢复上游提交。

## Git 管理与禁止母版入口

Android 共同 Git 元数据：`D:\Codex\01_App-应用开发\001_MyChangLi-我的长理\04_Tools\Git-Administration\my-changli-android.git`。这是原 .git 迁移后的 bare 管理仓，禁止删除或作为源码目录打开。唯一日常检出是上表 Android 路径。
旧 2.0.9、SICAU、V1.0.4 Production Reference、timetable、github-baselines-D、恢复快照、C 盘“我的大学”均不是后续开发起点。
仍待核验的 my-changli-android-current、迁移冲突快照、Backend 独有分支和静态零匹配资源不得擅自删除。独立“我的川农”两仓完全排除。

构建前运行 `04_Tools/Test-MyChangliSourceIdentity.ps1`。检查目录、remote、包名、正式基线祖先关系与工作区差异；失败即报错，不切分支、不猜路径、不 reset、不丢弃修改。正式发布前仍需人工判断 dirty 内容及完成发布审批。
