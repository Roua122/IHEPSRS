# TASK-FND-004 — Logging + Correlation ID

Owner: رؤى محمد

هذه الحزمة تفترض أن FND-001 وFND-002 وFND-003 قد تم دمجها إلى `main`.

## قبل البدء

تأكدي أولًا أن Pull Request الخاصة بـFND-003 أصبحت خضراء وتم دمجها.

```powershell
git checkout main
git pull origin main
git checkout -b feature/TASK-FND-004-logging-correlation
```

ثم انسخي محتويات هذه الحزمة فوق جذر المشروع.

## التحقق

```powershell
pnpm install
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api dev
```

اتركي الـAPI يعمل، ثم افتحي PowerShell ثانية:

```powershell
pnpm --filter @ihepsrs/api observability:check
```

المتوقع:

```text
Logging/correlation check passed.
```

## Git

```powershell
git add .
git commit -m "TASK-FND-004: implement structured logging and correlation IDs"
git push -u origin feature/TASK-FND-004-logging-correlation
```
