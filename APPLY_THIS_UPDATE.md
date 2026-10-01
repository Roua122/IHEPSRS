# TASK-FND-002 — Environment / Config Strategy

Owner: رؤى محمد  
Prototype Priority: MUST

هذه الحزمة تكمل الـFoundation الحالي ولا تستبدل المشروع.

## قبل التطبيق
يجب أن يكون `TASK-FND-001` شغالًا محليًا على الأقل:
- API health يعمل.
- Mock University يعمل.
- `pnpm typecheck` و `pnpm build` ينجحان بعد Patch v4.1.

## التطبيق
انسخي **محتويات** هذه الحزمة فوق جذر المشروع الحالي.

ثم:

```powershell
pnpm install
pnpm config:check
pnpm typecheck
pnpm build
pnpm dev
```

بعد التشغيل افتحي:

```text
http://localhost:3000/api/config/status
```

لا يجب أن يعرض endpoint أي Secret أو DATABASE_URL.

## Git
اعملي Branch مستقل للمهمة:

```powershell
git checkout main
git pull origin main
git checkout -b feature/TASK-FND-002-config-strategy
```

بعد نجاح التحقق:

```powershell
git add .
git commit -m "TASK-FND-002: implement environment and policy configuration strategy"
git push -u origin feature/TASK-FND-002-config-strategy
```
