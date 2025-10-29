# Next steps (detailed)

This repo contains a minimal scaffold. Next immediate tasks I will implement in order:

1. Implement middleware to protect `/admin/*` routes using server-side token verification.
2. Wire up admin verification endpoint using `src/lib/firebaseAdmin.ts`.
3. Implement admin dashboard skeleton at `/src/pages/admin/dashboard.tsx`.
4. Implement Firestore data models (TypeScript types) under `src/types` and sample seed scripts.

Run locally:

```powershell
pnpm install
pnpm dev
```

Environment variables: see `.env.example` and create `.env.local`.
