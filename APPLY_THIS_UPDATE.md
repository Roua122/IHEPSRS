# TASK-FND-005 — CI / Test Baseline

Owner: رؤى محمد

طبقي هذه الحزمة فقط بعد دمج FND-003 وFND-004 إلى `main`.

## 1) تحديث main وفتح Branch

```powershell
git checkout main
git pull origin main
git log --oneline -7
git checkout -b feature/TASK-FND-005-ci-test-baseline
```

يجب أن يظهر في التاريخ دمج FND-004 قبل إنشاء الفرع.

## 2) انسخي محتويات الحزمة

انسخي محتويات مجلد `IHEPSRS_FND_005_CI_Test_Baseline_v4_6`
فوق جذر مشروع IHEPSRS.

## 3) تحقق محلي

```powershell
pnpm install
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm config:check
pnpm test:smoke
```

الـSmoke Test يستخدم منافذ اختبار مستقلة:
- Central API: 3300
- Mock University: 3400

لذلك لا يتعارض عادةً مع `pnpm dev` على 3000/3100.

المتوقع:

```text
CI smoke baseline passed.
```

## 4) Git

```powershell
git status
git add .
git commit -m "TASK-FND-005: establish CI and smoke-test baseline"
git push -u origin feature/TASK-FND-005-ci-test-baseline
```

ثم افتحي Pull Request إلى `main`.
