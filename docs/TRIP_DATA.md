# Trip 数据说明

GreenNote Travel 有三类独立配置。不要把它们混成一个大对象：

| 类型 | 负责内容 | 默认位置 |
| --- | --- | --- |
| `AppConfig` | 产品名、语言、时区、主题、功能开关、存储命名空间、天气提供方 | `src/config/appConfigDefaults.ts` |
| `Trip Data` | 行程日期、Day、Stop、攻略、住宿、风险和展示控制 | `src/data/demoTrip.ts` |
| `TripWeatherConfig` | Trip/Day 与天气地点的映射、坐标、场景和核验状态 | `src/weather/weatherLocations.ts` |

字段的最终规范以 `src/types/trip.ts` 和 `src/data/tripSchema.ts` 为准；本文只解释编辑原则，不复制完整 schema。

## 创建自己的行程

1. 复制 `src/data/demoTrip.ts` 到新的数据模块。
2. 修改 Trip 顶层信息、日期和 `days`。
3. 在 `src/data/sampleTrip.ts` 中将默认导出指向新数据。
4. 根据需要调整 AppConfig；如果启用天气，同步建立 TripWeatherConfig。
5. 运行 `npm test`、`npm run lint` 和 `npm run build`。

真实部署时，不建议把订单、证件、家庭电话等敏感信息直接写入公开源码。应把可公开内容与管理员内部信息分开，并确认 Public DTO 的裁剪结果。

## 稳定 ID

- Trip、Day、Stop 和天气地点 ID 应在内容修改后保持稳定；
- 不要使用数组下标或可变标题作为 ID；
- Day 顺序由 `order` 表达，不需要通过改 ID 重排；
- URL、天气映射、备份恢复和 revision 比较都会依赖稳定 ID。

## Day、Stop 与攻略

Day 表达一天的路线、时间、住宿、用餐、强度、选项、核验项和风险计划。Stop 表达路线中的集合、行车、景点、酒店、用餐或休息节点。地点长攻略放在 Stop 的 `guide` 中，Day 页面只展示摘要并链接详情，避免重复正文。

## Display Settings

`displaySettings` 控制首页、Day 卡片和详情字段的公开、管理员、隐藏或继承状态。Day 可通过 `displayOverrides` 做少量覆盖。显示控制不能代替 Public DTO：真正不应公开的字段仍必须在 DTO 层删除。

Stop 的 `visibility` 分为路线可见、详情可见、仅管理员和隐藏，用于控制地点进入路线或攻略页的方式。

## Internal-only 字段

`internalNotes`、受限电话号码和标记为 admin/hidden 的内容属于管理员数据。CloudBase 发布函数会通过 `toPublicTripDTO` 生成公开快照。新增字段时必须同时检查 DTO 和对应测试，不能假设“前端没渲染”就等于安全。

## 图片与署名

图片使用站点绝对路径（例如 `/demo/coast.svg`）或完整的 HTTPS URL，并填写有意义的 `alt`。如有作者或来源，写入 `credit`，同时在 `ASSET_LICENSES.md` 记录再分发许可。不要加入来源不明的网络图片。
