# Coding Rules for AI / Team

1. لا تخترع Business Rule.
2. لا تضف Status غير معتمد.
3. لا تغير API/Schema Contract بصمت.
4. كل write حساس يجب أن يمر Authorization.
5. كل فعل يتطلب Audit يجب تسجيله.
6. افصل Business Identity عن Message Identity.
7. احترم Idempotency وStale Message rules.
8. لا تخزن Secrets في repository.
9. كل Task يحتاج Tests.
10. عند الغموض: أنشئ ISSUE/Decision ولا تخمن.
