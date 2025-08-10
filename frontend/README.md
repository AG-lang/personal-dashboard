本应用基于 Next.js 14（App Router）与 TypeScript，包管理器统一使用 pnpm。

## 本地开发

```bash
pnpm install
pnpm dev
```

默认运行在 `http://localhost:3000`。

后端 API 本地默认地址 `http://localhost:8000`，已在 `next.config.js` 中配置开发代理，
也可在本目录 `frontend/.env.local` 中设置：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 生产部署（Vercel）

- 生产环境前端默认请求相对路径 `/api`，由 Vercel 将请求转发到后端 Serverless Functions（见根目录 `vercel.json`）
- 无需设置 `NEXT_PUBLIC_API_URL`

## 代码风格与检查

```bash
pnpm type-check
pnpm lint
```
