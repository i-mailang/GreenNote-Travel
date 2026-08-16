# 依赖安全说明

本文件记录 GreenNote Travel V1.0 在 2026-08-16 使用当前 npm advisory 数据库得到的结果。安全公告会变化，发布者应在每次发布前重新执行审计。

## 当前结果

| 命令 | 结果 |
| --- | --- |
| `npm audit` | 5 个依赖条目：1 moderate、4 high、0 critical |
| `npm audit --omit=dev` | 0 个漏洞 |

Phase 3 初始 lockfile 在同一天报告 12 个条目（1 moderate、11 high）。将纯构建依赖移至 `devDependencies`，并把 Vite 的传递依赖 `nanoid` 安全覆盖到 3.3.18 后，前端构建链告警被消除。

`--omit=dev` 为 0 表示默认浏览器运行依赖树没有已知公告，但不代表可选 CloudBase 部署没有风险：`@cloudbase/node-sdk` 在根项目中用于函数构建，因此归类为 devDependency；生成的每个云函数会把它声明为服务端运行依赖。

## 剩余条目

| Package | Advisory 类型 | Dependency path | Runtime exposure | 当前处置 | 暂时接受原因与后续建议 |
| --- | --- | --- | --- | --- | --- |
| `@cloudbase/node-sdk@3.18.3` | high，聚合 database 与 HTTP 客户端公告 | 直接 devDependency；生成函数的直接 runtime dependency | 仅启用 CloudBase 云函数时存在服务端暴露 | 保留并记录 | 当前已是该线最新版本；npm 建议 3.0.0 且标为 semver-major，属于不安全降级/迁移。等待腾讯 CloudBase 发布兼容修复后单独升级和回归函数测试。 |
| `@cloudbase/database@1.4.3` | high，原型污染传递风险 | node SDK → database | 云函数数据库适配器 | 接受并限制输入/权限 | 只有管理员可写 Trip，集合和文档路径固定；仍需跟踪上游替换 lodash helper 的版本。 |
| `axios@0.27.2` | high，SSRF、重定向凭据泄漏、原型污染与 DoS 公告集合 | node SDK → axios | 云函数内部访问 CloudBase 服务 | 接受并限制调用面 | 项目不把用户 URL 传给 axios，SDK 使用当前云环境；不能视为零风险。上游升级后优先验证，避免通过 overrides 强改 SDK 的 HTTP 客户端。 |
| `lodash.set@4.3.2` | high，原型污染 | node SDK → database → lodash.set | 云函数数据库操作 | 暂时接受 | 包自身没有可用安全版本，直接 override 无法修复。等待 database SDK 移除该依赖。 |
| `lodash.unset@4.5.2` | moderate，数组路径绕过/原型污染 | node SDK → database → lodash.unset | 云函数数据库操作 | 暂时接受 | 当前包线没有安全版本；不对 CloudBase SDK 内部实现做未经支持的替换。 |

## 已采取的缓解

- 浏览器 production dependencies 只保留运行必需包；
- Vite、PWA 插件、CloudBase CLI 与 node SDK 均归入开发/部署工具依赖；
- `nanoid` 使用无公告的 3.3.18 patch；
- CloudBase 管理函数要求认证和服务端管理员白名单；
- 集合名、文档 ID 和供应商端点由代码固定，不接受任意远程 URL；
- CI 和本地验收不调用真实 CloudBase 或百度 API；
- 不使用 `npm audit fix --force`，也不为追求数字清零破坏 SDK 兼容性。

## 后续升级流程

1. 检查 CloudBase node SDK 与 database SDK 的 release notes；
2. 在独立分支升级，不通过传递依赖 overrides 强行替换 axios/lodash；
3. 运行单元测试、函数打包校验、Local/Cloud repository 测试和安全扫描；
4. 在个人测试环境验证认证、保存、发布、备份和天气刷新；
5. 再更新本文件中的审计日期、路径和风险判断。
