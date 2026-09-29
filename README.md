# IHEPSRS — Integrated Higher Education, Postgraduate Studies & Scientific Research System

هذا المستودع هو مرجع العمل والتنفيذ لفريق مشروع **IHEPSRS** في مقرر تكامل وعمارة الأنظمة.

## Implementation Mode — Academic Prototype

التنفيذ الحالي هو **Prototype / Proof of Concept** لمحاكاة النظام المتكامل، وليس تنفيذ النظام الوطني الكامل.

قبل بدء البرمجة اقرأ:
- `PROTOTYPE_README.md`
- `docs/21_prototype_scope.md`
- `docs/22_demo_scenario.md`

وثيقة التحليل الكاملة تظل **Source of Truth** للمتطلبات، بينما `21_prototype_scope.md`
يحدد ما سيتم برمجته فعليًا في المشروع الأكاديمي.

الفريق مكوّن من **7 أعضاء**، والتوزيع المقترح موجود في:
`docs/24_team_work_allocation.md`


## Source of Truth
المرجع الأعلى للمتطلبات وقواعد الأعمال هو:
`docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`

أي تغيير على:
- Requirement
- Business Rule
- State
- Source of Truth
- Security Requirement
- Integration Contract

لا يتم من الكود مباشرة، بل يمر عبر **Change Request / Decision Log**.

## كيف يبدأ أي عضو أو AI Agent؟
1. اقرأ `README.md`.
2. اقرأ `ai/memory.md`.
3. اقرأ `ai/m.map.md`.
4. اقرأ `architecture/architecture.md`.
5. افتح الـPhase الحالية من `phases/`.
6. اقرأ `TODO.md` الخاص بها.
7. اختر أول Task غير مكتملة.
8. اقرأ ملف الـTask ومراجعها.
9. نفذ واختبر.
10. حدّث TODO والـTask و`ai/memory.md` عند الحاجة.

## Git workflow المقترح
- الفرع الرئيسي: `main`
- لا يعمل أعضاء الفريق مباشرة على `main`.
- لكل مهمة:
  - `feature/TASK-ID-short-name`
  - أو `fix/TASK-ID-short-name`
- بعد الانتهاء:
  1. Commit
  2. Push
  3. Pull Request
  4. مراجعة من عضو آخر
  5. Merge إلى `main`

## أوامر البدء
```bash
git clone <REPO_URL>
cd IHEPSRS
git checkout -b feature/TASK-ID-name
```

بعد التعديل:
```bash
git add .
git commit -m "TASK-ID: short description"
git push -u origin feature/TASK-ID-name
```

## Definition of Done العامة
لا تعتبر المهمة مكتملة إلا إذا:
- المتطلبات المرجعية واضحة.
- Business Rules مطبقة.
- الصلاحيات مطبقة.
- Audit مطبق عند الحاجة.
- حالات الفشل معالجة.
- الاختبارات ناجحة.
- الوثائق المتأثرة محدثة.
