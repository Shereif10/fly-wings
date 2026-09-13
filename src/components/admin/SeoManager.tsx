import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Search } from 'lucide-react';
import { SITE_URL } from '@/lib/content';
import type { PageSeoEntry, PageSeoMap } from '@/components/seo/PageSeo';

const PAGES: { key: string; path: string; ar: string; en: string }[] = [
  { key: 'home', path: '/', ar: 'الرئيسية', en: 'Home' },
  { key: 'about', path: '/about', ar: 'من نحن', en: 'About' },
  { key: 'packages', path: '/packages', ar: 'الباقات التدريبية', en: 'Packages' },
  { key: 'training-programs', path: '/training-programs', ar: 'مراحل التدريب', en: 'Training Programs' },
  { key: 'training-team', path: '/training-team', ar: 'فريق التدريب', en: 'Training Team' },
  { key: 'graduates', path: '/graduates', ar: 'نجوم الطيران', en: 'Flying Stars' },
  { key: 'activities', path: '/activities', ar: 'الأنشطة', en: 'Activities' },
  { key: 'news', path: '/news', ar: 'الأخبار', en: 'News' },
  { key: 'blog', path: '/blog', ar: 'المدونة', en: 'Blog' },
  { key: 'gallery', path: '/gallery', ar: 'المعرض', en: 'Gallery' },
  { key: 'faq', path: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
  { key: 'contact', path: '/contact', ar: 'تواصل معنا', en: 'Contact' },
  { key: 'journey', path: '/our-journey', ar: 'انطلاقة الأكاديمية', en: 'Our Journey' },
  { key: 'board-members', path: '/board-members', ar: 'مجلس الإدارة', en: 'Board Members' },
  { key: 'privacy', path: '/privacy', ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  { key: 'terms', path: '/terms', ar: 'الشروط والأحكام', en: 'Terms' },
];

const Counter = ({ value, max }: { value: string; max: number }) => (
  <span className={`text-xs ${value.length > max ? 'text-destructive' : 'text-muted-foreground'}`}>
    {value.length}/{max}
  </span>
);

const SeoManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [pages, setPages] = useState<PageSeoMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'site_settings', 'page_seo'));
        if (snap.exists()) setPages((snap.data() as { pages?: PageSeoMap }).pages || {});
      } catch (e) {
        console.error('Error loading page SEO:', e);
      }
      setLoading(false);
    })();
  }, []);

  const update = (key: string, patch: Partial<PageSeoEntry>) =>
    setPages((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'page_seo'), { pages }, { merge: true });
      toast({ title: t('تم الحفظ', 'Saved'), description: t('تم حفظ إعدادات السيو', 'SEO settings saved') });
    } catch (e) {
      console.error(e);
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            {t('تحسين محركات البحث (SEO)', 'Search Engine Optimization')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'حدّد عنوان ووصف كل صفحة بشكل مستقل حتى لا تعتمد جوجل على عنوان H1.',
              'Set an independent meta title and description per page so Google does not fall back to the H1.'
            )}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
          {t('حفظ', 'Save')}
        </Button>
      </div>

      <div className="grid gap-4">
        {PAGES.map((page) => {
          const entry = pages[page.key] || {};
          const previewTitle = entry.titleAr || entry.titleEn || t(page.ar, page.en);
          return (
            <Card key={page.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                  <span>{t(page.ar, page.en)}</span>
                  <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                    {SITE_URL}
                    {page.path === '/' ? '' : page.path}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{t('عنوان الميتا (عربي)', 'Meta title (Arabic)')}</Label>
                      <Counter value={entry.titleAr || ''} max={60} />
                    </div>
                    <Input
                      dir="rtl"
                      value={entry.titleAr || ''}
                      onChange={(e) => update(page.key, { titleAr: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{t('عنوان الميتا (إنجليزي)', 'Meta title (English)')}</Label>
                      <Counter value={entry.titleEn || ''} max={60} />
                    </div>
                    <Input
                      dir="ltr"
                      value={entry.titleEn || ''}
                      onChange={(e) => update(page.key, { titleEn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{t('وصف الميتا (عربي)', 'Meta description (Arabic)')}</Label>
                      <Counter value={entry.descriptionAr || ''} max={160} />
                    </div>
                    <Textarea
                      dir="rtl"
                      rows={2}
                      value={entry.descriptionAr || ''}
                      onChange={(e) => update(page.key, { descriptionAr: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{t('وصف الميتا (إنجليزي)', 'Meta description (English)')}</Label>
                      <Counter value={entry.descriptionEn || ''} max={160} />
                    </div>
                    <Textarea
                      dir="ltr"
                      rows={2}
                      value={entry.descriptionEn || ''}
                      onChange={(e) => update(page.key, { descriptionEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1" dir="ltr">
                    {SITE_URL}
                    {page.path === '/' ? '' : page.path}
                  </p>
                  <p className="text-primary font-medium line-clamp-1">{previewTitle}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.descriptionAr || entry.descriptionEn || t('لا يوجد وصف بعد', 'No description yet')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!entry.noindex}
                    onCheckedChange={(v) => update(page.key, { noindex: v })}
                  />
                  <Label className="text-sm">
                    {t('إخفاء الصفحة من محركات البحث (noindex)', 'Hide this page from search engines (noindex)')}
                  </Label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
          {t('حفظ', 'Save')}
        </Button>
      </div>
    </div>
  );
};

export default SeoManager;
