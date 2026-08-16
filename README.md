# GreenNote Travel

**小绿书 · A reusable self-hosted trip planning and travel guide web app.**

GreenNote Travel（中文昵称“小绿书”）是一套可复用、自托管的旅行计划与导览 Web 应用。它把每日行程、地点攻略、备用方案、草稿编辑、发布和离线浏览放在同一个响应式界面中。仓库内置完全虚构的 Local Demo；克隆后不需要云服务、账号或天气密钥即可运行。

## Features

- 行程首页、任意天数的 Day 页面与路线概览
- 独立地点攻略，以及可选和备用方案
- Admin 草稿编辑、保存、发布与 revision 冲突保护
- 草稿备份与恢复，公开数据和管理数据分离
- PWA 安装及公开页面离线缓存
- 默认 Mock Weather，以及可选的百度天气服务端适配器
- 可选 CloudBase 文档数据库、认证、云函数与静态托管
- 手机、平板和桌面端响应式布局
- Public DTO 与 Admin DTO 分离，内部字段不会进入公开快照

## Quick Start

需要 Node.js 20.19+、22.13+ 或 24+，推荐 Node.js 22。

```bash
npm install
npm run dev
```

打开终端显示的本地地址即可。默认 Local Demo 不需要 CloudBase、百度天气 AK 或 `.env`；数据保存在当前浏览器的本地存储中。更完整的五分钟说明见 [快速开始](docs/QUICK_START.md)。

## Demo

“示例山海自驾 · 3 Days”是完全虚构的演示行程，地点、坐标、价格和活动均不对应真实订单或家庭旅行。Demo 只使用项目原创 SVG 和 CSS 图形，不使用第三方旅行照片。

## Configuration

GreenNote Travel 将三类配置明确分开：

- `AppConfig`：产品名称、语言、时区、功能开关和本地存储命名空间；
- `Trip Data`：行程、Day、Stop、攻略、显示控制及内部字段；
- `TripWeatherConfig`：行程与天气地点之间的映射、坐标和场景。

演示数据位于 `src/data/demoTrip.ts`，默认应用配置位于 `src/config/appConfigDefaults.ts`，天气映射位于 `src/weather/weatherLocations.ts`。修改方法见 [行程数据说明](docs/TRIP_DATA.md)。TypeScript 类型和 Zod schema 是字段规范的最终依据。

## Architecture

```text
UI
↓
Context / Services
↓
Repository Interfaces
↓
Local / CloudBase adapters

Weather Providers
├─ Mock
└─ Baidu（可选，仅服务端持有 AK）
```

Local 与 CloudBase 适配器实现相同的仓库接口。公开读取、管理员草稿、天气快照和发布动作分别经过自己的服务边界。

## Optional Cloud Features

CloudBase 和百度天气都不是默认依赖。Local Demo 使用本地仓库与 Mock Weather。只有准备自托管云端版本时，才需要创建自己的 CloudBase 环境、启用认证、配置管理员白名单并显式指定部署目标。

- [CloudBase 从零配置](docs/CLOUDBASE_SETUP.md)
- [部署说明](docs/DEPLOYMENT.md)
- [天气配置](docs/WEATHER_SETUP.md)
- [天气架构](docs/WEATHER_ARCHITECTURE.md)

## Scripts

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Local Demo 开发服务器 |
| `npm test` | 运行单元测试 |
| `npm run lint` | 执行 ESLint |
| `npm run build` | 构建本地静态前端与 PWA |
| `npm run test:e2e` | 运行 Playwright 浏览器验收 |
| `npm run build:functions` | 构建 CloudBase 函数到忽略目录 |
| `npm run test:functions` | 构建并校验函数入口 |
| `npm run test:template-safety` | 扫描私有数据、凭据和误部署风险 |
| `npm run test:weather-security` | 校验天气密钥边界和浏览器产物 |
| `npm run build:cloud` | 为显式 CloudBase 环境构建前端 |
| `npm run cloud:deploy:functions` | 向显式环境部署函数 |
| `npm run cloud:deploy:hosting` | 向显式环境部署静态托管 |
| `npm run cloud:deploy:all` | 向显式环境部署函数与托管 |

部署命令在缺少 `CLOUDBASE_ENV_ID` 时会主动终止，不存在默认云端目标。

## Security

请先阅读 [安全政策](SECURITY.md) 和 [依赖安全说明](docs/DEPENDENCY_SECURITY.md)。密钥不得使用 `VITE_` 前缀；`BAIDU_WEATHER_AK` 只配置在服务端函数环境；CloudBase env ID 不是 secret，但必须显式提供；管理员操作会由云函数再次检查身份和 `admin_users` 白名单。

## Documentation

- [快速开始](docs/QUICK_START.md)
- [行程数据](docs/TRIP_DATA.md)
- [CloudBase 配置](docs/CLOUDBASE_SETUP.md)
- [部署](docs/DEPLOYMENT.md)
- [天气配置](docs/WEATHER_SETUP.md)
- [天气架构](docs/WEATHER_ARCHITECTURE.md)
- [依赖安全](docs/DEPENDENCY_SECURITY.md)
- [贡献指南](CONTRIBUTING.md)

## Project Status

当前版本为 V1.0。Local Demo、管理草稿流程、PWA、Mock Weather、可选 CloudBase 适配器及自动化测试已具备。现有限制：CloudBase 初始化仍需手工完成控制台配置；定时天气触发器需按自己的旅行日期创建；云端权限规则和管理员名单必须由部署者独立审核；真实旅行数据没有可视化导入向导。

GitHub 仓库：[i-mailang/GreenNote-Travel](https://github.com/i-mailang/GreenNote-Travel)。

## License

[MIT](LICENSE)
