# TASK-IAM-001 — User/account model

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

هذه الحزمة مبنية فوق `main` بعد دمج FND-005.

## حدود المهمة

تنفذ هذه الحزمة **نموذج Person/UserAccount ودورة حياة الحساب الأساسية** فقط.

لا تنفذ هنا:
- Role catalogue الكامل — `TASK-IAM-002`
- Scope-aware authorization — `TASK-IAM-003`
- RoleDelegation — `TASK-IAM-004`
- Login/JWT/Logout/MFA/Session security — `TASK-IAM-005`

لهذا السبب لا تنشر IAM-001 أي HTTP write endpoint حساس قبل وجود Authorization/Authentication.
الواجهة المضافة هي **Model Preview** فقط ولا تعرض بيانات مستخدمين حقيقية.

## Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/TASK-IAM-001-user-account-model
```

إذا كنتِ أنشأتِ مسبقًا `feature/TASK-IAM-001` فاستخدميه بدل إنشاء فرع جديد.

## التطبيق

انسخي محتويات هذه الحزمة فوق جذر المشروع ثم:

```powershell
pnpm install
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api iam001:check
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
http://localhost:5173/settings/users
```

المفروض تظهر شاشة "نموذج حساب المستخدم" وتقرأ الـcanonical model من:

```text
GET http://localhost:3000/api/identity/account-model
```

## Git

```powershell
git status
git add .
git commit -m "TASK-IAM-001: implement user account domain model"
git push -u origin feature/TASK-IAM-001-user-account-model
```

أو استخدمي اسم الفرع الحالي إن كان `feature/TASK-IAM-001`.
