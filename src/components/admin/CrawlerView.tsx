import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

/** What a non-JS crawler (Googlebot's raw fetch, GPTBot, ClaudeBot, Screaming Frog) reads. */
interface StaticSnapshot {
  title: string;
  description: string;
  canonical: string;
  hreflang: string[];
  ogTitle: string;
  ogImage: string;
  schemaTypes: string[];
  internalLinks: number;
  textLength: number;
  textPreview: string;
  bytes: number;
  status: number;
}

/** What a JS-executing visitor (and Googlebot's rendering pass) ends up with. */
interface RenderedSnapshot {
  title: string;
  description: string;
  canonical: string;
  schemaTypes: string[];
  internalLinks: number;
  textLength: number;
  textPreview: string;
}

const t = (ar: string, en: string, lang: string) => (lang === 'ar' ? ar : en);

const collectSchemaTypes = (doc: Document) => {
  const types = new Set<string>();
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
    try {
      const walk = (value: unknown) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (value && typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          if (typeof obj['@type'] === 'string') types.add(obj['@type'] as string);
          Object.values(obj).forEach(walk);
        }
      };
      walk(JSON.parse(node.textContent || '{}'));
    } catch {
      types.add('INVALID_JSON');
    }
  });
  return [...types];
};

const countInternalLinks = (root: Document | HTMLElement) =>
  [...root.querySelectorAll('a[href]')].filter((a) => {
    const href = a.getAttribute('href') || '';
    return href.startsWith('/') && !href.startsWith('//');
  }).length;

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

export default function CrawlerView() {
  const { language } = useLanguage();
  const [routes, setRoutes] = useState<string[]>([]);
  const [path, setPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staticSnap, setStaticSnap] = useState<StaticSnapshot | null>(null);
  const [renderedSnap, setRenderedSnap] = useState<RenderedSnapshot | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Route list comes from the generated sitemap so it always matches the build.
  useEffect(() => {
    fetch('/sitemap.xml')
      .then((r) => (r.ok ? r.text() : ''))
      .then((xml) => {
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        const paths = locs
          .map((u) => {
            try {
              return new URL(u).pathname || '/';
            } catch {
              return '';
            }
          })
          .filter(Boolean);
        setRoutes([...new Set(paths)].sort());
      })
      .catch(() => setRoutes([]));
  }, []);

  const analyze = async () => {
    const target = path.startsWith('/') ? path : `/${path}`;
    setLoading(true);
    setError('');
    setStaticSnap(null);
    setRenderedSnap(null);

    try {
      // 1) Raw HTML — exactly the bytes a crawler receives before any JavaScript runs.
      const res = await fetch(target, { headers: { Accept: 'text/html' }, cache: 'no-store' });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const prerender = doc.querySelector('#prerender-content');
      const text = cleanText(prerender?.textContent || doc.body?.textContent || '');

      setStaticSnap({
        title: doc.querySelector('title')?.textContent || '',
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
        hreflang: [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(
          (l) => `${l.getAttribute('hreflang')} → ${l.getAttribute('href')}`,
        ),
        ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
        ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
        schemaTypes: collectSchemaTypes(doc),
        internalLinks: countInternalLinks(doc),
        textLength: text.length,
        textPreview: text.slice(0, 600),
        bytes: new Blob([html]).size,
        status: res.status,
      });

      // 2) Same URL rendered in a hidden iframe — the JavaScript result.
      await new Promise<void>((resolve) => {
        const frame = frameRef.current;
        if (!frame) return resolve();
        const onLoad = () => {
          // Give React Router + Helmet a moment to settle.
          setTimeout(() => {
            try {
              const fdoc = frame.contentDocument;
              if (fdoc) {
                const body = cleanText(fdoc.body?.innerText || fdoc.body?.textContent || '');
                setRenderedSnap({
                  title: fdoc.querySelector('title')?.textContent || '',
                  description:
                    fdoc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                  canonical: fdoc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
                  schemaTypes: collectSchemaTypes(fdoc),
                  internalLinks: countInternalLinks(fdoc),
                  textLength: body.length,
                  textPreview: body.slice(0, 600),
                });
              }
            } catch {
              setError(t('تعذّر قراءة النسخة المعروضة.', 'Could not read the rendered version.', language));
            }
            frame.removeEventListener('load', onLoad);
            resolve();
          }, 2500);
        };
        frame.addEventListener('load', onLoad);
        frame.src = target;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const diffs = useMemo(() => {
    if (!staticSnap || !renderedSnap) return [];
    const rows = [
      {
        label: t('عنوان الصفحة', 'Title', language),
        a: staticSnap.title,
        b: renderedSnap.title,
      },
      {
        label: t('الوصف', 'Description', language),
        a: staticSnap.description,
        b: renderedSnap.description,
      },
      {
        label: t('الرابط الأساسي (Canonical)', 'Canonical', language),
        a: staticSnap.canonical,
        b: renderedSnap.canonical,
      },
      {
        label: t('أنواع البيانات المنظمة', 'Structured data types', language),
        a: staticSnap.schemaTypes.join(', '),
        b: renderedSnap.schemaTypes.join(', '),
      },
    ];
    return rows.map((r) => ({ ...r, same: cleanText(r.a) === cleanText(r.b) }));
  }, [staticSnap, renderedSnap, language]);

  const isDev = typeof window !== 'undefined' && !window.location.hostname.includes('bflywings.com');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('عرض البوتات', 'Crawler View', language)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'قارن بين ما تقرأه بوتات مثل Googlebot و GPTBot من الـ HTML الجاهز، وبين المحتوى بعد تشغيل JavaScript.',
              'Compare what bots like Googlebot and GPTBot read from the prerendered HTML against the content after JavaScript runs.',
              language,
            )}
          </p>
        </div>
      </div>

      {isDev && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mb-1 inline h-4 w-4 text-amber-500" />{' '}
          {t(
            'ملفات الـ HTML الجاهزة تُولَّد وقت البناء، لذا تظهر النتائج الحقيقية على الموقع المنشور (bflywings.com) وليس في المعاينة.',
            'Prerendered HTML files are generated at build time, so real results appear on the published site (bflywings.com), not in the preview.',
            language,
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            list="crawler-routes"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/blog"
            className="flex-1"
            dir="ltr"
          />
          <datalist id="crawler-routes">
            {routes.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <Button onClick={analyze} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('فحص الصفحة', 'Analyze page', language)}
          </Button>
        </div>
        {routes.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              `${routes.length} رابط في خريطة الموقع — اكتب أول حرف لاختيار صفحة.`,
              `${routes.length} URLs in the sitemap — start typing to pick a page.`,
              language,
            )}
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </Card>

      {staticSnap && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {t('ما يراه البوت (بدون JavaScript)', 'What the bot sees (no JavaScript)', language)}
              </h3>
              <Badge variant="secondary">
                HTTP {staticSnap.status} · {(staticSnap.bytes / 1024).toFixed(1)} KB
              </Badge>
            </div>
            <Field label={t('العنوان', 'Title', language)} value={staticSnap.title} />
            <Field label={t('الوصف', 'Description', language)} value={staticSnap.description} />
            <Field label="Canonical" value={staticSnap.canonical} />
            <Field label="og:title" value={staticSnap.ogTitle} />
            <Field
              label={t('البيانات المنظمة', 'Structured data', language)}
              value={staticSnap.schemaTypes.join(', ')}
            />
            <div className="flex gap-2">
              <Metric
                label={t('روابط داخلية', 'Internal links', language)}
                value={staticSnap.internalLinks}
                ok={staticSnap.internalLinks > 0}
              />
              <Metric
                label={t('حروف المحتوى', 'Content chars', language)}
                value={staticSnap.textLength}
                ok={staticSnap.textLength > 200}
              />
              <Metric
                label="hreflang"
                value={staticSnap.hreflang.length}
                ok={staticSnap.hreflang.length >= 2}
              />
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">
              {staticSnap.textPreview || '—'}
            </pre>
          </Card>

          <Card className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">
              {t('بعد تشغيل JavaScript', 'After JavaScript runs', language)}
            </h3>
            {renderedSnap ? (
              <>
                <Field label={t('العنوان', 'Title', language)} value={renderedSnap.title} />
                <Field label={t('الوصف', 'Description', language)} value={renderedSnap.description} />
                <Field label="Canonical" value={renderedSnap.canonical} />
                <Field
                  label={t('البيانات المنظمة', 'Structured data', language)}
                  value={renderedSnap.schemaTypes.join(', ')}
                />
                <div className="flex gap-2">
                  <Metric
                    label={t('روابط داخلية', 'Internal links', language)}
                    value={renderedSnap.internalLinks}
                    ok={renderedSnap.internalLinks > 0}
                  />
                  <Metric
                    label={t('حروف المحتوى', 'Content chars', language)}
                    value={renderedSnap.textLength}
                    ok={renderedSnap.textLength > 200}
                  />
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">
                  {renderedSnap.textPreview || '—'}
                </pre>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loading ? t('جارٍ التحميل…', 'Loading…', language) : '—'}
              </p>
            )}
          </Card>
        </div>
      )}

      {diffs.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-foreground">
            {t('المقارنة', 'Comparison', language)}
          </h3>
          <div className="space-y-2">
            {diffs.map((d) => (
              <div key={d.label} className="rounded border border-border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                  {d.same ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {d.label}
                </div>
                {!d.same && (
                  <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <span>
                      <b>{t('البوت', 'Bot', language)}:</b> {d.a || '—'}
                    </span>
                    <span>
                      <b>JS:</b> {d.b || '—'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <a
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            href={`view-source:${typeof window !== 'undefined' ? window.location.origin : ''}${path}`}
          >
            <ExternalLink className="h-3 w-3" />
            view-source
          </a>
        </Card>
      )}

      <iframe ref={frameRef} title="rendered" className="hidden h-0 w-0" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="break-all text-foreground">{value || '—'}</span>
    </div>
  );
}

function Metric({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return (
    <div
      className={`flex-1 rounded border p-2 text-center ${
        ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'
      }`}
    >
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
