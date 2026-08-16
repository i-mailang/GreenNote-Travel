# 五分钟启动 GreenNote Travel

## 1. 准备环境

安装 Node.js 20.19+、22.13+ 或 24+，推荐 Node.js 22。确认终端可以执行：

```bash
node --version
npm --version
```

## 2. 安装并启动

进入项目目录后执行：

```bash
npm install
npm run dev
```

终端会显示本地网址，通常形如 `http://localhost:5173/`。用浏览器打开即可看到“三日山海自驾”Local Demo。

## 3. 默认会发生什么

- 使用完全虚构的三日行程；
- 使用 Mock Weather，不请求真实天气服务；
- 草稿、公开版和备份保存在当前浏览器；
- `/admin` 可体验本地管理流程；
- 保存草稿不会自动发布，点击“发布”后公开页才更新；
- PWA 开发期行为与生产构建不同，离线验收请运行 E2E 或预览构建。

`.env` 完全可选。Local Demo 不需要 CloudBase 环境、百度天气 AK、账号或云端网络。

## 4. 常用检查

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

如需替换演示行程，继续阅读 [行程数据说明](TRIP_DATA.md)。如需云端共享，再阅读 [CloudBase 配置](CLOUDBASE_SETUP.md)。
