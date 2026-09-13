// Shared helpers for slugs, SEO text and rich HTML content

const AR_MAP: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'a', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z',
  ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'h',
  و: 'w', ي: 'y', ى: 'a', ء: '', ئ: 'e', ؤ: 'o',
};

/** Turn any Arabic/English title into a URL friendly slug */
export const slugify = (input: string): string => {
  if (!input) return '';
  const transliterated = input
    .split('')
    .map((ch) => (AR_MAP[ch] !== undefined ? AR_MAP[ch] : ch))
    .join('');
  return transliterated
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
};

/** Detect content that was saved as plain text (no HTML markup) */
export const isPlainText = (content: string): boolean =>
  !!content && !/<\/?(p|div|h[1-6]|ul|ol|li|table|img|blockquote|section|br)\b/i.test(content);

/**
 * Make sure content renders with structure.
 * Plain-text content is converted into paragraphs; lines that look like
 * headings (short, no ending punctuation) become <h3>.
 */
export const ensureHtml = (content: string): string => {
  if (!content) return '';
  if (!isPlainText(content)) return content;
  return content
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^#{2,4}\s+/.test(line)) {
        const level = Math.min(line.match(/^#+/)![0].length, 4);
        return `<h${level}>${line.replace(/^#+\s+/, '')}</h${level}>`;
      }
      if (/^[-*•]\s+/.test(line)) return `<ul><li>${line.replace(/^[-*•]\s+/, '')}</li></ul>`;
      if (line.length < 70 && !/[.!؟?:،,]$/.test(line)) return `<h3>${line}</h3>`;
      return `<p>${line}</p>`;
    })
    .join('\n');
};

/** Strip tags for meta descriptions / previews */
export const stripHtml = (html: string, max = 300): string => {
  const text = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

export const SITE_URL = 'https://bflywings.com';

/* ---------------- Language aware URLs ---------------- */

export type Lang = 'ar' | 'en';

/** Arabic lives at the root (also reachable at /ar), English lives under /en */
export const getLangFromPath = (pathname?: string): Lang => {
  const p = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'ar';
};

/** True when the current URL explicitly uses the /ar prefix */
export const hasArPrefix = (pathname?: string): boolean => {
  const p = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  return p === '/ar' || p.startsWith('/ar/');
};

/** Router basename so every existing <Link to="/x"> stays inside the active language */
export const ROUTER_BASENAME =
  getLangFromPath() === 'en' ? '/en' : hasArPrefix() ? '/ar' : '/';

/** Path without the language prefix, always starting with "/" */
export const stripLangPrefix = (pathname: string): string => {
  if (pathname === '/en' || pathname === '/ar') return '/';
  if (pathname.startsWith('/en/') || pathname.startsWith('/ar/')) return pathname.slice(3) || '/';
  return pathname || '/';
};

/** Same page in the given language, e.g. ("/blog", "en") => "/en/blog" */
export const localePath = (path: string, lang: Lang): string => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') return clean === '/' ? '/en' : `/en${clean}`;
  return clean;
};


/** Absolute canonical URL for a page in a given language */
export const localeUrl = (path: string, lang: Lang): string => {
  const p = localePath(path, lang);
  return `${SITE_URL}${p === '/' ? '' : p}`;
};
