# Testing and Acceptance Developer Reference

Source: Analysis Baseline — Sections 16, 18 and 19.

## System Acceptance Criteria
| AC | المعيار |
| --- | --- |
| AC-01 | يمكن إنشاء مؤسسة وبرنامج صالحين واستخدامهما في بقية السيناريوهات. |
| AC-02 | يمكن استقبال StudentUpsert من نظام جامعة مستقل دون تكرار عند إعادة الإرسال. |
| AC-03 | يمكن تنفيذ دورة طلب دراسات عليا من Draft حتى قرار نهائي وقيد. |
| AC-04 | يمكن تنفيذ دورة رسالة من التسجيل حتى المناقشة والاعتماد مع تطبيق شروط الانتقال. |
| AC-05 | يمكن تنفيذ دورة Research Proposal حتى Project ثم تسجيل Publication. |
| AC-06 | الصلاحيات تمنع الوصول خارج نطاق المؤسسة/الدور في السيناريوهات المختبرة. |
| AC-07 | التغييرات الحساسة تظهر في Audit Log. |
| AC-08 | فشل تكامل مؤقت يظهر في monitoring ويمكن إعادة معالجته بنجاح دون duplication. |
| AC-09 | التقارير الأساسية تنتج وفق تعريف KPI ونطاق المستخدم. |
| AC-10 | NFRs الأساسية للأداء/النسخ/الأمن ممثلة في التصميم وخطة الاختبار حتى لو لم يطبق المشروع الأكاديمي بنية إنتاج كاملة. |

## NFR Acceptance Tests
| NFR | Acceptance Test / Pass Criterion |
| --- | --- |
| NFR-001 | Given baseline dataset + 2,000 concurrent profile, when 15-min workload runs, P95 listed UI ops ≤3s and error rate <1%. |
| NFR-002 | Internal CRUD load at 100 req/s for 15m: P95 server/API ≤1.5s excluding external wait. |
| NFR-003 | Load test dataset contains at least all category counts stated in section 17 without schema/index redesign during test. |
| NFR-004 | 2,000 concurrent sessions complete representative mix; scaling to 5,000 achieved by horizontal capacity without domain-rule change. |
| NFR-005 | Monthly core-service uptime ≥99.5%, excluding approved maintenance, measured from synthetic health checks. |
| NFR-006 | Simulated external SIS/Email outage does not break unrelated Registry/Postgraduate read/write operations. |
| NFR-007 | Onboard a second institution with config+adapter/mapping only; no core code branch by institution. |
| NFR-008 | All external endpoints reject clear-text/non-authorized access; authorization tests cover cross-scope denial. |
| NFR-009 | Sensitive roles cannot establish privileged session without second factor. |
| NFR-010 | Secret scan finds no credential in DB/config/repo/log; rotation test replaces integration credential without data loss. |
| NFR-011 | Operational role cannot update/delete Audit; tamper check detects modified audit chain/object. |
| NFR-012 | Restore point created within 1h loss window in drill; PITR recovers transaction set. |
| NFR-013 | Core restore drill from declared disaster to verified service ≤2h. |
| NFR-014 | Injected failure mid multi-step transaction leaves no partially approved domain state. |
| NFR-015 | Same sourceSystem+messageId replay 10 times causes one business effect; newer different messageId updates normally. |
| NFR-016 | Architecture test/static review finds no direct external-DB access from core domains. |
| NFR-017 | A traced request exposes correlation across gateway/domain/integration and metrics/logs without PII leakage. |
| NFR-018 | Usability walkthrough completes core flows with validation messages and no technical stack trace to user. |
| NFR-019 | Arabic RTL + keyboard + screen reader smoke test passes core workflows and automated accessibility scan has no critical AA violation. |
| NFR-020 | Core flows pass latest two supported major versions of selected modern browsers at desktop/mobile widths. |
| NFR-021 | Stored timestamps UTC; display conversion tested for Asia/Aden; ordering unchanged. |
| NFR-022 | EICAR/test malware upload quarantined; renamed executable/polyglot rejected; valid 200MB boundary file handled. |
| NFR-023 | RTM has row for every FR/NFR/BR and linked test; no Must without test owner. |
| NFR-024 | Contract test shows v1 client remains compatible through announced window; breaking v2 not routed to v1 client. |
| NFR-025 | Log scan and UI role tests show sensitive fields masked/not exposed outside need-to-know. |
| NFR-026 | DB backup/object sample proves encryption at rest enabled and key access separated. |
| NFR-027 | Rotation drill changes secret/key and old credential fails after grace/revoke window. |
| NFR-028 | Security test suite verifies CSRF/XSS/injection/SSRF protections on representative endpoints. |
| NFR-029 | File remains non-downloadable until scan=clean; infected file never becomes Available. |
| NFR-030 | Idle/max session/re-auth timeouts verified by automated session tests. |
| NFR-031 | Local fallback rejects weak/breached password, requires MFA, and locks after policy threshold. |
| NFR-032 | Integration from wrong institution/invalid client/replayed token rejected and audited. |
| NFR-033 | Simulated critical security event creates alert, incident record, containment action and timeline. |
| NFR-034 | CI produces SAST/SCA evidence; release gate blocks unresolved Critical; pen-test evidence attached before production. |
| NFR-035 | WCAG 2.2 AA manual+automated checks on login/application/thesis/search/dashboard core screens. |
| NFR-036 | Dashboard shows all required metrics; threshold simulation triggers expected alerts. |
| NFR-037 | Off-site encrypted restore drill quarterly evidence; recovery verification checklist signed. |
| NFR-038 | Arabic normalization tests return equivalent matches for configured hamza/diacritic/taa-marbuta variants while preserving stored text. |

## Error Catalogue
| Code | النوع | المثال | السلوك المتوقع | إعادة المحاولة |
| --- | --- | --- | --- | --- |
| VAL-001 | RequiredFieldMissing | الطلب/الرسالة غير مكتمل | رفض العملية وإظهار الحقول الناقصة للمستخدم | لا إعادة آلية |
| VAL-002 | InvalidReference | مرجع مؤسسة/برنامج/دور غير صالح | رفض أو Quarantine في التكامل | معالجة مرجع ثم retry |
| SEC-001 | Unauthorized | المستخدم غير مصادق | 401/إعادة تسجيل الدخول | لا retry تلقائي للعمليات الحساسة |
| SEC-002 | Forbidden | الدور لا يسمح بالعملية | 403 وتدقيق عند الحاجة | لا |
| INT-ERR-001 | ExternalTimeout | النظام الخارجي لم يستجب | الحفاظ على العملية المحلية حسب نوع التكامل | retry آلي |
| INT-ERR-002 | DuplicateMessage | إعادة إرسال نفس الرسالة | إرجاع نتيجة idempotent | لا إنشاء نسخة |
| INT-ERR-003 | ContractViolation | Payload لا يطابق العقد | رفض + error details آمنة | إصلاح المصدر |
| INT-ERR-004 | ReferenceNotMapped | كود خارجي غير معروف | Quarantine | تعيين Mapping ثم إعادة المعالجة |
| BUS-001 | InvalidStateTransition | الانتقال غير مسموح | رفض وإظهار الحالة الحالية والمتطلبات | تصحيح مسار العمل |
| DOC-001 | UnsupportedFile | نوع/حجم ملف غير مسموح | رفض الرفع | رفع ملف صحيح |
| INT-ERR-005 | StaleMessage | event/version أقدم من المعالج | StaleIgnored دون overwrite؛ audit/metric | لا |
| INT-ERR-006 | CrossInstitutionScope | payload يحاول الكتابة لمؤسسة خارج المصدر | رفض + SecurityEvent | لا |

## Traceability Rule
كل Component/API/Database Migration/Sequence Diagram يجب أن يحمل Requirement IDs التي يحققها، وكل Test يحمل IDs المقابلة. المتطلب الذي لا يظهر في التصميم أو الاختبار يعتبر فجوة.

## Test naming
Use IDs from the Atomic RTM:
- `TC-FR-xxx`
- `TC-BR-xxx`
- `TC-NFR-xxx`

Prototype task-specific tests may extend these IDs but must retain the source ID in metadata/name.
