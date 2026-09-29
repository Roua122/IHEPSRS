# Task Execution Protocol

START
→ Read prototype context
→ Read current Phase
→ Select incomplete Task
→ Check Implementation classification
→ Check Prototype Priority
→ Validate references
→ Plan changes
→ Implement / Mock / Document according to classification
→ Run tests
→ Review security/audit impact
→ Update documentation
→ Update Task status
→ Update Phase TODO
→ Create PR

## Classification behavior

### IMPLEMENT
اكتب كودًا قابلًا للتشغيل والاختبار.

### MOCK
نفذ محاكاة كافية لإثبات السيناريو، ولا تبنِ تكامل Production غير مطلوب.

### DOCUMENTATION_ONLY
لا تكتب بنية تحتية Enterprise. حدث Architecture/ADR/Test plan عند الحاجة.

### FUTURE
لا تنفذ في الـPrototype الحالي.

## STOP condition
إذا احتاج التنفيذ إلى:
- Business Rule جديدة
- State جديد
- Source of Truth جديد
- Permission جديدة
- تغيير Integration Contract
فتوقف وأنشئ Issue/ADR/Change Request بدل التخمين.
