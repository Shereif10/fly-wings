# Fly Wings Academy — Full Documentation / التوثيق الكامل

النسخة: 1.0 — تاريخ التسليم: 2026-09-05

---

# القسم العربي

## 1. نظرة عامة
موقع أكاديمية أجنحة الطيران (Fly Wings) موقع ثنائي اللغة (عربي افتراضي / إنجليزي) مبني كتطبيق React أحادي الصفحة، مع لوحة تحكم كاملة تدير كل محتوى الموقع من غير أي تعديل في الكود، وقاعدة بيانات Firebase Firestore، وتخزين الصور والفيديو على Firebase Storage.

التقنيات:
- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 + shadcn/ui + Framer Motion (الحركات)
- Firebase: Firestore (البيانات) — Storage (الملفات) — Authentication (دخول الأدمن) — Analytics
- react-router-dom (المسارات) و react-helmet-async (الميتا)
- سكربت Prerender للسيو: `scripts/seo-build.mjs`

## 2. المتطلبات
- Node.js إصدار 18 أو أحدث + npm
- حساب Firebase (المشروع الحالي: `flywings-ffe9a`)
- استضافة تدعم الملفات الثابتة (cPanel / Apache أو أي استضافة ثابتة)

## 3. التشغيل محلياً
```sh
npm install
npm run dev
```
الموقع يفتح على `http://localhost:8080`.

## 4. البناء والنشر
```sh
npm run build
```
الأمر ده بيعمل حاجتين بالترتيب:
1. `vite build` → يبني الملفات في مجلد `dist`.
2. `node scripts/seo-build.mjs` → يقرأ المحتوى من Firestore وينشئ **ملف HTML جاهز لكل صفحة** (أكثر من 230 صفحة) بداخل `dist`، ويحدّث `sitemap.xml`.

### الرفع على cPanel
1. افتح File Manager → `public_html`.
2. احذف الملفات القديمة (أو انقلها لمجلد نسخة احتياطية).
3. ارفع **محتويات** مجلد `dist` (مش المجلد نفسه) إلى `public_html`.
4. تأكد أن ملف `.htaccess` موجود داخل `public_html` (بيتنسخ تلقائياً مع البناء من `public/.htaccess`).
5. امسح الكاش (Cloudflare أو كاش الاستضافة إن وجد).

> مهم: لازم يتم رفع كل المجلدات الفرعية اللي ولّدها سكربت السيو (مثل `blog/<slug>/index.html`)، لأنها هي اللي بتخلي جوجل وبوتات الذكاء الاصطناعي تقرأ المحتوى بدون تشغيل جافاسكربت.

## 5. إعداد مشروع Firebase من الصفر
لو العميل عايز مشروع Firebase خاص به:
1. أنشئ مشروع جديد على `console.firebase.google.com`.
2. فعّل: **Firestore Database** (وضع Production) و **Storage** و **Authentication** (طريقة Email/Password).
3. من إعدادات المشروع → Your apps → Web app، انسخ بيانات الإعداد.
4. استبدل القيم في `src/lib/firebase.ts`.
5. أنشئ مستخدم الأدمن يدوياً من Authentication → Users → Add user.
6. استورد البيانات (القسم 8).

### قواعد أمان Firestore المقترحة
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // القراءة العامة للمحتوى المنشور
    match /{col}/{doc} {
      allow read: if col in [
        'activities','blog_posts','board_members','faqs','gallery','graduates',
        'journey_milestones','legal_pages','news','packages','partners',
        'services','settings','site_settings','training_programs','training_team'
      ];
      allow write: if request.auth != null;
    }
    // نماذج الزوار: إضافة فقط، والقراءة للأدمن
    match /applications/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /contact_messages/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /page_views/{doc} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

### قواعد أمان Storage المقترحة
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 6. بنية المشروع
```
public/            الصور الثابتة، robots.txt، sitemap.xml، favicon، .htaccess
scripts/
  seo-build.mjs    سكربت الـ prerender وتوليد خريطة الموقع
src/
  pages/           صفحات الموقع + صفحة /admin
  components/
    layout/        الهيدر، الفوتر، الأزرار العائمة
    home/          أقسام الصفحة الرئيسية
    admin/         كل مديري لوحة التحكم
    seo/PageSeo.tsx  حقن الميتا لكل صفحة
    ui/            مكونات shadcn
  contexts/        اللغة (LanguageContext) والمصادقة (AuthContext)
  hooks/           useHeroImage، usePageTracking، وغيرها
  lib/firebase.ts  إعداد Firebase
database/          تصدير البيانات (JSON + database.sql)
docs/              هذا الملف
```

## 7. لوحة التحكم
- الدخول: `/auth` بحساب الأدمن (البريد وكلمة السر من Firebase Authentication).
- الرابط: `/admin`
- لا يوجد تسجيل عام — الأدمن فقط.

| القسم | المسار | يدير |
|---|---|---|
| نظرة عامة | `/admin` | ملخص الأرقام وآخر النشاطات |
| طلبات التسجيل | `/admin/applications` | طلبات التدريب الواردة من الموقع |
| الرسائل | `/admin/messages` | رسائل تواصل معنا + الرد عبر واتساب |
| الباقات التدريبية | `/admin/packages` | الباقات والأسعار والمميزات |
| مراحل التدريب | `/admin/training-programs` | مراحل الرحلة التعليمية |
| الصفحات | `/admin/pages` | إظهار/إخفاء الأقسام + فيديو أو صورة خلفية الرئيسية |
| صفحة من نحن | `/admin/about-page` | محتوى وأقسام صفحة من نحن والإحصائيات |
| انطلاقة الأكاديمية | `/admin/journey` | محطات رحلة الأكاديمية |
| فريق التدريب | `/admin/training-team` | أعضاء فريق التدريب |
| الأخبار | `/admin/news` | الأخبار مع الصور والسيو والرابط (slug) |
| نجوم الطيران | `/admin/graduates` | الخريجون وقصصهم |
| الأنشطة | `/admin/activities` | الأنشطة والفعاليات وتواريخها |
| شركاء النجاح | `/admin/partners` | شعارات وروابط الشركاء |
| المدونة | `/admin/blog` | المقالات بمحرر نصوص كامل (عناوين H2–H4، صور داخل المقال، ألوان، تعديل كود HTML) |
| المعرض | `/admin/gallery` | ألبوم الصور |
| الأسئلة | `/admin/faq` | الأسئلة الشائعة |
| الصفحات القانونية | `/admin/legal` | الخصوصية والشروط |
| تحسين السيو | `/admin/seo` | ميتا تايتل وميتا ديسكربشن وslug لكل صفحة |
| عرض البوتات | `/admin/crawler` | مقارنة ما تراه بوتات جوجل والذكاء الاصطناعي (HTML الجاهز) بما يراه المستخدم بعد الجافاسكربت |
| الإعدادات | `/admin/settings` | بيانات التواصل، السوشيال ميديا، الشعارات |
| التحليلات | `/admin/analytics` | الزيارات والزوار ومصادر الترافيك |

### رفع الصور والفيديو
كل الرفع يتم مباشرة على Firebase Storage من داخل اللوحة (بدون روابط خارجية)، ويُخزَّن رابط التحميل في Firestore.

## 8. استيراد البيانات
### أ) إلى Firebase (الطريقة الموصى بها)
```sh
cd database
npm install firebase-admin
# حمّل ملف Service Account JSON من: إعدادات المشروع > Service accounts > Generate new private key
node import-firestore.js ./serviceAccount.json
```
السكربت يقرأ كل ملفات `database/json/*.json` ويرفعها بنفس المعرفات (IDs).

### ب) إلى MySQL / MariaDB على cPanel
1. cPanel → MySQL Databases → أنشئ قاعدة بيانات ومستخدم.
2. phpMyAdmin → اختر القاعدة → Import → ارفع `database/database.sql`.

> ملف SQL للأرشفة أو للانتقال مستقبلاً لنظام PHP/MySQL. الموقع الحالي يعمل على Firestore.

## 9. نظام السيو
- **ميتا لكل صفحة**: من `/admin/seo` ومن حقول السيو داخل المقال/الخبر (Title, Description, Slug).
- **Prerender**: ملفات HTML جاهزة لكل صفحة تحتوي العنوان والوصف والمحتوى النصي والروابط الداخلية — عشان البوتات تقرأ من غير جافاسكربت.
- **canonical + hreflang**: كل صفحة لها رابط أساسي ونسخة عربية (`/...`) وإنجليزية (`/en/...`).
- **البيانات المنظمة (JSON-LD)**: Organization، Article، NewsArticle، Course، Event، Person، FAQPage، CollectionPage، BreadcrumbList.
- **خريطة الموقع**: `public/sitemap.xml` تُحدَّث تلقائياً مع كل بناء. تُرسل من Google Search Console بعد توثيق الدومين.
- **robots.txt**: يسمح لبوتات جوجل وبوتات الذكاء الاصطناعي (GPTBot, ClaudeBot, PerplexityBot…).
- **Google Tag Manager**: حاوية واحدة `GTM-NFGMCB92` في `index.html` مع حماية من التحميل المزدوج.

## 10. الدومين و DNS
- سجل A للدومين الأساسي وللـ `www` يشير إلى IP الاستضافة.
- بعد أي تغيير في DNS انتظر حتى ٢٤ ساعة، وفعّل شهادة SSL من cPanel (AutoSSL).

## 11. ملاحظات
- كلمة سر الاستضافة (cPanel) غير موجودة داخل المشروع، وتُطلب من مزود الاستضافة.
- حسابات لوحة التحكم تُدار من Firebase Authentication وليست داخل قاعدة البيانات.

---

# English Section

## 1. Overview
Fly Wings Academy is a bilingual (Arabic default / English) single-page React application with a full admin dashboard. All content is managed from the dashboard — no code edits needed. Data lives in Firebase Firestore; media in Firebase Storage.

Stack: React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui, Framer Motion, Firebase, build-time SEO prerendering.

## 2. Requirements
Node.js 18+, npm, a Firebase project, and static hosting (cPanel/Apache or any static host).

## 3. Run locally
```sh
npm install
npm run dev      # http://localhost:8080
```

## 4. Build & deploy
```sh
npm run build
```
Runs `vite build`, then `scripts/seo-build.mjs`, which pulls content from Firestore and writes a real static `index.html` for every route (230+ pages) inside `dist/`, and regenerates `sitemap.xml`.

Deploy: upload the **contents** of `dist/` to `public_html`. Keep the generated subfolders — they are what crawlers read. `.htaccess` (from `public/.htaccess`) handles SPA routing, HTTPS redirect, gzip and caching.

## 5. Firebase setup
Create a project, enable Firestore, Storage and Authentication (Email/Password), copy the web config into `src/lib/firebase.ts`, create the admin user manually, then import the data (section 8). Suggested Firestore and Storage security rules are listed in the Arabic section above (the rule syntax is language-neutral).

## 6. Project structure
See the tree in the Arabic section — folder names are identical.

## 7. Admin dashboard
Sign in at `/auth`, dashboard at `/admin`. There is no public sign-up; a single admin account is used. The section table above lists every route and what it manages, including:
- **SEO** (`/admin/seo`): per-page meta title, meta description and slug.
- **Crawler View** (`/admin/crawler`): fetches the raw prerendered HTML of any URL and compares title, description, canonical, hreflang, structured data, internal link count and text length against the JavaScript-rendered page.

## 8. Importing data
**Firebase:** `cd database && npm install firebase-admin && node import-firestore.js ./serviceAccount.json` — uploads every `database/json/*.json` collection preserving document IDs.

**MySQL/cPanel:** create a database in cPanel, then import `database/database.sql` via phpMyAdmin.

## 9. SEO system
Per-page meta from the dashboard, static prerendered HTML per route, self-referencing canonicals, `hreflang` for Arabic/English, per-type JSON-LD, auto-generated sitemap, AI-crawler-friendly `robots.txt`, and one GTM container (`GTM-NFGMCB92`) guarded against double injection.

## 10. Domain & DNS
Point the apex and `www` A records to the hosting IP, then issue SSL from cPanel AutoSSL. Allow up to 24 hours for propagation.

## 11. Notes
The hosting (cPanel) password is not stored anywhere in this project — request it from the hosting provider. Dashboard accounts are managed in Firebase Authentication, not in the database.
