# أجنحة الطيران — Fly Wings Academy (Source v4)

موقع أكاديمية أجنحة الطيران (عربي/إنجليزي) + لوحة تحكم كاملة.
Fly Wings Academy website (Arabic/English) with a full admin dashboard.

## التقنيات / Stack
React 18 + Vite 5 + TypeScript + Tailwind CSS + Framer Motion + Firebase (Firestore / Storage / Auth).

## التشغيل محلياً / Local setup
```bash
npm install
cp .env.example .env
npm run dev
```
الموقع يعمل على http://localhost:8080

## البناء والنشر / Build & deploy
```bash
npm run build
```
- الناتج في مجلد `dist` — ارفع محتوياته إلى `public_html` على cPanel أو أي استضافة.
- ملف `public/.htaccess` مضمّن لتشغيل مسارات الـ SPA وضبط الكاش.
- سكربت السيو `scripts/seo-build.mjs` يعمل بعد البناء وينشئ صفحات HTML جاهزة للبوتات + `sitemap.xml`.

## لوحة التحكم / Admin
- الرابط: `/admin` (تسجيل الدخول من `/auth`)
- البريد: `admin@dashboard.com`
- تشمل: الصفحات، الباقات، البرامج، المدونة، الأخبار، الأنشطة، المعرض، الخريجين، الشركاء، الأسئلة، الرسائل، الطلبات، السيو، عرض البوتات، محسّن الصور، الإحصائيات.

## قاعدة البيانات / Database
مجلد `database/`:
- `json/` — تصدير كل مجموعات Firestore + `import-firestore.js` لإعادة الرفع على مشروع Firebase جديد.
- `database.sql` — نسخة MySQL/MariaDB (CREATE TABLE + INSERT) للرفع على cPanel.
- `EXPORT-REPORT.txt` — تقرير التصدير.

## التوثيق / Docs
`docs/DOCUMENTATION.md` — دليل كامل بالعربي والإنجليزي (الإعداد، Firebase، الأمان، البنية، السيو، النشر).

## مفاتيح Firebase
موجودة في `src/lib/firebase.ts` — استبدلها بمفاتيح مشروعك عند الحاجة.
