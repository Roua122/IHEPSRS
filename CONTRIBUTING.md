# مساهمة أعضاء الفريق

## قبل بدء أي مهمة
- اسحب آخر نسخة من `main`.
- تأكد من وجود Task ID.
- اقرأ المراجع المذكورة في ملف المهمة.

## الفروع
استخدم:
`feature/TASK-ID-description`

مثال:
`feature/TASK-TH-003-supervisor-assignment`

## Commit message
مثال:
`TASK-TH-003: implement supervisor assignment validation`

## Pull Request
يجب أن يتضمن:
- Task ID
- ما تم تنفيذه
- الاختبارات
- الملفات المتأثرة
- أي Design Decision جديد
- Screenshots عند وجود UI

## ممنوع
- تغيير Business Rule من داخل الكود فقط.
- إضافة Status جديد بدون تحديث الـBaseline/Decision Log.
- تخزين Secrets في Git.
- Merge إلى main بدون مراجعة.
