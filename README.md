# SAB Store Admin (scaffold)

Minimal scaffold for the Next.js + TypeScript admin panel for SAB Store.

What's included:
- Next.js + TypeScript
- TailwindCSS (basic config)
- Firebase client/server helper files placeholders

Quick start

1. Install dependencies

```powershell
pnpm install # or npm install / yarn
```

2. Create a `.env.local` based on `.env.example` and fill Firebase credentials.

3. Run dev server

```powershell
pnpm dev
```

Next steps: implement Middleware auth, pages under `/src/pages/admin`, Firebase Functions and Security Rules. I'll continue by implementing the login page and Firebase integration next.
