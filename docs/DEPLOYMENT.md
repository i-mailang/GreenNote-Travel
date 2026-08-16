# 部署说明

GreenNote Travel 默认只运行 Local Demo。CloudBase 部署必须由操作者显式提供自己的 `CLOUDBASE_ENV_ID`，脚本不会猜测、缓存或回退到任何默认环境。

## Local Build

```bash
npm ci
npm run build
```

输出位于 `dist`。该构建保持默认 Local 模式，可用 `npm run preview` 本地预览。

## Cloud Build

PowerShell：

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run build:cloud
npm run test:cloud-dist
```

macOS/Linux：

```bash
CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>' npm run build:cloud
CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>' npm run test:cloud-dist
```

Cloud build 会显式设置 cloud 功能开关和 env ID，写入 `dist/build-mode.json`，并生成与首页一致的 `404.html`。验证脚本要求 marker 中的目标与当前环境变量完全一致。

## Functions

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run cloud:deploy:functions
```

函数会先进行 TypeScript 检查和打包，再由 CloudBase CLI 部署到显式环境。

## Hosting

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run cloud:deploy:hosting
```

托管部署会重新生成并校验 cloud 构建，不复用来源不明的旧 `dist`。

## Full Deploy

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run cloud:deploy:all
```

该命令依次部署函数和静态托管。数据库集合、认证方式、管理员白名单、规则和定时触发器仍需按 [CloudBase 配置](CLOUDBASE_SETUP.md) 在自己的环境中确认。

## 防误部署机制

- `build:cloud`、cloud dist 校验和所有 deploy 命令都要求非空 `CLOUDBASE_ENV_ID`；
- `cloudbaserc.example.json` 的 env ID 为空；
- deploy 脚本只在运行期间生成 `cloudbaserc.json`，结束时删除；
- 每次托管部署都会验证 build marker 与目标一致；
- 仓库没有 deploy CI，也不读取默认生产目标。

## 生产前确认清单

- [ ] Local 测试、Lint、Build、函数测试和 E2E 全部通过
- [ ] `npm run test:template-safety` 和 `npm run test:weather-security` 通过
- [ ] 当前终端的 `CLOUDBASE_ENV_ID` 是本人环境
- [ ] Authentication、集合、数据库规则和函数规则已人工复核
- [ ] `admin_users` 只包含当前授权管理员
- [ ] Public DTO 不包含内部备注、受限电话或凭据
- [ ] 百度天气 AK（如启用）只存在于服务端函数环境
- [ ] `/`、`/login`、`/admin`、`/preview`、Day 和地点详情直达刷新正常
- [ ] PWA 更新、离线公开缓存和移动端布局已验证
- [ ] 已准备回滚所需的上一版静态产物和数据备份
