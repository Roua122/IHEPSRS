# End-to-End Demo Scenario

## Demo Goal
إظهار أن IHEPSRS هو مشروع تكامل وعمارة أنظمة، وليس CRUD منفصل.

## Actors
- University SIS Operator
- Student
- Postgraduate Officer
- Supervisor
- Committee/Authorized User
- System/Admin Viewer

## Scenario

### Step 1 — Mock University
يتم فتح Mock University SIS وعرض طالب تجريبي.

Action:
`Send Student to IHEPSRS`

Expected:
- Integration message created.
- Message identity/correlation recorded.
- Central platform validates source and payload.

### Step 2 — Integration Monitor
Expected status:
`Succeeded`

ويفضل وجود بيانات عرض إضافية لحالات:
- `DuplicateIgnored`
- `FailedValidation`
- `Quarantined`
- `StaleIgnored` إن كان التنفيذ يدعمها ضمن الوقت.

### Step 3 — Student / Applicant
يظهر الشخص/الطالب في النظام المركزي.

### Step 4 — Postgraduate Application
الطالب ينشئ طلبًا:
`Draft → Submitted`

### Step 5 — Review
Postgraduate Officer:
- يراجع الطلب.
- يمكن إرجاعه `NeedMoreInfo`.
- يعاد تقديمه.
- يصدر القرار النهائي.

Expected:
`Accepted`

### Step 6 — Enrollment
ينشأ Enrollment صالح بعد القرار وفق قواعد الـBaseline.

### Step 7 — Thesis
إنشاء Thesis وربطها بالقيد.

### Step 8 — Supervisor
تعيين Main Supervisor مع التحقق من القيود الأساسية.

### Step 9 — Proposal
`ProposalSubmitted → ProposalUnderReview → ProposalApproved`

### Step 10 — Thesis Submission / Defense
تقديم الرسالة وجدولة المناقشة.

### Step 11 — Outcome
استخدم في العرض أحد المسارين:
- Pass → Approval
أو
- PassWithCorrections → CorrectionsRequired → Verified → Approval

### Step 12 — Publication
إنشاء Publication وربط المؤلف/الباحث.

### Step 13 — Dashboard
إظهار أرقام بسيطة:
- Applications
- Accepted enrollments
- Active/Approved theses
- Publications
- Integration messages

### Step 14 — Audit
عرض أثر تدقيق لعدة عمليات من السيناريو.

## Demo Acceptance
يعتبر السيناريو ناجحًا عندما يتم تنفيذه من بدايته إلى نهايته بدون تعديل يدوي لقاعدة البيانات.
