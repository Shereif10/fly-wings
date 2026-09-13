import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { slugify, SITE_URL } from '@/lib/content';
import { Search, RefreshCw } from 'lucide-react';

export interface SeoValues {
  slug: string;
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
}

interface SeoFieldsProps {
  values: SeoValues;
  onChange: (patch: Partial<SeoValues>) => void;
  /** e.g. "blog" or "news" — used for the URL preview */
  basePath: string;
  /** used to auto-generate the slug */
  titleForSlug: string;
  /** fallback title shown in the Google preview */
  fallbackTitle?: string;
}

const Counter = ({ value, max }: { value: string; max: number }) => (
  <span className={`text-xs ${value.length > max ? 'text-destructive' : 'text-muted-foreground'}`}>
    {value.length}/{max}
  </span>
);

const SeoFields = ({ values, onChange, basePath, titleForSlug, fallbackTitle }: SeoFieldsProps) => {
  const { t } = useLanguage();
  const previewTitle = values.metaTitleAr || values.metaTitleEn || fallbackTitle || t('عنوان الصفحة', 'Page title');
  const previewDesc = values.metaDescriptionAr || values.metaDescriptionEn || '';

  return (
    <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <h3 className="font-bold">{t('تحسين محركات البحث (SEO)', 'Search engine settings (SEO)')}</h3>
      </div>

      <div>
        <Label>{t('الرابط المختصر (Slug)', 'Slug')}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            dir="ltr"
            value={values.slug}
            placeholder="my-article-title"
            onChange={(e) => onChange({ slug: slugify(e.target.value) })}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={t('توليد من العنوان', 'Generate from title')}
            onClick={() => onChange({ slug: slugify(titleForSlug) })}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 break-all" dir="ltr">
          {SITE_URL}/{basePath}/{values.slug || '...'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label>{t('عنوان الميتا (عربي)', 'Meta title (Arabic)')}</Label>
            <Counter value={values.metaTitleAr} max={60} />
          </div>
          <Input value={values.metaTitleAr} onChange={(e) => onChange({ metaTitleAr: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>{t('عنوان الميتا (إنجليزي)', 'Meta title (English)')}</Label>
            <Counter value={values.metaTitleEn} max={60} />
          </div>
          <Input dir="ltr" value={values.metaTitleEn} onChange={(e) => onChange({ metaTitleEn: e.target.value })} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label>{t('وصف الميتا (عربي)', 'Meta description (Arabic)')}</Label>
            <Counter value={values.metaDescriptionAr} max={160} />
          </div>
          <Textarea rows={3} value={values.metaDescriptionAr} onChange={(e) => onChange({ metaDescriptionAr: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>{t('وصف الميتا (إنجليزي)', 'Meta description (English)')}</Label>
            <Counter value={values.metaDescriptionEn} max={160} />
          </div>
          <Textarea rows={3} dir="ltr" value={values.metaDescriptionEn} onChange={(e) => onChange({ metaDescriptionEn: e.target.value })} />
        </div>
      </div>

      {/* Google preview */}
      <div className="rounded-lg border bg-background p-3">
        <p className="text-xs text-muted-foreground mb-1">{t('معاينة نتيجة جوجل', 'Google preview')}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">{SITE_URL}/{basePath}/{values.slug || '...'}</p>
        <p className="text-primary text-base font-medium line-clamp-1">{previewTitle}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{previewDesc}</p>
      </div>
    </div>
  );
};

export default SeoFields;
