# Security Policy

## Supported Versions

当前维护的安全版本为 GreenNote Travel 1.x。更早的实验版本不提供安全更新承诺。

## Reporting a Vulnerability

请不要通过公开 issue 报告疑似密钥泄漏、权限绕过或包含真实个人信息的漏洞。

正式公共仓库启用 GitHub private vulnerability reporting 后，请优先使用该渠道。在该渠道可用前，不要在公开讨论中粘贴真实 credential；只描述受影响组件和不含敏感数据的最小复现。项目目前没有专用安全邮箱，因此不会提供虚构联系方式。

报告应尽量包含受影响版本与运行模式、最小复现步骤、预期与实际行为、可能影响，以及已进行的安全脱敏。

## Security Boundaries

- 浏览器不应持有百度天气 AK；该值只允许进入服务端函数环境。
- CloudBase 管理操作由云函数再次检查登录身份和 `admin_users` 白名单，不能只依赖前端页面保护。
- Public DTO 与 Admin DTO 分离，内部备注、受限电话等字段不应进入公开快照。
- 发布采用预期 revision 检查，避免旧页面静默覆盖新草稿。
- Local Demo 是开发和评估模式，不等于生产安全配置；浏览器本地数据不能替代服务端访问控制、备份和审计。

若怀疑凭据已经泄漏，应先在对应服务商处撤销或轮换凭据，再进行代码和日志排查。
