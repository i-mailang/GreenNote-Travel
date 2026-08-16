import type { Trip, TripStop } from '../types/trip'
import { DEFAULT_DISPLAY_SETTINGS } from './defaults'

const stop = (value: Pick<TripStop, 'id' | 'name' | 'type' | 'summary'> & Partial<TripStop>): TripStop => ({
  status: '计划中', arrivalTime: '', duration: '', address: '', navigationUrl: '', ticketNotes: '', internalNotes: '', visibility: 'detail', phoneVisibility: 'admin', ...value,
})

export const demoTrip: Trip = {
  schemaVersion: 3,
  id: 'demo-shanhai-3d',
  title: '示例山海自驾 · 3 Days',
  subtitle: '一份完全虚构、可自由替换的自托管行程示例',
  startDate: '2030-05-16',
  endDate: '2030-05-18',
  participantCount: 4,
  vehicle: '示例车辆 · 1 辆',
  status: '筹备中',
  globalNotice: '这是演示数据。出发前请用自己的日期、地点和预订信息完整替换。',
  credit: 'GreenNote Travel 项目原创',
  updatedAt: '2030-01-01T00:00:00.000Z',
  displaySettings: structuredClone(DEFAULT_DISPLAY_SETTINGS),
  days: [
    {
      id: 'demo-day-1', order: 1, date: '2030-05-16', title: '青屿城 → 海湾步道 → 山居民宿', origin: '青屿城', destination: '山居民宿', stayCity: '山居片区', departureTime: '09:00', arrivalTime: '18:00', status: '已确认', reminder: '保留日落前抵达民宿的缓冲时间。',
      hotel: { name: '山居民宿', phone: '', address: '示例地址 · 松林路 1 号' }, meals: '午餐在步道入口简餐，晚餐在民宿。', reminders: '随身携带薄外套和饮用水。', backupPlan: '如海边风大，改走林荫短线并提前入住。', summary: '从虚构的青屿城出发，沿海湾步道慢行，傍晚进入山居片区。', intensity: '轻松',
      options: [{ title: '方案 A · 海湾全线', description: '天气稳定时完成完整步道。' }, { title: '方案 B · 林荫短线', description: '风雨或疲劳时缩短户外时间。' }], choiceBasis: '根据海风、降雨和同行者体力现场选择。', verificationItems: ['确认民宿入住时间', '检查沿海步道开放状态'], displayOverrides: {},
      plan: { driving: { distanceKm: 48, plannedHours: 1.5 }, accommodation: { city: '山居片区', summary: '安静的虚构山居民宿', parking: '院内示例停车位' }, meals: { primary: '步道入口简餐', backups: ['青屿城便当'] }, risks: { weather: '海风可能影响步道体验。', backupTriggers: ['持续降雨时启用林荫短线'] } },
      stops: [
        stop({ id: 'demo-qingyu', name: '青屿城集合点', type: '集合', arrivalTime: '09:00', duration: '30 分钟', address: '示例地址 · 青屿大道 8 号', summary: '核对装备后从城市边缘集合出发。', internalNotes: '演示内部字段：检查公共版不应显示此行。', visibility: 'route' }),
        stop({ id: 'demo-baywalk', name: '海湾步道', type: '景点', arrivalTime: '11:00', duration: '3 小时', address: '示例地点 · 蓝湾入口', summary: '沿虚构海湾的轻量徒步路线，可按体力折返。', ticket: 'Demo 票价：免费', ticketNotes: '无需预约，仅作功能示例。', walkingIntensity: '轻松', weatherSensitivity: '高', image: { src: '/demo/coast.svg', alt: '几何图形绘制的虚构海湾与步道', credit: 'GreenNote Travel original SVG' }, guide: { title: '海湾步道', subtitle: '虚构示例攻略', overview: '一条用于展示攻略结构的虚构滨海步道。', sections: [{ title: '建议走法', paragraphs: ['从蓝湾入口缓步进入，先完成观景平台短线；体力充足时再延伸至松涛岬。'] }, { title: '弹性安排', table: { columns: ['方案', '适用情况'], rows: [['短线', '风大或同行者需要休息'], ['全线', '天气稳定且时间充足']] } }] } }),
        stop({ id: 'demo-mountain-stay', name: '山居民宿', type: '酒店', arrivalTime: '17:30', duration: '过夜', address: '示例地址 · 松林路 1 号', summary: '虚构住宿节点，用于演示入住、停车和备选安排。', reservation: 'Demo：入住前再次确认', parking: '院内停车', visibility: 'route' }),
      ],
    },
    {
      id: 'demo-day-2', order: 2, date: '2030-05-17', title: '松风岭 → 云海观景台 → 温泉小镇', origin: '山居民宿', destination: '温泉小镇', stayCity: '温泉小镇', departureTime: '08:30', arrivalTime: '17:30', status: '待确认', reminder: '清晨先观察山间能见度。',
      hotel: { name: '温泉小镇客舍', phone: '', address: '示例地址 · 暖泉街 6 号' }, meals: '携带简餐，晚餐在小镇自由选择。', reminders: '山脊温差明显，注意防滑。', backupPlan: '云雾过浓时取消观景台，直接前往温泉小镇。', summary: '穿过松风岭，在虚构观景台短暂停留，下午进入温泉小镇。', intensity: '适中',
      options: [{ title: '观景台停留', description: '能见度良好时按计划前往。' }, { title: '直接进镇', description: '大雾或道路湿滑时跳过可选点。' }], choiceBasis: '以能见度和道路安全为先。', verificationItems: ['查看山路天气', '确认客舍停车位置'], displayOverrides: {},
      plan: { driving: { distanceKm: 76, plannedHours: 2.5, breakStops: [{ name: '松风岭休息点', durationMinutes: 20 }] }, accommodation: { city: '温泉小镇', summary: '步行可达餐饮街区的示例客舍' }, risks: { traffic: '山路弯道较多。', mainDelayPoint: '云海观景台支路' } },
      stops: [
        stop({ id: 'demo-pine-ridge', name: '松风岭', type: '景点', arrivalTime: '10:00', duration: '1.5 小时', address: '示例地点 · 松风岭入口', summary: '虚构林岭短线，设有休息平台。', image: { src: '/demo/ridge.svg', alt: '几何图形绘制的虚构松林山岭', credit: 'GreenNote Travel original SVG' }, weatherSensitivity: '中' }),
        stop({ id: 'demo-cloud-deck', name: '云海观景台（可选）', type: '景点', status: '待确认', arrivalTime: '13:30', duration: '1 小时', address: '示例地点 · 云岭支路', summary: '可选停靠点；仅在能见度与道路条件合适时前往。', backup: '跳过后直接前往温泉小镇。', weatherSensitivity: '高' }),
        stop({ id: 'demo-spring-town', name: '温泉小镇', type: '酒店', arrivalTime: '17:00', duration: '过夜', address: '示例地点 · 暖泉街', summary: '虚构小镇住宿和晚间休整节点。', reservation: 'Demo：预订信息待替换', visibility: 'route' }),
      ],
    },
    {
      id: 'demo-day-3', order: 3, date: '2030-05-18', title: '湖畔晨游 → 返回青屿城', origin: '温泉小镇', destination: '青屿城', stayCity: '青屿城', departureTime: '08:00', arrivalTime: '15:00', status: '待确认', reminder: '返程日不安排紧凑活动。',
      hotel: { name: '', phone: '', address: '' }, meals: '湖畔早餐后返程。', reminders: '出发前检查随身物品。', backupPlan: '下雨时取消晨游，早餐后直接返程。', summary: '在虚构湖畔短暂散步后返程，预留充足机动时间。', intensity: '轻松', options: [], choiceBasis: '以返程安全和休息为优先。', verificationItems: ['检查退房物品', '确认返程路况'], displayOverrides: {},
      plan: { driving: { distanceKm: 92, plannedHours: 2.5 }, meals: { primary: '湖畔早餐' }, risks: { traffic: '返程时段可能有短时拥堵。' } },
      stops: [stop({ id: 'demo-lake-morning', name: '湖畔晨游', type: '景点', arrivalTime: '08:30', duration: '45 分钟', address: '示例地点 · 镜湖步道', summary: '无图片 Day 示例：轻量散步后从容返程。', weatherSensitivity: '中', visibility: 'route' })],
    },
  ],
}
