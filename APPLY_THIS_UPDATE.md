# TASK-IAM-002 — Role catalogue

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

هذه الحزمة مبنية فوق `main` بعد دمج TASK-IAM-001 (PR #7).

## لماذا تغير التنفيذ عن التخمين الأولي؟

الفحص المباشر للـAnalysis Baseline Section 4.3 وجد كتالوج أدوار صريحًا يحتوي
`CGA, IRS, UA, PGA, PGO, RA, RO, DS, IO, SA, RC`.

كما توجد ثلاثة صفوف Actor/Role في نفس الجدول بلا `roleCode` صريح. الحزمة لا تخترع رموزًا لها.

## Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/TASK-IAM-002-role-catalogue
```

## التطبيق

انسخي محتويات الحزمة فوق جذر المشروع ثم:

```powershell
pnpm install
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
```

## التشغيل المرئي

Terminal 1:

```powershell
pnpm --filter @ihepsrs/api dev
```

Terminal 2:

```powershell
pnpm --filter @ihepsrs/web dev
```

ثم افتحي:

```text
http://localhost:5173/settings/roles
```

والـAPI المرجعي:

```text
GET http://localhost:3000/api/identity/role-catalogue
```

## حدود المهمة

لا تنفذ IAM-002 الآن:

- قرار authorization الفعلي حسب resource/action/institution/data scope — IAM-003.
- RoleDelegation lifecycle/enforcement — IAM-004.
- Login/JWT/session/MFA — IAM-005.
- RoleAssignment write endpoint أو إدارة أدوار فعلية قبل مسار authz/authn.

## Git

```powershell
git status
git add .
git commit -m "TASK-IAM-002: implement role catalogue foundation"
git push -u origin feature/TASK-IAM-002-role-catalogue
```
