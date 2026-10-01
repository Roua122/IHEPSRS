# Foundation Fix v4.1

هذه الحزمة تصلح الأخطاء التي ظهرت بعد أول تشغيل فعلي لـFoundation Bootstrap v4.

## الأخطاء التي تعالجها
- TypeScript 6: `moduleResolution=node10` deprecated.
- TypeScript 6: `baseUrl` deprecated.
- Nest build: missing `rootDir`.
- `@ihepsrs/contracts` workspace resolution.
- Node globals such as `process`.
- Web `allowImportingTsExtensions` / build config.
- Root `pnpm dev` filter not matching applications.
- pnpm 12 blocked dependency build script for `@scarf/scarf`.
- Align local runtime baseline with Node 22.18+.

## التطبيق
انسخ محتويات هذه الحزمة فوق جذر المشروع الحالي، ثم نفذ:

```powershell
pnpm install
pnpm typecheck
pnpm build
```

بعد نجاحها شغّل Docker Desktop ثم:

```powershell
docker info
pnpm db:up
pnpm dev
```

## Git
بعد النجاح:

```powershell
git add .
git commit -m "TASK-FND-001: fix workspace build and TypeScript configuration"
git push
```
