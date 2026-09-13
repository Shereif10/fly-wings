/**
 * Build-time SEO step (runs after `vite build`):
 *  1. Generates dist/sitemap.xml (also copied to public/sitemap.xml)
 *  2. Prerenders one static HTML file per route with correct
 *     title / description / canonical / hreflang / Open Graph / JSON-LD
 *     and a text fallback of the content inside #root, so social and AI
 *     crawlers see real markup without executing JavaScript.
 *
 * Content comes from Firestore's public REST API using the same web API key
 * already shipped in the client bundle — no secrets required.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SITE = 'https://bflywings.com';
const PROJECT_ID = 'flywings-ffe9a';
const API_KEY = 'AIzaSyCGPZIWhqObiWfu6fPUTs6LOMRyd63Xh8Q';
const DIST = resolve('dist');
/** Hard cap on generated files (routes x 2 languages) to stay well below publish limits. */
const MAX_PRERENDER_PAGES = Number(process.env.MAX_PRERENDER_PAGES || 2000);

/* ---------------- Firestore REST helpers ---------------- */

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const unwrap = (value) => {
  if (value == null) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(unwrap);
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields || {});
  return undefined;
};

const unwrapFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, unwrap(v)]));

async function fetchCollection(name) {
  const out = [];
  let pageToken = '';
  try {
    do {
      const url = `${FS_BASE}/${name}?pageSize=300&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[seo-build] ${name}: HTTP ${res.status} — skipping collection`);
        return out;
      }
      const json = await res.json();
      for (const doc of json.documents || []) {
        out.push({ id: doc.name.split('/').pop(), ...unwrapFields(doc.fields || {}) });
      }
      pageToken = json.nextPageToken || '';
    } while (pageToken);
  } catch (err) {
    console.warn(`[seo-build] ${name}: ${err.message} — skipping collection`);
  }
  return out;
}

/* ---------------- Text helpers ---------------- */

const stripHtml = (html, max = 300) => {
  const text = String(html || '')
    // Drop non-content blocks entirely so CSS/JS never leaks into the text
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/** YYYY-MM-DD from a Firestore timestamp / ISO string / Date */
const isoDate = (value) => {
  if (!value) return '';
  try {
    const raw =
      typeof value === 'object' && value !== null
        ? value.seconds
          ? new Date(value.seconds * 1000)
          : value.toDate
            ? value.toDate()
            : new Date(value)
        : new Date(value);
    if (Number.isNaN(raw.getTime())) return '';
    return raw.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};


const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const localePath = (path, lang) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') return clean === '/' ? '/en' : `/en${clean}`;
  return clean;
};
const localeUrl = (path, lang) => {
  const p = localePath(path, lang);
  return `${SITE}${p === '/' ? '' : p}`;
};

/* ---------------- Route collection ---------------- */

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily', titleAr: 'أجنحة الطيران - للتدريب على الطيران', titleEn: 'Fly Wings - Aviation Training', descAr: 'شركة سعودية رائدة في مجال التدريب على الطيران. برامج تدريبية متكاملة من اللغة الإنجليزية حتى رخصة الطيران PPL و CPL و IR.', descEn: 'A leading Saudi aviation training company. Integrated programs from English language up to PPL, CPL and IR licenses.' },
  { path: '/about', priority: '0.8', changefreq: 'weekly', titleAr: 'من نحن | أجنحة الطيران', titleEn: 'About Us | Fly Wings', descAr: 'تعرّف على أجنحة الطيران، رؤيتنا ورسالتنا في تدريب الطيران بالمملكة العربية السعودية.', descEn: 'Learn about Fly Wings, our vision and mission in aviation training in Saudi Arabia.' },
  { path: '/about/journey', priority: '0.6', changefreq: 'monthly', titleAr: 'رحلتنا | أجنحة الطيران', titleEn: 'Our Journey | Fly Wings', descAr: 'محطات انطلاق أكاديمية أجنحة الطيران وأهم إنجازاتها.', descEn: 'Milestones and achievements of the Fly Wings academy.' },
  { path: '/about/board', priority: '0.6', changefreq: 'monthly', titleAr: 'مجلس الإدارة | أجنحة الطيران', titleEn: 'Board Members | Fly Wings', descAr: 'أعضاء مجلس إدارة أجنحة الطيران.', descEn: 'Fly Wings board members.' },
  { path: '/about/training-team', priority: '0.6', changefreq: 'monthly', titleAr: 'الفريق التدريبي | أجنحة الطيران', titleEn: 'Training Team | Fly Wings', descAr: 'نخبة من المدربين المعتمدين في أجنحة الطيران.', descEn: 'Certified instructors at Fly Wings.' },
  { path: '/packages', priority: '0.9', changefreq: 'weekly', titleAr: 'الباقات التدريبية | أجنحة الطيران', titleEn: 'Training Packages | Fly Wings', descAr: 'باقات تدريب الطيران المتاحة وأسعارها ومدتها في أجنحة الطيران.', descEn: 'Available flight training packages, pricing and duration at Fly Wings.' },
  { path: '/training-programs', priority: '0.9', changefreq: 'weekly', titleAr: 'البرامج التدريبية | أجنحة الطيران', titleEn: 'Training Programs | Fly Wings', descAr: 'مراحل الرحلة التعليمية من اللغة الإنجليزية حتى رخصة الطيران.', descEn: 'The educational journey from English language up to a pilot license.' },
  { path: '/blog', priority: '0.8', changefreq: 'daily', titleAr: 'المدونة | أجنحة الطيران', titleEn: 'Blog | Fly Wings', descAr: 'مقالات ونصائح عن تدريب الطيران والرخص والدراسة في الخارج.', descEn: 'Articles and tips about flight training, licenses and studying abroad.' },
  { path: '/news', priority: '0.8', changefreq: 'daily', titleAr: 'الأخبار | أجنحة الطيران', titleEn: 'News | Fly Wings', descAr: 'آخر أخبار وفعاليات أجنحة الطيران.', descEn: 'Latest news and events from Fly Wings.' },
  { path: '/graduates', priority: '0.7', changefreq: 'weekly', titleAr: 'نجوم الطيران | أجنحة الطيران', titleEn: 'Flying Stars | Fly Wings', descAr: 'قصص نجاح خريجي أجنحة الطيران.', descEn: 'Success stories of Fly Wings graduates.' },
  { path: '/activities', priority: '0.7', changefreq: 'weekly', titleAr: 'الأنشطة | أجنحة الطيران', titleEn: 'Activities | Fly Wings', descAr: 'أنشطة وفعاليات أجنحة الطيران.', descEn: 'Fly Wings activities and events.' },
  { path: '/gallery', priority: '0.6', changefreq: 'weekly', titleAr: 'معرض الصور | أجنحة الطيران', titleEn: 'Gallery | Fly Wings', descAr: 'صور من أجواء التدريب والفعاليات في أجنحة الطيران.', descEn: 'Photos from training and events at Fly Wings.' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly', titleAr: 'الأسئلة الشائعة | أجنحة الطيران', titleEn: 'FAQ | Fly Wings', descAr: 'إجابات على أكثر الأسئلة شيوعاً حول التدريب على الطيران.', descEn: 'Answers to the most common questions about flight training.' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly', titleAr: 'اتصل بنا | أجنحة الطيران', titleEn: 'Contact Us | Fly Wings', descAr: 'تواصل مع فريق أجنحة الطيران للاستفسار عن برامج التدريب والتسجيل.', descEn: 'Contact the Fly Wings team about training programs and registration.' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly', titleAr: 'سياسة الخصوصية | أجنحة الطيران', titleEn: 'Privacy Policy | Fly Wings' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly', titleAr: 'الشروط والأحكام | أجنحة الطيران', titleEn: 'Terms & Conditions | Fly Wings' },
];

async function collectDynamicRoutes() {
  const [posts, news, packages, programs, activities, graduates, faqs] = await Promise.all([
    fetchCollection('blog_posts'),
    fetchCollection('news'),
    fetchCollection('packages'),
    fetchCollection('training_programs'),
    fetchCollection('activities'),
    fetchCollection('graduates'),
    fetchCollection('faqs'),
  ]);

  // FAQPage schema is attached to the /faq route (defined in STATIC_ROUTES).
  const faqRoute = STATIC_ROUTES.find((r) => r.path === '/faq');
  if (faqRoute) {
    faqRoute.faqs = faqs
      .filter((f) => f.questionAr || f.questionEn)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((f) => ({
        qAr: f.questionAr,
        aAr: stripHtml(f.answerAr, 1200),
        qEn: f.questionEn,
        aEn: stripHtml(f.answerEn, 1200),
      }));
  }

  const routes = [];

  for (const p of posts.filter((p) => p.published !== false)) {
    routes.push({
      path: `/blog/${p.slug || p.id}`,
      aliases: p.slug ? [`/blog/${p.id}`] : [],
      priority: '0.7',
      changefreq: 'monthly',
      type: 'article',
      image: p.image,
      published: p.createdAt,
      lastmod: isoDate(p.updatedAt || p.dateModified || p.createdAt),

      titleAr: p.metaTitleAr || p.titleAr,
      titleEn: p.metaTitleEn || p.titleEn,
      descAr: p.metaDescriptionAr || p.excerptAr || stripHtml(p.contentAr, 155),
      descEn: p.metaDescriptionEn || p.excerptEn || stripHtml(p.contentEn, 155),
      bodyAr: stripHtml(p.contentAr, 4000),
      bodyEn: stripHtml(p.contentEn, 4000),
      crumbAr: { name: 'المدونة', path: '/blog' },
      crumbEn: { name: 'Blog', path: '/blog' },
      schema: 'BlogPosting',
    });
  }

  for (const n of news.filter((n) => n.published !== false)) {
    routes.push({
      path: `/news/${n.slug || n.id}`,
      aliases: n.slug ? [`/news/${n.id}`] : [],
      priority: '0.7',
      changefreq: 'monthly',
      type: 'article',
      image: n.imageUrl,
      published: n.date,
      lastmod: isoDate(n.updatedAt || n.dateModified || n.date),

      titleAr: n.metaTitleAr || n.titleAr,
      titleEn: n.metaTitleEn || n.titleEn,
      descAr: n.metaDescriptionAr || n.excerptAr || stripHtml(n.contentAr, 155),
      descEn: n.metaDescriptionEn || n.excerptEn || stripHtml(n.contentEn, 155),
      bodyAr: stripHtml(n.contentAr, 4000),
      bodyEn: stripHtml(n.contentEn, 4000),
      crumbAr: { name: 'الأخبار', path: '/news' },
      crumbEn: { name: 'News', path: '/news' },
      schema: 'NewsArticle',
    });
  }

  for (const p of packages.filter((p) => p.active !== false)) {
    routes.push({
      path: `/packages/${p.id}`,
      priority: '0.7',
      changefreq: 'monthly',
      image: p.imageUrl,
      titleAr: `${p.nameAr} | أجنحة الطيران`,
      titleEn: `${p.nameEn} | Fly Wings`,
      descAr: stripHtml(p.fullDescriptionAr || p.descriptionAr, 155),
      descEn: stripHtml(p.fullDescriptionEn || p.descriptionEn, 155),
      bodyAr: stripHtml(p.fullDescriptionAr || p.descriptionAr, 2000),
      bodyEn: stripHtml(p.fullDescriptionEn || p.descriptionEn, 2000),
      crumbAr: { name: 'الباقات', path: '/packages' },
      crumbEn: { name: 'Packages', path: '/packages' },
      kind: 'course',
      courseNameAr: p.nameAr,
      courseNameEn: p.nameEn,
      price: typeof p.price === 'number' ? p.price : Number(p.price) || undefined,
      durationAr: p.durationAr,
      durationEn: p.durationEn,
    });
  }

  for (const p of programs.filter((p) => p.published !== false)) {
    routes.push({
      path: `/training-programs/${p.id}`,
      priority: '0.7',
      changefreq: 'monthly',
      image: p.imageUrl,
      titleAr: `${p.titleAr} | أجنحة الطيران`,
      titleEn: `${p.titleEn} | Fly Wings`,
      descAr: stripHtml(p.shortDescAr || p.descriptionAr, 155),
      descEn: stripHtml(p.shortDescEn || p.descriptionEn, 155),
      bodyAr: stripHtml(p.descriptionAr, 2000),
      bodyEn: stripHtml(p.descriptionEn, 2000),
      crumbAr: { name: 'البرامج التدريبية', path: '/training-programs' },
      crumbEn: { name: 'Training Programs', path: '/training-programs' },
      kind: 'course',
      courseNameAr: p.titleAr,
      courseNameEn: p.titleEn,
      durationAr: p.durationAr,
      durationEn: p.durationEn,
    });
  }

  for (const a of activities) {
    routes.push({
      path: `/activities/${a.id}`,
      priority: '0.6',
      changefreq: 'monthly',
      image: Array.isArray(a.images) ? a.images[0] : undefined,
      titleAr: `${a.titleAr} | أجنحة الطيران`,
      titleEn: `${a.titleEn} | Fly Wings`,
      descAr: stripHtml(a.excerptAr || a.contentAr, 155),
      descEn: stripHtml(a.excerptEn || a.contentEn, 155),
      bodyAr: stripHtml(a.contentAr, 2000),
      bodyEn: stripHtml(a.contentEn, 2000),
      crumbAr: { name: 'الأنشطة', path: '/activities' },
      crumbEn: { name: 'Activities', path: '/activities' },
      kind: a.date ? 'event' : 'article',
      schema: a.date ? undefined : 'Article',
      eventNameAr: a.titleAr,
      eventNameEn: a.titleEn,
      startDate: a.date,
    });
  }

  for (const g of graduates.filter((g) => g.published !== false)) {
    routes.push({
      path: `/graduates/${g.id}`,
      priority: '0.6',
      changefreq: 'monthly',
      image: g.imageUrl,
      titleAr: `${g.nameAr} | نجوم الطيران`,
      titleEn: `${g.nameEn} | Flying Stars`,
      descAr: stripHtml(g.storyAr || g.titleAr, 155),
      descEn: stripHtml(g.storyEn || g.titleEn, 155),
      bodyAr: stripHtml(g.storyAr, 2000),
      bodyEn: stripHtml(g.storyEn, 2000),
      crumbAr: { name: 'نجوم الطيران', path: '/graduates' },
      crumbEn: { name: 'Flying Stars', path: '/graduates' },
      kind: 'person',
      personNameAr: g.nameAr,
      personNameEn: g.nameEn,
      jobTitleAr: g.titleAr,
      jobTitleEn: g.titleEn,
      program: g.program,
      graduationDate: g.graduationDate,
    });
  }

  return routes;
}

/* ---------------- Sitemap ---------------- */

function buildSitemap(routes) {
  const urls = [];
  for (const r of routes) {
    for (const lang of ['ar', 'en']) {
      urls.push(
        [
          '  <url>',
          `    <loc>${esc(localeUrl(r.path, lang))}</loc>`,
          r.lastmod ? `    <lastmod>${esc(r.lastmod)}</lastmod>` : null,
          `    <xhtml:link rel="alternate" hreflang="ar" href="${esc(localeUrl(r.path, 'ar'))}" />`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${esc(localeUrl(r.path, 'en'))}" />`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(localeUrl(r.path, 'ar'))}" />`,
          '  </url>',

        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

/* ---------------- Prerender ---------------- */

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'أجنحة الطيران',
  alternateName: 'Fly Wings',
  url: SITE,
  logo: `${SITE}/logo.png`,
  description:
    'شركة سعودية رائدة في مجال التدريب على الطيران. نقدم برامج تدريبية متكاملة تبدأ من اللغة الإنجليزية حتى الحصول على رخصة الطيران.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'SA',
    addressRegion: 'الرياض',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+966559254035',
    contactType: 'customer service',
    email: 'info@bflywings.com',
    availableLanguage: ['Arabic', 'English'],
  },
  sameAs: ['https://x.com/b_flywings', 'https://www.tiktok.com/@flying.wings1'],
  areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'برامج التدريب على الطيران',
    itemListElement: [
      { '@type': 'Course', name: 'رخصة الطيار الخاص PPL', description: 'برنامج تدريبي للحصول على رخصة الطيار الخاص' },
      { '@type': 'Course', name: 'رخصة الطيار التجاري CPL', description: 'برنامج تدريبي للحصول على رخصة الطيار التجاري' },
      { '@type': 'Course', name: 'تصنيف الطيران الآلي IR', description: 'برنامج تدريبي للحصول على تصنيف الطيران الآلي' },
    ],
  },
};



/** Drops undefined/empty values so no JSON-LD node ships incomplete properties. */
const prune = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
    out[k] = v;
  }
  return out;
};

const PROVIDER = (lang) => ({
  '@type': 'EducationalOrganization',
  name: lang === 'ar' ? 'أجنحة الطيران' : 'Fly Wings',
  url: SITE,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
});

/** Maps a static route to the most specific WebPage subtype. */
function staticPageType(path) {
  if (path === '/contact') return 'ContactPage';
  if (path.startsWith('/about')) return 'AboutPage';
  if (path === '/gallery') return 'ImageGallery';
  if (path === '/privacy' || path === '/terms') return 'WebPage';
  return null;
}

/**
 * Builds every JSON-LD node for a page based on its content type:
 * BlogPosting / NewsArticle / Course / Event / Person / FAQPage /
 * CollectionPage + ItemList for index pages, plus a WebPage subtype
 * for the remaining static pages.
 */
function buildPageSchemas(route, lang, { title, description, image, url, allRoutes = [] }) {
  const schemas = [];
  const ar = lang === 'ar';
  const provider = PROVIDER(lang);

  if (route.schema) {
    // Blog posts, news items and undated activities.
    schemas.push(
      prune({
        '@context': 'https://schema.org',
        '@type': route.schema,
        headline: title,
        description,
        image,
        datePublished: route.published,
        dateModified: route.published,
        author: provider,
        publisher: provider,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: lang,
      }),
    );
  }

  if (route.kind === 'course') {
    const name = (ar ? route.courseNameAr : route.courseNameEn) || title;
    const duration = ar ? route.durationAr : route.durationEn;
    schemas.push(
      prune({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name,
        description,
        image,
        url,
        inLanguage: lang,
        provider,
        offers: route.price
          ? prune({
              '@type': 'Offer',
              price: String(route.price),
              priceCurrency: 'SAR',
              category: 'Paid',
              availability: 'https://schema.org/InStock',
              url,
            })
          : undefined,
        hasCourseInstance: prune({
          '@type': 'CourseInstance',
          courseMode: 'onsite',
          courseWorkload: duration || undefined,
          location: prune({
            '@type': 'Place',
            name: ar ? 'أجنحة الطيران' : 'Fly Wings',
            address: ORG_SCHEMA.address,
          }),
        }),
      }),
    );
  }

  if (route.kind === 'event') {
    schemas.push(
      prune({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: (ar ? route.eventNameAr : route.eventNameEn) || title,
        description,
        image,
        url,
        startDate: route.startDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: provider,
        location: prune({
          '@type': 'Place',
          name: ar ? 'أجنحة الطيران' : 'Fly Wings',
          address: ORG_SCHEMA.address,
        }),
      }),
    );
  }

  if (route.kind === 'person') {
    schemas.push(
      prune({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: (ar ? route.personNameAr : route.personNameEn) || title,
        jobTitle: (ar ? route.jobTitleAr : route.jobTitleEn) || undefined,
        description,
        image,
        url,
        alumniOf: provider,
        knowsAbout: route.program || undefined,
      }),
    );
  }

  if (route.faqs && route.faqs.length) {
    const entities = route.faqs
      .map((f) =>
        prune({
          '@type': 'Question',
          name: (ar ? f.qAr : f.qEn) || f.qAr,
          acceptedAnswer: prune({ '@type': 'Answer', text: (ar ? f.aAr : f.aEn) || f.aAr }),
        }),
      )
      .filter((q) => q.name && q.acceptedAnswer?.text);
    if (entities.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: entities,
      });
    }
  }

  // Index pages: CollectionPage + an ItemList of their children.
  if (INDEX_PREFIXES.includes(route.path)) {
    const children = allRoutes.filter((r) => r.path.startsWith(`${route.path}/`));
    schemas.push(
      prune({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url,
        inLanguage: lang,
        isPartOf: { '@type': 'WebSite', name: ar ? 'أجنحة الطيران' : 'Fly Wings', url: SITE },
        mainEntity: children.length
          ? {
              '@type': 'ItemList',
              numberOfItems: children.length,
              itemListElement: children.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: (ar ? c.titleAr : c.titleEn) || c.path,
                url: localeUrl(c.path, lang),
              })),
            }
          : undefined,
      }),
    );
  } else if (!route.schema && !route.kind && !route.faqs) {
    const pageType = staticPageType(route.path);
    if (pageType) {
      schemas.push(
        prune({
          '@context': 'https://schema.org',
          '@type': pageType,
          name: title,
          description,
          url,
          inLanguage: lang,
          isPartOf: { '@type': 'WebSite', name: ar ? 'أجنحة الطيران' : 'Fly Wings', url: SITE },
          about: provider,
        }),
      );
    }
  }

  return schemas;
}

function buildHead(route, lang, allRoutes = []) {
  const title = (lang === 'ar' ? route.titleAr : route.titleEn) || route.titleAr || '';
  const description = (lang === 'ar' ? route.descAr : route.descEn) || route.descAr || '';
  const url = localeUrl(route.path, lang);
  const image = route.image || `${SITE}/logo.png`;
  const type = route.type || 'website';

  const tags = [
    `<title>${esc(title)}</title>`,
    description ? `<meta name="description" content="${esc(description)}" />` : '',
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="ar" href="${esc(localeUrl(route.path, 'ar'))}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(localeUrl(route.path, 'en'))}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(localeUrl(route.path, 'ar'))}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    description ? `<meta property="og:description" content="${esc(description)}" />` : '',
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    description ? `<meta name="twitter:description" content="${esc(description)}" />` : '',
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];

  if (route.path === '/') {
    tags.push(`<script type="application/ld+json">${JSON.stringify(ORG_SCHEMA)}</script>`);
  }

  for (const schema of buildPageSchemas(route, lang, { title, description, image, url, allRoutes })) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  }

  const crumb = lang === 'ar' ? route.crumbAr : route.crumbEn;
  if (crumb) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: lang === 'ar' ? 'الرئيسية' : 'Home', item: localeUrl('/', lang) },
          { '@type': 'ListItem', position: 2, name: crumb.name, item: localeUrl(crumb.path, lang) },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      })}</script>`,
    );
  }

  return tags.filter(Boolean).join('\n    ');
}

/* ---------------- Static link graph (crawlable without JS) ---------------- */

const NAV_LINKS = [
  { path: '/', ar: 'الرئيسية', en: 'Home' },
  { path: '/about', ar: 'من نحن', en: 'About Us' },
  { path: '/packages', ar: 'الباقات التدريبية', en: 'Training Packages' },
  { path: '/training-programs', ar: 'البرامج التدريبية', en: 'Training Programs' },
  { path: '/blog', ar: 'المدونة', en: 'Blog' },
  { path: '/news', ar: 'الأخبار', en: 'News' },
  { path: '/activities', ar: 'الأنشطة', en: 'Activities' },
  { path: '/graduates', ar: 'نجوم الطيران', en: 'Flying Stars' },
  { path: '/gallery', ar: 'معرض الصور', en: 'Gallery' },
  { path: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
  { path: '/contact', ar: 'اتصل بنا', en: 'Contact Us' },
];

/** Index routes whose children get listed inline so bots reach every detail page. */
const INDEX_PREFIXES = ['/blog', '/news', '/packages', '/training-programs', '/activities', '/graduates'];

const link = (path, lang, label) => `<a href="${esc(localePath(path, lang))}">${esc(label)}</a>`;

function buildNav(lang) {
  const items = NAV_LINKS.map((n) => `<li>${link(n.path, lang, lang === 'ar' ? n.ar : n.en)}</li>`).join('');
  return `<nav aria-label="${lang === 'ar' ? 'روابط الموقع' : 'Site links'}"><ul>${items}</ul></nav>`;
}

function buildLangSwitch(route, lang) {
  const other = lang === 'ar' ? 'en' : 'ar';
  const label = other === 'ar' ? 'العربية' : 'English';
  return `<p>${link(route.path, other, label)}</p>`;
}

function buildChildList(route, lang, allRoutes) {
  if (!INDEX_PREFIXES.includes(route.path)) return '';
  const prefix = `${route.path}/`;
  const children = allRoutes.filter((r) => r.path.startsWith(prefix));
  if (!children.length) return '';
  const items = children
    .map((c) => {
      const title = (lang === 'ar' ? c.titleAr : c.titleEn) || c.path;
      const desc = (lang === 'ar' ? c.descAr : c.descEn) || '';
      return `<li><h2>${link(c.path, lang, title)}</h2>${desc ? `<p>${esc(desc)}</p>` : ''}</li>`;
    })
    .join('');
  return `<ul>${items}</ul>`;
}

function buildParagraphs(text) {
  const chunks = String(text || '')
    .split(/(?<=[.!؟?])\s+/)
    .reduce((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (last && (last + ' ' + sentence).length < 400) acc[acc.length - 1] = `${last} ${sentence}`;
      else acc.push(sentence);
      return acc;
    }, []);
  return chunks
    .filter((c) => c.trim())
    .map((c) => `<p>${esc(c.trim())}</p>`)
    .join('');
}

function buildBody(route, lang, allRoutes = []) {
  const title = (lang === 'ar' ? route.titleAr : route.titleEn) || '';
  const description = (lang === 'ar' ? route.descAr : route.descEn) || '';
  const body = (lang === 'ar' ? route.bodyAr : route.bodyEn) || '';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const crumb = lang === 'ar' ? route.crumbAr : route.crumbEn;
  return [
    `<div id="prerender-content" dir="${dir}" style="max-width:800px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif">`,
    buildNav(lang),
    buildLangSwitch(route, lang),
    crumb ? `<p>${link('/', lang, lang === 'ar' ? 'الرئيسية' : 'Home')} / ${link(crumb.path, lang, crumb.name)}</p>` : '',
    `<h1>${esc(title)}</h1>`,
    description ? `<p>${esc(description)}</p>` : '',
    body ? buildParagraphs(body) : '',
    buildChildList(route, lang, allRoutes),
    `</div>`,
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Writes one static HTML file.
 * `outPath` lets us emit extra URL variants (/ar/... prefix, legacy id URLs)
 * while the canonical inside always points at the single preferred URL.
 */
function writePage(template, route, lang, outPath, allRoutes = []) {
  const routePath = outPath || localePath(route.path, lang);
  const dirPath = resolve(DIST, `.${routePath}`);
  const filePath = routePath === '/' ? resolve(DIST, 'index.html') : resolve(dirPath, 'index.html');

  let html = template
    .replace('<html lang="ar" dir="rtl">', `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '');

  html = html.replace('</head>', `  ${buildHead(route, lang, allRoutes)}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${buildBody(route, lang, allRoutes)}</div>`);

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

/* ---------------- Main ---------------- */

async function main() {
  if (!existsSync(DIST)) {
    console.warn('[seo-build] dist/ not found — run after `vite build`. Skipping.');
    return;
  }
  const dynamicRoutes = await collectDynamicRoutes();
  let routes = [...STATIC_ROUTES, ...dynamicRoutes];

  const maxRoutes = Math.floor(MAX_PRERENDER_PAGES / 2);
  const prerenderRoutes = routes.slice(0, maxRoutes);
  if (routes.length > maxRoutes) {
    console.warn(`[seo-build] capping prerender at ${maxRoutes} routes (of ${routes.length}).`);
  }

  const sitemap = buildSitemap(routes);
  writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);
  writeFileSync(resolve('public/sitemap.xml'), sitemap);

  const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  let files = 0;
  for (const route of prerenderRoutes) {
    const aliases = route.aliases || [];
    for (const lang of ['ar', 'en']) {
      writePage(template, route, lang, undefined, routes);
      files++;
      for (const alias of aliases) {
        writePage(template, route, lang, localePath(alias, lang), routes);
        files++;
      }
    }
    // Explicit /ar/... variants (Arabic canonical stays on the unprefixed URL)
    for (const p of [route.path, ...aliases]) {
      const arPath = p === '/' ? '/ar' : `/ar${p}`;
      writePage(template, route, 'ar', arPath, routes);
      files++;
    }
  }

  console.log(
    `[seo-build] sitemap: ${routes.length * 2} urls · prerendered: ${files} html files`,
  );
}

main().catch((err) => {
  console.error('[seo-build] failed:', err);
  // Never break the deploy because of SEO post-processing.
});
