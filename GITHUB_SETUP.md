# GitHub Setup Guide

## الخيار الموصى به: Repository واحد خاص بالفريق

### 1) إنشاء Repository
على GitHub:
- New repository
- الاسم المقترح: `IHEPSRS`
- اجعله Private إذا كان المشروع جامعيًا
- لا تضف README من GitHub إذا كنت سترفع هذه الحزمة كما هي

### 2) رفع المشروع أول مرة من جهاز أحد أعضاء الفريق
افتح Terminal داخل مجلد المشروع:

```bash
git init
git add .
git commit -m "Initial project documentation structure"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

### 3) إضافة الزملاء
من إعدادات Repository أضف أعضاء الفريق كـ Collaborators.

### 4) تنزيل المشروع لدى أي عضو
```bash
git clone <REPO_URL>
cd IHEPSRS
```

### 5) بداية كل مهمة
```bash
git checkout main
git pull
git checkout -b feature/TASK-ID-short-name
```

### 6) بعد الانتهاء
```bash
git add .
git commit -m "TASK-ID: implement ..."
git push -u origin feature/TASK-ID-short-name
```

ثم افتح Pull Request إلى `main`.

### 7) قبل بدء أي يوم عمل
```bash
git checkout main
git pull
```

## قاعدة الفريق
لا ترسلوا ZIP بين بعضكم بعد إنشاء GitHub.
GitHub يصبح النسخة المشتركة، وكل شخص يستخدم Clone/Pull/Push.

## Team workflow — 7 members

استخدموا Branch لكل Task وليس Branch دائم لكل عضو:

```bash
git checkout main
git pull
git checkout -b feature/TASK-ID-short-name
```

بعد الانتهاء:
```bash
git add .
git commit -m "TASK-ID: short description"
git push -u origin feature/TASK-ID-short-name
```

ثم Pull Request ومراجعة من عضو آخر.

### قبل `git init`
تأكد أن Terminal داخل **المجلد الذي يحتوي مباشرة على `README.md` و`docs/` و`ai/` و`phases/`**،
حتى لا يتم إنشاء Repository وفي داخله مجلد مشروع إضافي.

### Ownership
راجع:
`docs/24_team_work_allocation.md`

### مهم
لا يوجد Branch اسمه `member-1` أو `member-2` للعمل الدائم.
الفروع مرتبطة بالمهام حتى يسهل الدمج والمراجعة.
