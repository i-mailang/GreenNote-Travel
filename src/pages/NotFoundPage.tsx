import { Link } from 'react-router-dom'
export function NotFoundPage() { return <main className="state-panel"><p className="eyebrow">404 · 走错岔路</p><h1>这里不在计划路线中</h1><p>回到旅行首页，继续沿着正确的路线出发。</p><Link className="primary-button" to="/">返回首页</Link></main> }
