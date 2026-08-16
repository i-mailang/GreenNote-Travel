# CloudBase 从零配置

CloudBase 是可选能力。请先确认 Local Demo 正常，再为自己的共享版本创建独立环境。以下所有示例中的 `<CLOUDBASE_ENV_ID>` 都必须替换为你自己的环境 ID；仓库没有默认部署目标。

## 1. 创建环境与取得 env ID

在腾讯云 CloudBase 控制台创建环境并记录 env ID。env ID 不是 secret，但它属于部署配置，不应被误认为本仓库提供的公共默认目标。

使用仓库内 CLI 前，可执行 `npx tcb login`。登录需要你自己的腾讯云授权，不要把账号凭据提交到仓库。

## 2. Authentication

在“身份认证”中启用适合自己的 Authentication v2 登录方式。当前管理登录界面支持邮箱与密码。若公开端需要匿名调用云函数，可按 CloudBase 当前控制台能力启用匿名认证；最终仍以函数权限规则为准。

## 3. 管理员白名单

创建 `admin_users` 集合，以管理员 Authentication UID 作为文档 ID，并至少写入：

```json
{
  "enabled": true,
  "displayName": "Site administrator"
}
```

前端登录成功不代表拥有管理权。所有管理云函数都会再次读取 `admin_users/<UID>` 并要求 `enabled: true`。

## 4. Collections

创建 `trip_admin`、`trip_public`、`trip_backups`、`admin_users`、`trip_weather` 和 `trip_weather_runtime`。前两个和两个天气集合使用固定文档 `main`；备份集合保存历史快照。天气集合说明也保存在 `cloudbase/weather.collections.json`。

首次行程内容由管理员页面的初始化操作创建，初始化不会自动发布。

## 5. Rules

参考 `cloudbase/database.rules.json` 和 `cloudbase/function.rules.json`。数据库规则默认禁止浏览器直接读写，公开数据也通过只读云函数获取；管理函数要求非匿名身份，并在函数内部再次校验白名单。部署前应在控制台逐项核对并应用规则，不要只依赖前端 `/admin` 路由隐藏。

## 6. Functions

PowerShell：

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run cloud:deploy:functions
```

macOS/Linux：

```bash
CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>' npm run cloud:deploy:functions
```

函数涵盖公开读取、管理员读取/初始化/保存/发布、备份列表/恢复和天气读取/刷新。构建产物写入 `.cloudbase/functions`，该目录不会进入 Git。

## 7. Hosting

```powershell
$env:CLOUDBASE_ENV_ID='<CLOUDBASE_ENV_ID>'
npm run cloud:deploy:hosting
```

脚本会生成 cloud 模式构建、验证目标标记和 SPA 回退页，然后将 `dist` 部署到指定环境。

## 8. 初始化与验证

1. 打开部署后的 `/login`，用白名单账号登录；
2. 进入 `/admin`，初始化第一份云草稿；
3. 编辑并保存草稿；
4. 打开 `/preview` 检查草稿；
5. 点击发布；
6. 回到 `/` 验证公开快照；
7. 直接刷新 `/day/<day-id>` 和地点详情路由，确认 SPA 回退正常。

进一步检查见 [部署说明](DEPLOYMENT.md)，百度天气设置见 [天气配置](WEATHER_SETUP.md)。
