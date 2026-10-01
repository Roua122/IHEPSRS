# TASK-FND-003 — Common Error Model

Owner: رؤى محمد

هذه الحزمة تكمل FND-001 وFND-002 ولا تستبدل المشروع.

## قبل التطبيق
يجب أن تكون تغييرات FND-002 مدمجة إلى `main`.

## Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/TASK-FND-003-common-error-model
```

ثم انسخي محتويات هذه الحزمة فوق جذر المشروع.

## التحقق

```powershell
pnpm install
pnpm typecheck
pnpm build
pnpm dev
```

اتركي `pnpm dev` يعمل، وافتحي PowerShell ثانية:

```powershell
pnpm --filter @ihepsrs/api error-model:check
```

أو افتحي:

```text
http://localhost:3000/api/does-not-exist
```

المتوقع HTTP 404 مع Error Envelope موحد.

## Git

```powershell
git add .
git commit -m "TASK-FND-003: implement common API error model"
git push -u origin feature/TASK-FND-003-common-error-model
```
