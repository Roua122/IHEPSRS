# PostgraduateApplication — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| applicationId | UUID | Y | المعرف |  |
| studentId | FK | N | طالب مركزي بعد القبول/المزامنة |  |
| programId | FK | Y | البرنامج |  |
| status | Enum | Y | حالة الطلب | State model |
| submittedAt | DateTime | N | وقت التقديم |  |
| decision | Enum | N | القرار |  |
| decisionReason | Text | N | السبب | إلزامي للرفض |
| decisionAt | DateTime | N | وقت القرار |  |
| personId | FK | Y | المتقدم/الشخص | يسمح بمتقدم غير موجود في SIS |
| admissionCycleId | FK | Y | دورة/فترة القبول |  |
| firstSubmittedAt | Timestamp | N | أول تقديم | لا يتغير عند NeedMoreInfo |
| resubmittedAt | Timestamp | N | آخر إعادة تقديم | يتحدث عند الاستكمال |
