## What changed

<!-- 简洁说明改动及原因。 -->

## Verification

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:functions`
- [ ] `npm run test:template-safety`
- [ ] 涉及 UI/PWA/路由时已运行 `npm run test:e2e`

## Safety

- [ ] 不包含密钥、访问令牌、Cookie 或含值的本地环境文件
- [ ] Demo/fixture 不包含私人订单、电话或个人信息
- [ ] 新增素材已更新 `ASSET_LICENSES.md` 并确认再分发权
- [ ] 没有削弱 Public/Admin DTO 和服务端管理员校验
