# 天气配置

## 默认：Mock Weather

GreenNote Travel 默认启用天气界面，但 provider 为 `mock`。Mock 数据由本地 fixture 生成，不调用真实 API、不需要 AK，也不会改变 Trip revision。Local Demo 开箱即用。

对应 AppConfig：

```text
features.weather = true
weather.enabled = true
weather.provider = mock
```

如不需要天气，可同时关闭 weather 功能。关闭后 UI 不挂载天气上下文，也不会创建天气仓库。

## TripWeatherConfig

`src/weather/weatherLocations.ts` 定义 TripWeatherConfig：

- `tripId`：与 Trip Data 对应；
- `dayIds` / `locationIds`：允许映射的稳定 ID；
- `locations`：地点名称、Day 关联、主要 Day、场景、坐标类型和核验状态；
- `longitude` / `latitude`：真实 provider 使用的已核验坐标；
- `fixtureCoordinates`：仅供 Mock 数据生成。

复制 Demo 创建自己的映射时，应保证 Day ID 与 Trip Data 一致，并核验真实 provider 的坐标与坐标系。不要把虚构坐标当成真实天气定位。

## 启用百度天气

1. 在百度开放平台创建自己的服务端 AK，并确认接口权限与配额；
2. 在 CloudBase 的云函数环境变量中设置 `WEATHER_PROVIDER=baidu`；
3. 在同一服务端环境设置 `BAIDU_WEATHER_AK`；
4. 为 TripWeatherConfig 填入已核验坐标；
5. 重新部署天气相关函数并先执行管理员状态检查/手动刷新；
6. 运行 `npm run test:weather-security`，确认浏览器构建不含 AK 标记或百度端点。

严禁：

- 使用 `VITE_BAIDU_WEATHER_AK`；
- 把 AK 写入 TypeScript、JSON、Markdown 或前端 `.env`；
- 提交含值的 `.env`；
- 从浏览器直接请求百度天气接口。

## 刷新窗口

`weather.leadDays` 决定旅行开始前多少天进入自动刷新窗口；`refreshTimes.preTrip` 和 `refreshTimes.inTrip` 分别表示行前和行中的北京时间刷新时刻。默认时间来自 AppConfig，但定时触发器必须按自己的 Trip 日期创建，仓库不会附带真实 cron。

触发器名称应符合服务端信任规则，事件时间还必须落在配置窗口和预期时刻内。手动刷新由管理员发起，受服务端权限校验和冷却时间限制。

## 验证

```bash
npm test
npm run test:functions
npm run build
npm run test:weather-security
```

天气快照与 Trip revision 相互独立；天气更新不应生成新的行程修订版。
