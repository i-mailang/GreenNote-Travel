# 天气架构

GreenNote Travel 的天气模块是行程的只读增强层，不是 Trip Data 的内嵌字段，也不参与草稿 revision。

## 数据流

```text
TripWeatherConfig
        ↓
Refresh Scheduler / Manual Admin Refresh
        ↓
Weather Provider Interface
   ├─ Mock provider
   └─ Baidu provider
        ↓
WeatherSnapshot
        ↓
Public Weather DTO / Admin Summary
        ↓
Day UI
```

## Provider abstraction

Provider 接口只负责为配置地点返回规范化天气结果。Mock provider 用于本地、测试和 CI；Baidu provider 只在服务端由 `WEATHER_PROVIDER=baidu` 选择，并通过构造参数取得服务端 AK。UI 和 repository 不需要知道供应商响应格式。

## Snapshot

一次刷新产生一个 Trip 级 WeatherSnapshot，包含：

- trip ID 与生成、检查、下次计划时间；
- provider 和整体状态；
- 各地点的当前、逐小时和逐日数据；
- 每个地点的 `ok`、`stale` 或 `unavailable` 状态。

只有内容变化时才整体写入新快照；仅检查时间或状态变化可做小范围更新。快照使用独立集合和缓存键，不修改 Trip revision。

## DTO boundary

Public Weather DTO 只暴露页面需要的天气数据。管理员摘要额外包含 provider、AK 是否已配置、成功/陈旧/不可用计数和冷却时间，但不会返回 AK 值。

## Stale fallback 与 partial failure

刷新按地点独立处理。单个地点失败时：

- 若存在仍在允许时限内的旧数据，标记为 `stale` 并继续提供；
- 没有可用旧数据时标记为 `unavailable`；
- 其他成功地点仍正常更新；
- 运行摘要记录成功、失败、复用数量，不把整批部分失败伪装为全量成功。

## Manual refresh cooldown

管理员手动刷新必须先通过身份和白名单校验。服务端使用 runtime 文档保存锁和冷却截止时间，避免连续点击导致供应商请求风暴。前端提示只是体验层，真正限制在服务端执行。

## Timer idempotency

定时事件必须具有受信类型和命名，并通过日期窗口、北京时间刷新时刻检查。服务端以 schedule slot 记录最近完成项：

- 同一 slot 重复投递返回 duplicate；
- 有有效锁时返回 busy；
- 非预期时刻记录 skipped；
- 异常退出会释放运行锁。

因此 CloudBase 定时触发器的至少一次投递不会自然导致重复抓取或重复写入。

## Client/server secret boundary

浏览器只调用 CloudBase 函数和读取裁剪 DTO。百度 AK 只从服务端进程环境读取，不能使用 `VITE_` 前缀，也不能进入静态产物。`test:weather-security` 会扫描仓库文件和浏览器构建，`test:template-safety` 会扫描凭据值和私有环境残留。
