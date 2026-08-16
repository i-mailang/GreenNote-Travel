# Contributing to GreenNote Travel

感谢你愿意改进 GreenNote Travel。项目保持轻量协作流程：先说明问题，提交小而清晰的改动，并让自动化检查能够复现结果。

## 环境与安装

- Node.js 20.19+、22.13+ 或 24+；推荐 Node.js 22
- npm 11（仓库声明的版本见 `packageManager`）

```bash
npm install
npm run dev
```

默认 Local Demo 不需要 `.env`、CloudBase 账号或天气 AK。

## 开发与测试

提交 PR 前至少运行：

```bash
npm test
npm run lint
npm run build
npm run test:functions
npm run test:template-safety
```

涉及路由、响应式布局、PWA、Admin 或天气展示时，再运行 `npm run test:e2e` 和 `npm run test:weather-security`。

## 提交与 PR 建议

- 一次提交解决一个明确问题；
- 提交信息说明原因和用户可见影响；Conventional Commits 推荐但不强制；
- 不把格式化、依赖升级和功能重写混在同一提交中；
- 测试、Lint 和构建通过，新行为有相应测试；
- 不削弱 Public/Admin 数据裁剪和服务端权限检查；
- 文档与实际命令保持一致。

## 数据、凭据与素材

- Demo、fixture 和截图中的旅行数据必须完全虚构，或确认拥有再分发权；
- 不得加入个人旅行订单、电话号码、证件信息、家庭住址或真实凭据；
- 不得提交 API key、访问令牌、Cookie、云账号密钥或含值的本地环境文件；
- 新增图片或图标时必须同步更新 `ASSET_LICENSES.md`，记录作者、来源与许可；
- 无法证明再分发权的素材不应进入仓库。
