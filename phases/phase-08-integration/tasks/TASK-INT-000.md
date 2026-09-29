# TASK-INT-000 — Mock University SIS

Status: TODO
Implementation: MOCK
Prototype Priority: MUST
Owner: Member 3

## References
- FR: Integration/student synchronization requirements in Analysis Baseline
- BR: Source of Truth / scope / idempotency rules
- UC: Student synchronization / integration monitoring scenarios
- NFR: Security, audit, interoperability
- ADR: TBD

## Goal
إنشاء تطبيق/خدمة مستقلة مبسطة تمثل University SIS وتستطيع إرسال بيانات طالب إلى IHEPSRS.

## Prototype relevance
هذه المهمة تثبت أن المشروع System Integration وليس مجرد تطبيق مركزي واحد.

## Required behavior
- عرض طالب/طلاب تجريبيين.
- زر أو عملية `Send Student`.
- إرسال Integration envelope موحد.
- دعم messageId وsourceSystem وschemaVersion وcorrelationId.
- إظهار نتيجة الإرسال للمستخدم.

## Out of Scope
- بناء SIS جامعي كامل.
- الدرجات والمقررات والمالية.
- Production SSO.

## Tests
- Successful student send.
- Invalid payload example.
- Duplicate send example.

## Definition of Done
- [ ] Mock service runs independently.
- [ ] Can call central integration endpoint.
- [ ] Integration message visible in central monitor.
- [ ] No secrets committed to Git.
