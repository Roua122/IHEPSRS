# Apply Foundation Bootstrap v4

هذه الحزمة هي **Update Pack** للمشروع الحالي، وليست Repository جديدًا.

## ما الذي تضيفه؟
- ADR-001: Technology Stack
- ADR-002: Architecture Style
- ADR-003: Monorepo Structure
- `apps/web`
- `apps/api`
- `apps/mock-university`
- `packages/contracts`
- pnpm workspace
- PostgreSQL local development via Docker Compose
- CI baseline
- Local development guide

## طريقة التطبيق
1. فك الضغط.
2. انسخ **محتويات** `IHEPSRS_Foundation_Bootstrap_v4` فوق جذر مشروع IHEPSRS الحالي.
3. وافق على Replace فقط إذا ظهر ملف بنفس الاسم.
4. لا تحذف `.git`.

بعدها:

```powershell
git status
git add .
git commit -m "TASK-FND-001: add foundation architecture and workspace scaffold"
git push
```

الأفضل تنفيذ هذا على Branch خاص بـTASK-FND-001.
