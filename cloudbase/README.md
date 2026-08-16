# CloudBase adapter

此目录保存 GreenNote Travel 的可选 CloudBase 适配器源码与通用规则示例。Local Demo 不读取这里的配置。

- `functions-src/`：公开读取、管理员草稿、发布、备份和天气函数源码；
- `database.rules.json`：默认拒绝浏览器直接访问数据库；
- `function.rules.json`：公开读取函数和受认证管理函数的调用边界；
- `weather.collections.json`：天气集合规划；
- `weather-trigger-candidates.example.json`：空的触发器示例，不含真实日程。

函数构建到 `.cloudbase/functions`，该目录被 Git 忽略。完整配置和部署步骤见 `docs/CLOUDBASE_SETUP.md` 与 `docs/DEPLOYMENT.md`。任何部署都必须显式提供自己的 `CLOUDBASE_ENV_ID`。
