import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Save, Home, Info, BarChart3, Star, Plus, Trash2, Upload, Video, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import { clearDocCache } from '@/lib/firestoreCache';

import RichTextEditor from './RichTextEditor';

interface Feature {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

interface StatItem {
  id: string;
  value: string;
  labelAr: string;
  labelEn: string;
}

interface PageContent {
  home: {
    badgeAr: string;
    badgeEn: string;
    heroTitleAr: string;
    heroTitleEn: string;
    heroSubtitleAr: string;
    heroSubtitleEn: string;
    heroVideoUrl: string;
    heroImageUrl: string;
    heroPosterUrl?: string;
    heroMediaType: 'video' | 'image';
    heroAnimatedTextAr: string;
    heroAnimatedTextEn: string;
  };
  homeAbout: {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    imageUrl: string;
    statsTitleAr: string;
    statsTitleEn: string;
    statsItems: StatItem[];
  };
  stats: {
    graduates: number;
    graduatesLabelAr: string;
    graduatesLabelEn: string;
    years: number;
    yearsLabelAr: string;
    yearsLabelEn: string;
    partners: number;
    partnersLabelAr: string;
    partnersLabelEn: string;
    successRate: number;
    successRateLabelAr: string;
    successRateLabelEn: string;
  };
  features: {
    sectionTitleAr: string;
    sectionTitleEn: string;
    sectionSubtitleAr: string;
    sectionSubtitleEn: string;
    items: Feature[];
  };
  about: {
    heroSubtitleAr: string;
    heroSubtitleEn: string;
    contentAr: string;
    contentEn: string;
    vision2030Ar: string;
    vision2030En: string;
    visionAr: string;
    visionEn: string;
    missionAr: string;
    missionEn: string;
    valuesAr: string;
    valuesEn: string;
    imageUrl: string;
    founderMessageAr: string;
    founderMessageEn: string;
    founderNameAr: string;
    founderNameEn: string;
    founderTitleAr: string;
    founderTitleEn: string;
  };
}

const defaultPages: PageContent = {
  home: {
    badgeAr: 'التسجيل متاح الآن للدفعة الجديدة',
    badgeEn: 'Registration Now Open for New Batch',
    heroTitleAr: 'أجنحة الطيران',
    heroTitleEn: 'Fly Wings',
    heroSubtitleAr: 'أفضل برامج التدريب على الطيران في المملكة العربية السعودية',
    heroSubtitleEn: 'The best aviation training programs in Saudi Arabia',
    heroVideoUrl: '',
    heroImageUrl: '',
    heroPosterUrl: '',
    heroMediaType: 'video',
    heroAnimatedTextAr: 'الشغف نحو .. الطيران',
    heroAnimatedTextEn: 'Passion for .. Aviation',
  },
  homeAbout: {
    titleAr: 'أجنحة الطيران',
    titleEn: 'Fly Wings',
    subtitleAr: 'في سطور',
    subtitleEn: 'In Brief',
    descriptionAr: 'شركة سعودية رائدة في مجال التدريب على الطيران، تأسست لتكون الخيار الأول للراغبين في تحقيق حلم الطيران.',
    descriptionEn: 'A leading Saudi company in aviation training, established to be the first choice for those who want to achieve their dream of flying.',
    imageUrl: '',
    statsTitleAr: 'الإحصائيات - 2021 - 2025',
    statsTitleEn: 'Statistics - 2021 - 2025',
    statsItems: [
      { id: '1', value: '5,019', labelAr: 'ساعات تدريبية', labelEn: 'Training Hours' },
      { id: '2', value: '1,122', labelAr: 'عضويات صادرة', labelEn: 'Issued Memberships' },
      { id: '3', value: '92,918', labelAr: 'الإقلاع والهبوط', labelEn: 'Takeoffs & Landings' },
      { id: '4', value: '15,219', labelAr: 'رحلات الطيران', labelEn: 'Flight Trips' },
    ],
  },
  stats: {
    graduates: 1500,
    graduatesLabelAr: 'خريج ناجح',
    graduatesLabelEn: 'Successful Graduates',
    years: 15,
    yearsLabelAr: 'سنة خبرة',
    yearsLabelEn: 'Years Experience',
    partners: 25,
    partnersLabelAr: 'شريك تدريبي',
    partnersLabelEn: 'Training Partners',
    successRate: 98,
    successRateLabelAr: 'نسبة النجاح',
    successRateLabelEn: 'Success Rate',
  },
  features: {
    sectionTitleAr: 'لماذا أجنحة الطيران؟',
    sectionTitleEn: 'Why Fly Wings?',
    sectionSubtitleAr: 'نقدم لك تجربة تدريبية استثنائية تجمع بين الجودة والاحترافية',
    sectionSubtitleEn: 'We offer an exceptional training experience combining quality and professionalism',
    items: [
      { id: '1', titleAr: 'معتمد دولياً', titleEn: 'Internationally Certified', descriptionAr: 'شهادات معتمدة من ICAO والهيئة العامة للطيران المدني', descriptionEn: 'Certificates recognized by ICAO and GACA' },
      { id: '2', titleAr: 'مدربين محترفين', titleEn: 'Professional Instructors', descriptionAr: 'نخبة من الكابتنات ذوي الخبرة العالمية', descriptionEn: 'Elite captains with international experience' },
      { id: '3', titleAr: 'تدريب دولي', titleEn: 'International Training', descriptionAr: 'شراكات مع أفضل أكاديميات الطيران العالمية', descriptionEn: 'Partnerships with top global aviation academies' },
      { id: '4', titleAr: 'برامج مرنة', titleEn: 'Flexible Programs', descriptionAr: 'خطط تدريب تناسب جميع المستويات والاحتياجات', descriptionEn: 'Training plans for all levels and needs' },
    ],
  },
  about: {
    heroSubtitleAr: 'رواد التدريب على الطيران في المملكة العربية السعودية',
    heroSubtitleEn: 'Pioneers of Aviation Training in Saudi Arabia',
    contentAr: 'أجنحة الطيران هي شركة سعودية رائدة متخصصة في التدريب على الطيران، تأسست بهدف تقديم برامج تدريبية متكاملة.',
    contentEn: 'Fly Wings is a leading Saudi company specialized in aviation training, established to provide comprehensive training programs.',
    vision2030Ar: 'نساهم في تحقيق رؤية المملكة 2030 من خلال تأهيل كوادر سعودية متخصصة في مجال الطيران.',
    vision2030En: "We contribute to achieving Saudi Arabia's Vision 2030 by qualifying specialized Saudi cadres in the aviation field.",
    visionAr: 'أن نكون الخيار الأول للتدريب على الطيران في المنطقة',
    visionEn: 'To be the first choice for aviation training in the region',
    missionAr: 'تقديم تدريب عالي الجودة يؤهل المتدربين للنجاح في صناعة الطيران',
    missionEn: 'Providing high-quality training that qualifies trainees for success in the aviation industry',
    valuesAr: 'الجودة، السلامة، الاحترافية، والتميز في كل ما نقدمه',
    valuesEn: 'Quality, safety, professionalism, and excellence in everything we do',
    imageUrl: '',
    founderMessageAr: 'نؤمن بأن كل حلم بالطيران يستحق أن يتحقق.',
    founderMessageEn: 'We believe that every dream of flying deserves to come true.',
    founderNameAr: 'الكابتن أحمد الشمري',
    founderNameEn: 'Captain Ahmed Al-Shammari',
    founderTitleAr: 'المؤسس والرئيس التنفيذي',
    founderTitleEn: 'Founder & CEO',
  },
};

const PagesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<PageContent>(defaultPages);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPages({
            home: { ...defaultPages.home, ...data.home },
            homeAbout: { ...defaultPages.homeAbout, ...data.homeAbout },
            stats: { ...defaultPages.stats, ...data.stats },
            features: { ...defaultPages.features, ...data.features },
            about: { ...defaultPages.about, ...data.about },
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
    };
    setPages({
      ...pages,
      features: { ...pages.features, items: [...pages.features.items, newFeature] },
    });
  };

  const removeFeature = (id: string) => {
    setPages({
      ...pages,
      features: { ...pages.features, items: pages.features.items.filter(f => f.id !== id) },
    });
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setPages({
      ...pages,
      features: {
        ...pages.features,
        items: pages.features.items.map(f => f.id === id ? { ...f, [field]: value } : f),
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pages'), {
        ...pages,
        updatedAt: new Date().toISOString(),
      });
      clearDocCache();
      toast({ title: t('تم الحفظ بنجاح', 'Saved successfully') });

    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('محتوى الصفحات', 'Page Content')}</h1>
          <p className="text-muted-foreground">{t('تعديل نصوص الصفحات الرئيسية', 'Edit main page texts')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
        </Button>
      </div>

      <Tabs defaultValue="home">
        <TabsList className="flex-wrap">
          <TabsTrigger value="home" className="gap-2">
            <Home className="w-4 h-4" />
            {t('الرئيسية', 'Home')}
          </TabsTrigger>
          {/* Hidden - managed in separate About Page manager
          <TabsTrigger value="homeAbout" className="gap-2">
            <Info className="w-4 h-4" />
            {t('قسم من نحن', 'About Section')}
          </TabsTrigger>
          */}
          {/* Hidden for now
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('الإحصائيات', 'Stats')}
          </TabsTrigger>
          */}
          <TabsTrigger value="features" className="gap-2">
            <Star className="w-4 h-4" />
            {t('لماذا نحن', 'Why Us')}
          </TabsTrigger>
          {/* Hidden - separate About Page manager exists
          <TabsTrigger value="about" className="gap-2">
            <Info className="w-4 h-4" />
            {t('صفحة من نحن', 'About Page')}
          </TabsTrigger>
          */}
        </TabsList>

        <TabsContent value="home" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('شريط الإعلان', 'Announcement Badge')}</CardTitle>
              <CardDescription>{t('النص الذي يظهر في شريط الإعلان أعلى الصفحة', 'Text shown in announcement badge')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('النص (عربي)', 'Text (Arabic)')}</Label>
                  <Input 
                    value={pages.home.badgeAr} 
                    onChange={e => setPages({...pages, home: {...pages.home, badgeAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('النص (إنجليزي)', 'Text (English)')}</Label>
                  <Input 
                    value={pages.home.badgeEn} 
                    onChange={e => setPages({...pages, home: {...pages.home, badgeEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('قسم الهيرو', 'Hero Section')}</CardTitle>
              <CardDescription>{t('النص الرئيسي في أعلى الصفحة', 'Main text at the top of the page')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('العنوان الرئيسي (عربي)', 'Main Title (Arabic)')}</Label>
                  <Textarea 
                    value={pages.home.heroTitleAr} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroTitleAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('العنوان الرئيسي (إنجليزي)', 'Main Title (English)')}</Label>
                  <Textarea 
                    value={pages.home.heroTitleEn} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroTitleEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                  <Textarea 
                    rows={3}
                    value={pages.home.heroSubtitleAr} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroSubtitleAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                  <Textarea 
                    rows={3}
                    value={pages.home.heroSubtitleEn} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroSubtitleEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>{t('نوع خلفية الهيرو', 'Hero Background Type')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={pages.home.heroMediaType !== 'image' ? 'default' : 'outline'}
                    onClick={() => setPages({...pages, home: {...pages.home, heroMediaType: 'video'}})}
                    className="gap-2 flex-1"
                  >
                    <Video className="w-4 h-4" />
                    {t('فيديو', 'Video')}
                  </Button>
                  <Button
                    type="button"
                    variant={pages.home.heroMediaType === 'image' ? 'default' : 'outline'}
                    onClick={() => setPages({...pages, home: {...pages.home, heroMediaType: 'image'}})}
                    className="gap-2 flex-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {t('صورة', 'Image')}
                  </Button>
                </div>

                {pages.home.heroMediaType === 'image' ? (
                  <>
                    <Label>{t('صورة الخلفية', 'Background Image')}</Label>
                    {pages.home.heroImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden bg-muted">
                        <img
                          src={pages.home.heroImageUrl}
                          alt="Hero"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPages({...pages, home: {...pages.home, heroImageUrl: ''}})}
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            {t('حذف الصورة', 'Remove Image')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {t('لا توجد صورة محددة', 'No image selected')}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={t('أدخل رابط الصورة أو ارفع ملف', 'Enter image URL or upload file')}
                          value={pages.home.heroImageUrl || ''}
                          onChange={e => setPages({...pages, home: {...pages.home, heroImageUrl: e.target.value}})}
                        />
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              toast({
                                title: t('خطأ', 'Error'),
                                description: t('حجم الصورة يجب أن يكون أقل من 10 ميجابايت', 'Image size must be less than 10MB'),
                                variant: 'destructive'
                              });
                              return;
                            }
                            try {
                              toast({ title: t('جاري رفع الصورة...', 'Uploading image...') });
                              const storageRef = ref(storage, `images/hero-${Date.now()}.${file.name.split('.').pop()}`);
                              await uploadBytes(storageRef, await optimizeImage(file));
                              const url = await getDownloadURL(storageRef);
                              setPages({...pages, home: {...pages.home, heroImageUrl: url}});
                              toast({ title: t('تم رفع الصورة بنجاح', 'Image uploaded successfully') });
                            } catch (error) {
                              console.error('Upload error:', error);
                              toast({
                                title: t('خطأ في رفع الصورة', 'Image upload failed'),
                                variant: 'destructive'
                              });
                            }
                          }}
                        />
                        <Button type="button" variant="outline" className="gap-2" asChild>
                          <span>
                            <Upload className="w-4 h-4" />
                            {t('رفع', 'Upload')}
                          </span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('يدعم JPG, PNG, WebP - الحد الأقصى 10 ميجابايت', 'Supports JPG, PNG, WebP - Max 10MB')}
                    </p>
                  </>
                ) : (
                  <>
                    <Label>{t('فيديو الخلفية', 'Background Video')}</Label>
                    {pages.home.heroVideoUrl ? (
                      <div className="relative rounded-xl overflow-hidden bg-muted">
                        <video
                          src={pages.home.heroVideoUrl}
                          className="w-full h-48 object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPages({...pages, home: {...pages.home, heroVideoUrl: ''}})}
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            {t('حذف الفيديو', 'Remove Video')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
                        <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {t('لا يوجد فيديو محدد', 'No video selected')}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={t('أدخل رابط الفيديو أو ارفع ملف', 'Enter video URL or upload file')}
                          value={pages.home.heroVideoUrl || ''}
                          onChange={e => setPages({...pages, home: {...pages.home, heroVideoUrl: e.target.value}})}
                        />
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 100 * 1024 * 1024) {
                              toast({
                                title: t('خطأ', 'Error'),
                                description: t('حجم الفيديو يجب أن يكون أقل من 100 ميجابايت', 'Video size must be less than 100MB'),
                                variant: 'destructive'
                              });
                              return;
                            }
                            try {
                              toast({ title: t('جاري رفع الفيديو...', 'Uploading video...') });
                              const storageRef = ref(storage, `videos/hero-${Date.now()}.${file.name.split('.').pop()}`);
                              await uploadBytes(storageRef, await optimizeImage(file));
                              const url = await getDownloadURL(storageRef);
                              setPages({...pages, home: {...pages.home, heroVideoUrl: url}});
                              toast({ title: t('تم رفع الفيديو بنجاح', 'Video uploaded successfully') });
                            } catch (error) {
                              console.error('Upload error:', error);
                              toast({
                                title: t('خطأ في رفع الفيديو', 'Video upload failed'),
                                variant: 'destructive'
                              });
                            }
                          }}
                        />
                        <Button type="button" variant="outline" className="gap-2" asChild>
                          <span>
                            <Upload className="w-4 h-4" />
                            {t('رفع', 'Upload')}
                          </span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('يدعم MP4, WebM, OGG - الحد الأقصى 100 ميجابايت', 'Supports MP4, WebM, OGG - Max 100MB')}
                    </p>

                    <div className="pt-4 space-y-3 border-t">
                      <Label>{t('صورة غلاف الفيديو (تظهر فورًا قبل تشغيل الفيديو)', 'Video poster image (shown instantly before the video)')}</Label>
                      {pages.home.heroPosterUrl && (
                        <div className="relative rounded-xl overflow-hidden bg-muted">
                          <img src={pages.home.heroPosterUrl} alt="Poster" className="w-full h-40 object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setPages({...pages, home: {...pages.home, heroPosterUrl: ''}})}
                              className="gap-2"
                            >
                              <X className="w-4 h-4" />
                              {t('حذف الغلاف', 'Remove poster')}
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder={t('رابط صورة الغلاف أو ارفع ملف', 'Poster image URL or upload a file')}
                            value={pages.home.heroPosterUrl || ''}
                            onChange={e => setPages({...pages, home: {...pages.home, heroPosterUrl: e.target.value}})}
                          />
                        </div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                toast({ title: t('جاري رفع الغلاف...', 'Uploading poster...') });
                                const storageRef = ref(storage, `images/hero-poster-${Date.now()}.webp`);
                                await uploadBytes(storageRef, await optimizeImage(file));
                                const url = await getDownloadURL(storageRef);
                                setPages({...pages, home: {...pages.home, heroPosterUrl: url}});
                                toast({ title: t('تم رفع الغلاف بنجاح', 'Poster uploaded successfully') });
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast({ title: t('خطأ في رفع الغلاف', 'Poster upload failed'), variant: 'destructive' });
                              }
                            }}
                          />
                          <Button type="button" variant="outline" className="gap-2" asChild>
                            <span>
                              <Upload className="w-4 h-4" />
                              {t('رفع', 'Upload')}
                            </span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('تُستخدم كخلفية فورية وتسرّع ظهور الصفحة على الجوال والاتصالات البطيئة.', 'Used as the instant background and speeds up mobile and slow connections.')}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('النص المتحرك (عربي)', 'Animated Text (Arabic)')}</Label>
                  <Input 
                    value={pages.home.heroAnimatedTextAr || ''} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroAnimatedTextAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('النص المتحرك (إنجليزي)', 'Animated Text (English)')}</Label>
                  <Input 
                    value={pages.home.heroAnimatedTextEn || ''} 
                    onChange={e => setPages({...pages, home: {...pages.home, heroAnimatedTextEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hidden - managed in separate About Page manager
        <TabsContent value="homeAbout" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('قسم من نحن في الصفحة الرئيسية', 'About Section on Homepage')}</CardTitle>
              <CardDescription>{t('يظهر هذا القسم في الصفحة الرئيسية مع زر اقرأ المزيد', 'This section appears on homepage with Read More button')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                  <Input value={pages.homeAbout.titleAr} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, titleAr: e.target.value}})} />
                </div>
                <div>
                  <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                  <Input value={pages.homeAbout.titleEn} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, titleEn: e.target.value}})} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('العنوان الفرعي (عربي)', 'Subtitle (Arabic)')}</Label>
                  <Input value={pages.homeAbout.subtitleAr} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, subtitleAr: e.target.value}})} />
                </div>
                <div>
                  <Label>{t('العنوان الفرعي (إنجليزي)', 'Subtitle (English)')}</Label>
                  <Input value={pages.homeAbout.subtitleEn} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, subtitleEn: e.target.value}})} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                  <Textarea rows={4} value={pages.homeAbout.descriptionAr} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, descriptionAr: e.target.value}})} />
                </div>
                <div>
                  <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                  <Textarea rows={4} value={pages.homeAbout.descriptionEn} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, descriptionEn: e.target.value}})} />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>{t('صورة الطائرة / خلفية القسم', 'Plane Image / Section Background')}</Label>
                
                {pages.homeAbout.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={pages.homeAbout.imageUrl} 
                      alt="About section background"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPages({...pages, homeAbout: {...pages.homeAbout, imageUrl: ''}})}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        {t('حذف الصورة', 'Remove Image')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('لا توجد صورة محددة', 'No image selected')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder={t('أدخل رابط الصورة أو ارفع ملف', 'Enter image URL or upload file')}
                      value={pages.homeAbout.imageUrl || ''} 
                      onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, imageUrl: e.target.value}})} 
                    />
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          toast({ title: t('جاري رفع الصورة...', 'Uploading image...') });
                          const storageRef = ref(storage, `pages/home-about-${Date.now()}-${file.name}`);
                          await uploadBytes(storageRef, await optimizeImage(file));
                          const url = await getDownloadURL(storageRef);
                          setPages({...pages, homeAbout: {...pages.homeAbout, imageUrl: url}});
                          toast({ title: t('تم رفع الصورة بنجاح', 'Image uploaded successfully') });
                        } catch (error) {
                          console.error('Error uploading:', error);
                          toast({ title: t('خطأ في رفع الصورة', 'Error uploading image'), variant: 'destructive' });
                        }
                      }}
                    />
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                        {t('رفع صورة', 'Upload Image')}
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('هذه الصورة ستظهر كخلفية في قسم "أجنحة الطيران في سطور" في الصفحة الرئيسية', 'This image will appear as background in the "Fly Wings In Brief" section on homepage')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('إحصائيات القسم', 'Section Statistics')}</CardTitle>
              <CardDescription>{t('الإحصائيات التي تظهر في قسم من نحن', 'Statistics shown in About section')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div>
                  <Label>{t('عنوان الإحصائيات (عربي)', 'Stats Title (Arabic)')}</Label>
                  <Input value={pages.homeAbout.statsTitleAr} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, statsTitleAr: e.target.value}})} />
                </div>
                <div>
                  <Label>{t('عنوان الإحصائيات (إنجليزي)', 'Stats Title (English)')}</Label>
                  <Input value={pages.homeAbout.statsTitleEn} onChange={e => setPages({...pages, homeAbout: {...pages.homeAbout, statsTitleEn: e.target.value}})} />
                </div>
              </div>
              
              <div className="space-y-3">
                {(pages.homeAbout.statsItems || []).map((stat, index) => (
                  <div key={stat.id} className="grid md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl relative group">
                    <div>
                      <Label>{t(`القيمة ${index + 1}`, `Value ${index + 1}`)}</Label>
                      <Input 
                        value={stat.value} 
                        onChange={e => {
                          const newItems = [...(pages.homeAbout.statsItems || [])];
                          newItems[index] = { ...newItems[index], value: e.target.value };
                          setPages({...pages, homeAbout: {...pages.homeAbout, statsItems: newItems}});
                        }} 
                      />
                    </div>
                    <div>
                      <Label>{t('التسمية (عربي)', 'Label (Arabic)')}</Label>
                      <Input 
                        value={stat.labelAr} 
                        onChange={e => {
                          const newItems = [...(pages.homeAbout.statsItems || [])];
                          newItems[index] = { ...newItems[index], labelAr: e.target.value };
                          setPages({...pages, homeAbout: {...pages.homeAbout, statsItems: newItems}});
                        }} 
                      />
                    </div>
                    <div>
                      <Label>{t('التسمية (إنجليزي)', 'Label (English)')}</Label>
                      <Input 
                        value={stat.labelEn} 
                        onChange={e => {
                          const newItems = [...(pages.homeAbout.statsItems || [])];
                          newItems[index] = { ...newItems[index], labelEn: e.target.value };
                          setPages({...pages, homeAbout: {...pages.homeAbout, statsItems: newItems}});
                        }} 
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={() => {
                          const newItems = (pages.homeAbout.statsItems || []).filter((_, i) => i !== index);
                          setPages({...pages, homeAbout: {...pages.homeAbout, statsItems: newItems}});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full gap-2 border-dashed"
                onClick={() => {
                  const newItem = { 
                    id: Date.now().toString(), 
                    value: '', 
                    labelAr: '', 
                    labelEn: '' 
                  };
                  setPages({
                    ...pages, 
                    homeAbout: {
                      ...pages.homeAbout, 
                      statsItems: [...(pages.homeAbout.statsItems || []), newItem]
                    }
                  });
                }}
              >
                <Plus className="w-4 h-4" />
                {t('إضافة إحصائية جديدة', 'Add New Statistic')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        */}

        {/* Hidden for now - Stats TabsContent
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('الإحصائيات', 'Statistics')}</CardTitle>
              <CardDescription>{t('الأرقام والإحصائيات التي تظهر في الصفحة الرئيسية', 'Numbers shown on the home page')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>{t('عدد الخريجين', 'Graduates Count')}</Label>
                  <Input 
                    type="number"
                    value={pages.stats.graduates} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, graduates: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (عربي)', 'Label (Arabic)')}</Label>
                  <Input 
                    value={pages.stats.graduatesLabelAr} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, graduatesLabelAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (إنجليزي)', 'Label (English)')}</Label>
                  <Input 
                    value={pages.stats.graduatesLabelEn} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, graduatesLabelEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>{t('سنوات الخبرة', 'Years of Experience')}</Label>
                  <Input 
                    type="number"
                    value={pages.stats.years} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, years: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (عربي)', 'Label (Arabic)')}</Label>
                  <Input 
                    value={pages.stats.yearsLabelAr} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, yearsLabelAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (إنجليزي)', 'Label (English)')}</Label>
                  <Input 
                    value={pages.stats.yearsLabelEn} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, yearsLabelEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>{t('عدد الشركاء', 'Partners Count')}</Label>
                  <Input 
                    type="number"
                    value={pages.stats.partners} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, partners: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (عربي)', 'Label (Arabic)')}</Label>
                  <Input 
                    value={pages.stats.partnersLabelAr} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, partnersLabelAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (إنجليزي)', 'Label (English)')}</Label>
                  <Input 
                    value={pages.stats.partnersLabelEn} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, partnersLabelEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>{t('نسبة النجاح %', 'Success Rate %')}</Label>
                  <Input 
                    type="number"
                    value={pages.stats.successRate} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, successRate: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (عربي)', 'Label (Arabic)')}</Label>
                  <Input 
                    value={pages.stats.successRateLabelAr} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, successRateLabelAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('التسمية (إنجليزي)', 'Label (English)')}</Label>
                  <Input 
                    value={pages.stats.successRateLabelEn} 
                    onChange={e => setPages({...pages, stats: {...pages.stats, successRateLabelEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        */}

        <TabsContent value="features" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('عناوين القسم', 'Section Headers')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                  <Input 
                    value={pages.features.sectionTitleAr} 
                    onChange={e => setPages({...pages, features: {...pages.features, sectionTitleAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                  <Input 
                    value={pages.features.sectionTitleEn} 
                    onChange={e => setPages({...pages, features: {...pages.features, sectionTitleEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('الوصف (عربي)', 'Subtitle (Arabic)')}</Label>
                  <Textarea 
                    value={pages.features.sectionSubtitleAr} 
                    onChange={e => setPages({...pages, features: {...pages.features, sectionSubtitleAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('الوصف (إنجليزي)', 'Subtitle (English)')}</Label>
                  <Textarea 
                    value={pages.features.sectionSubtitleEn} 
                    onChange={e => setPages({...pages, features: {...pages.features, sectionSubtitleEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('المميزات', 'Features')}</CardTitle>
                <CardDescription>{t('أضف وعدل المميزات التي تظهر في الصفحة الرئيسية', 'Add and edit features shown on home page')}</CardDescription>
              </div>
              <Button onClick={addFeature} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t('إضافة', 'Add')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {pages.features.items.map((feature, index) => (
                <div key={feature.id} className="p-4 bg-muted/50 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{t('الميزة', 'Feature')} {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFeature(feature.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                      <Input 
                        value={feature.titleAr} 
                        onChange={e => updateFeature(feature.id, 'titleAr', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                      <Input 
                        value={feature.titleEn} 
                        onChange={e => updateFeature(feature.id, 'titleEn', e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                      <Textarea 
                        value={feature.descriptionAr} 
                        onChange={e => updateFeature(feature.id, 'descriptionAr', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                      <Textarea 
                        value={feature.descriptionEn} 
                        onChange={e => updateFeature(feature.id, 'descriptionEn', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hidden - separate About Page manager exists
        <TabsContent value="about" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('عنوان الصفحة', 'Page Header')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('العنوان الفرعي (عربي)', 'Subtitle (Arabic)')}</Label>
                  <Input 
                    value={pages.about.heroSubtitleAr} 
                    onChange={e => setPages({...pages, about: {...pages.about, heroSubtitleAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('العنوان الفرعي (إنجليزي)', 'Subtitle (English)')}</Label>
                  <Input 
                    value={pages.about.heroSubtitleEn} 
                    onChange={e => setPages({...pages, about: {...pages.about, heroSubtitleEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('المحتوى الرئيسي', 'Main Content')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
                  <RichTextEditor
                    value={pages.about.contentAr}
                    onChange={val => setPages({...pages, about: {...pages.about, contentAr: val}})}
                    dir="rtl"
                    minHeight="260px"
                  />
                </div>
                <div>
                  <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
                  <RichTextEditor
                    value={pages.about.contentEn}
                    onChange={val => setPages({...pages, about: {...pages.about, contentEn: val}})}
                    dir="ltr"
                    minHeight="260px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('رؤية 2030', 'Vision 2030')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('النص (عربي)', 'Text (Arabic)')}</Label>
                  <Textarea 
                    rows={3}
                    value={pages.about.vision2030Ar} 
                    onChange={e => setPages({...pages, about: {...pages.about, vision2030Ar: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('النص (إنجليزي)', 'Text (English)')}</Label>
                  <Textarea 
                    rows={3}
                    value={pages.about.vision2030En} 
                    onChange={e => setPages({...pages, about: {...pages.about, vision2030En: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('الرؤية والرسالة والقيم', 'Vision, Mission & Values')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('رؤيتنا (عربي)', 'Our Vision (Arabic)')}</Label>
                  <Textarea 
                    value={pages.about.visionAr} 
                    onChange={e => setPages({...pages, about: {...pages.about, visionAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('رؤيتنا (إنجليزي)', 'Our Vision (English)')}</Label>
                  <Textarea 
                    value={pages.about.visionEn} 
                    onChange={e => setPages({...pages, about: {...pages.about, visionEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('رسالتنا (عربي)', 'Our Mission (Arabic)')}</Label>
                  <Textarea 
                    value={pages.about.missionAr} 
                    onChange={e => setPages({...pages, about: {...pages.about, missionAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('رسالتنا (إنجليزي)', 'Our Mission (English)')}</Label>
                  <Textarea 
                    value={pages.about.missionEn} 
                    onChange={e => setPages({...pages, about: {...pages.about, missionEn: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('قيمنا (عربي)', 'Our Values (Arabic)')}</Label>
                  <Textarea 
                    value={pages.about.valuesAr} 
                    onChange={e => setPages({...pages, about: {...pages.about, valuesAr: e.target.value}})} 
                  />
                </div>
                <div>
                  <Label>{t('قيمنا (إنجليزي)', 'Our Values (English)')}</Label>
                  <Textarea 
                    value={pages.about.valuesEn} 
                    onChange={e => setPages({...pages, about: {...pages.about, valuesEn: e.target.value}})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        */}
      </Tabs>
    </div>
  );
};

export default PagesManager;
