import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Save, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RichTextEditor from './RichTextEditor';

interface LegalContent {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

const defaultPrivacy: LegalContent = {
  titleAr: 'سياسة الخصوصية',
  titleEn: 'Privacy Policy',
  contentAr: 'نحن في أجنحة الطيران نلتزم بحماية خصوصيتك...',
  contentEn: 'At Fly Wings, we are committed to protecting your privacy...',
};

const defaultTerms: LegalContent = {
  titleAr: 'الشروط والأحكام',
  titleEn: 'Terms & Conditions',
  contentAr: 'مرحباً بك في أجنحة الطيران. باستخدامك لموقعنا...',
  contentEn: 'Welcome to Fly Wings. By using our website...',
};

const LegalPagesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState<LegalContent>(defaultPrivacy);
  const [terms, setTerms] = useState<LegalContent>(defaultTerms);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [privacyDoc, termsDoc] = await Promise.all([
          getDoc(doc(db, 'legal_pages', 'privacy')),
          getDoc(doc(db, 'legal_pages', 'terms')),
        ]);

        if (privacyDoc.exists()) {
          setPrivacy(privacyDoc.data() as LegalContent);
        }
        if (termsDoc.exists()) {
          setTerms(termsDoc.data() as LegalContent);
        }
      } catch (error) {
        console.error('Error fetching legal pages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (type: 'privacy' | 'terms') => {
    setSaving(true);
    try {
      const data = type === 'privacy' ? privacy : terms;
      await setDoc(doc(db, 'legal_pages', type), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: t('تم الحفظ بنجاح', 'Saved successfully') });
    } catch (error) {
      toast({ title: t('حدث خطأ', 'Error occurred'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('الصفحات القانونية', 'Legal Pages')}</h1>
        <p className="text-muted-foreground">{t('إدارة سياسة الخصوصية والشروط والأحكام', 'Manage Privacy Policy and Terms & Conditions')}</p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="w-4 h-4" />
            {t('سياسة الخصوصية', 'Privacy Policy')}
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="w-4 h-4" />
            {t('الشروط والأحكام', 'Terms')}
          </TabsTrigger>
        </TabsList>

        {/* Privacy Policy Tab */}
        <TabsContent value="privacy">
          <motion.div
            className="bg-card rounded-2xl border shadow-soft p-6 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                <Input
                  value={privacy.titleAr}
                  onChange={(e) => setPrivacy({ ...privacy, titleAr: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                <Input
                  value={privacy.titleEn}
                  onChange={(e) => setPrivacy({ ...privacy, titleEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
                <RichTextEditor
                  value={privacy.contentAr}
                  onChange={(val) => setPrivacy({ ...privacy, contentAr: val })}
                  dir="rtl"
                  minHeight="320px"
                />
              </div>
              <div>
                <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
                <RichTextEditor
                  value={privacy.contentEn}
                  onChange={(val) => setPrivacy({ ...privacy, contentEn: val })}
                  dir="ltr"
                  minHeight="320px"
                />
              </div>
            </div>

            <Button onClick={() => handleSave('privacy')} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {t('حفظ سياسة الخصوصية', 'Save Privacy Policy')}
            </Button>
          </motion.div>
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms">
          <motion.div
            className="bg-card rounded-2xl border shadow-soft p-6 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                <Input
                  value={terms.titleAr}
                  onChange={(e) => setTerms({ ...terms, titleAr: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                <Input
                  value={terms.titleEn}
                  onChange={(e) => setTerms({ ...terms, titleEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
                <RichTextEditor
                  value={terms.contentAr}
                  onChange={(val) => setTerms({ ...terms, contentAr: val })}
                  dir="rtl"
                  minHeight="320px"
                />
              </div>
              <div>
                <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
                <RichTextEditor
                  value={terms.contentEn}
                  onChange={(val) => setTerms({ ...terms, contentEn: val })}
                  dir="ltr"
                  minHeight="320px"
                />
              </div>
            </div>

            <Button onClick={() => handleSave('terms')} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {t('حفظ الشروط والأحكام', 'Save Terms & Conditions')}
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalPagesManager;
