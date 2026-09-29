# State Models Developer Reference

حالات الكيانات وانتقالاتها يجب أن تطابق الـAnalysis Baseline.

## Rule
- لا تضف Enum value جديدة من الكود مباشرة.
- لا تسمح بانتقال غير موثق.
- الانتقالات الحساسة تسجل في Audit.
- اختبارات State Transition إلزامية.
