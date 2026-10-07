# IHEPSRS Academic Prototype / PoC

## لماذا هذا الملف؟
وثيقة التحليل تصف **النظام الكامل المقترح**، بينما هذا المستودع سيستخدم لتنفيذ
**نموذج أولي أكاديمي (Prototype / Proof of Concept)** يثبت الفكرة الأساسية للتكامل والعمارة.

## الهدف
إثبات سيناريو متكامل يعمل من البداية إلى النهاية:

`Mock University SIS`
→ `Integration Layer`
→ `Postgraduate Application`
→ `Enrollment`
→ `Thesis`
→ `Supervisor`
→ `Defense / Corrections`
→ `Publication`
→ `Dashboard`
→ `Audit`

## ليس الهدف
- تنفيذ منصة وطنية Production كاملة.
- تشغيل 1.5M طالب فعليًا.
- بناء Data Warehouse مؤسسي كامل.
- بناء Disaster Recovery حقيقي متعدد المواقع.
- تنفيذ أنظمة Finance / HR / LMS / Library كاملة.

## قبل تنفيذ أي Task
اقرأ بالترتيب:
1. `README.md`
2. `PROTOTYPE_README.md`
3. `ai/memory.md`
4. `docs/21_prototype_scope.md`
5. `docs/22_demo_scenario.md`
6. `ai/m.map.md`
7. ملف الـPhase
8. ملف الـTask

## تصنيفات التنفيذ
- `IMPLEMENT` = ينفذ ككود حقيقي داخل الـPrototype.
- `MOCK` = ينفذ كمحاكاة مبسطة.
- `DOCUMENTATION_ONLY` = يوثق ولا يبنى كخدمة Production.
- `FUTURE` = خارج التنفيذ الحالي.

## الأولويات
- `MUST` = ضروري لنجاح العرض النهائي.
- `SHOULD` = ينفذ إذا سمح الوقت.
- `N/A` = لا يوجد تنفيذ برمجي في النسخة الحالية.
