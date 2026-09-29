# Task Execution Protocol

START
→ Read context
→ Select incomplete Task
→ Validate references
→ Plan changes
→ Implement
→ Run tests
→ Review security/audit impact
→ Update documentation
→ Update Task status
→ Update Phase TODO
→ Create PR

## STOP condition
إذا احتاج التنفيذ إلى:
- Rule جديدة
- State جديد
- Source of Truth جديد
- Permission جديدة
- تغيير Contract
فلا تكمل قبل Decision/Change.
