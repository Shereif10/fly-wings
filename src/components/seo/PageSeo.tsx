import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { localeUrl, SITE_URL } from '@/lib/content';

export interface PageSeoEntry {
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  noindex?: boolean;
}

export type PageSeoMap = Record<string, PageSeoEntry>;

export interface Crumb {
  name: string;
  path: string;
}

let cache: PageSeoMap | null = null;

/**
 * Per-page <head> metadata. Values managed from the admin SEO tab override
 * the defaults passed as props, so Google uses the meta title instead of H1.
 */
const PageSeo = ({
  pageKey,
  path,
  defaultTitleAr,
  defaultTitleEn,
  defaultDescriptionAr,
  defaultDescriptionEn,
  image,
  type = 'website',
  breadcrumbs,
}: {
  pageKey: string;
  path: string;
  defaultTitleAr: string;
  defaultTitleEn: string;
  defaultDescriptionAr?: string;
  defaultDescriptionEn?: string;
  image?: string;
  type?: 'website' | 'article';
  breadcrumbs?: Crumb[];
}) => {
  const { t, language } = useLanguage();
  const [entry, setEntry] = useState<PageSeoEntry>(cache?.[pageKey] || {});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!cache) {
          const snap = await getDoc(doc(db, 'site_settings', 'page_seo'));
          cache = snap.exists() ? ((snap.data() as { pages?: PageSeoMap }).pages || {}) : {};
        }
        if (active) setEntry(cache[pageKey] || {});
      } catch {
        /* keep defaults */
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [pageKey]);

  const title = t(entry.titleAr || '', entry.titleEn || '') || t(defaultTitleAr, defaultTitleEn);
  const description =
    t(entry.descriptionAr || '', entry.descriptionEn || '') ||
    t(defaultDescriptionAr || '', defaultDescriptionEn || '');
  const canonical = localeUrl(path, language);
  const arUrl = localeUrl(path, 'ar');
  const enUrl = localeUrl(path, 'en');
  const ogImage = image || `${SITE_URL}/logo.png`;

  return (
    <Helmet>
      <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="ar" href={arUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={arUrl} />
      {entry.noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_SA' : 'en_US'} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((b, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: b.name,
              item: localeUrl(b.path, language),
            })),
          })}
        </script>
      )}
    </Helmet>
  );
};

export default PageSeo;
