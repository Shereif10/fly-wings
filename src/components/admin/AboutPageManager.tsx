import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';

interface Goal {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
}

interface CustomSection {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  bgColor: 'default' | 'muted' | 'primary';
  order: number;
}

interface AboutPageContent {
  mainTitleAr: string;
  mainTitleEn: string;
  paragraph1Ar: string;
  paragraph1En: string;
  paragraph2Ar: string;
  paragraph2En: string;
  paragraph3Ar: string;
  paragraph3En: string;
  paragraph4Ar: string;
  paragraph4En: string;
  visionTitleAr: string;
  visionTitleEn: string;
  visionAr: string;
  visionEn: string;
  missionTitleAr: string;
  missionTitleEn: string;
  missionAr: string;
  missionEn: string;
  messageTitleAr: string;
  messageTitleEn: string;
  messageAr: string;
  messageEn: string;
  goalsSectionTitleAr: string;
  goalsSectionTitleEn: string;
  goalsSectionSubtitleAr: string;
  goalsSectionSubtitleEn: string;
  goals: Goal[];
  customSections: CustomSection[];
  imageUrl: string;
}

const defaultContent: AboutPageContent = {
  mainTitleAr: 'ما هي أجنحة الطيران؟',
  mainTitleEn: 'What is Fly Wings?',
  paragraph1Ar: 'أجنحة الطيران هي شركة سعودية أسست بهدف توفير حلول لتدريب الطيران بأقل التكاليف داخل السعودية وخارجها ويأتي ذلك عن طريق الإشراف والمتابعة الحثيثة مع اكثر من 100 مركز تدريب طيران حول العالم، ليصبح مجال دراسة الطيران مجال في متناول كل محب وهاوِ، لا سيما أن هذا المجال بدأ بالتنامي في السعودية بوتيرة متسارعة انطلاقاً من رؤية 2030، ولنسهم بذلك في أن يكونوا ابنائنا وبناتنا الطيارين السعوديين هم المستفيد الأول من نمو سوق الطيران في المملكة.',
  paragraph1En: 'Fly Wings is a Saudi company founded to provide aviation training solutions at the lowest costs inside and outside Saudi Arabia through supervision and close follow-up with more than 100 aviation training centers around the world.',
  paragraph2Ar: '',
  paragraph2En: '',
  paragraph3Ar: '',
  paragraph3En: '',
  paragraph4Ar: '',
  paragraph4En: '',
  visionTitleAr: 'الرؤية',
  visionTitleEn: 'Vision',
  visionAr: 'أن نكون الخيار الأول والرائد في تدريب الطيران بالمملكة العربية السعودية.',
  visionEn: 'To be the first choice and leader in aviation training in Saudi Arabia.',
  missionTitleAr: 'المهام',
  missionTitleEn: 'Tasks',
  missionAr: 'تقديم برامج تدريب طيران عالية الجودة.',
  missionEn: 'Providing high-quality aviation training programs.',
  messageTitleAr: 'الرسالة',
  messageTitleEn: 'Message',
  messageAr: 'تسعى أجنحة الطيران إلى تبادل المعرفة العلمية المتعلقة بالطيران.',
  messageEn: 'Fly Wings seeks to share scientific knowledge related to aviation.',
  goalsSectionTitleAr: 'الأهداف',
  goalsSectionTitleEn: 'Goals',
  goalsSectionSubtitleAr: 'هدفنا هو تنمية شغف الطيران في السماء إلى الأفضل',
  goalsSectionSubtitleEn: 'Our goal is to develop the passion for flying to the best',
  goals: [
    { id: '1', titleAr: 'توفير', titleEn: 'Providing', descriptionAr: 'التدريب الشامل في قطاع الطيران والعلوم المرتبطة به.', descriptionEn: 'Comprehensive training in the aviation sector.', icon: 'GraduationCap' },
    { id: '2', titleAr: 'رعاية', titleEn: 'Nurturing', descriptionAr: 'وتنمية المواهب في مجال الطيران.', descriptionEn: 'Developing talents in aviation.', icon: 'Users' },
    { id: '3', titleAr: 'التعاون', titleEn: 'Collaboration', descriptionAr: 'مع المؤسسات التعليمية والفنية المتخصصة.', descriptionEn: 'With educational institutions.', icon: 'Building2' },
    { id: '4', titleAr: 'تنظيم', titleEn: 'Organizing', descriptionAr: 'الندوات وورش العمل في مجال الطيران.', descriptionEn: 'Seminars and workshops.', icon: 'Calendar' },
    { id: '5', titleAr: 'استضافة', titleEn: 'Hosting', descriptionAr: 'معارض وفعاليات ومسابقات طيران متنوعة.', descriptionEn: 'Aviation events and competitions.', icon: 'Trophy' },
    { id: '6', titleAr: 'تعزيز', titleEn: 'Enhancing', descriptionAr: 'المشاركة لتمثيل المملكة دولياً.', descriptionEn: 'International representation.', icon: 'Globe2' },
    { id: '7', titleAr: 'إقامة', titleEn: 'Establishing', descriptionAr: 'شراكات استراتيجية مع شركات الطيران.', descriptionEn: 'Strategic partnerships.', icon: 'Handshake' },
  ],
  customSections: [],
  imageUrl: '',
};

const bgColorOptions = [
  { value: 'default', label: 'أبيض / White' },
  { value: 'muted', label: 'رمادي / Gray' },
  { value: 'primary', label: 'أساسي / Primary' },
];

const iconOptions = [
  { value: 'GraduationCap', label: 'تخرج / Graduation' },
  { value: 'Users', label: 'مستخدمين / Users' },
  { value: 'Building2', label: 'مبنى / Building' },
  { value: 'Calendar', label: 'تقويم / Calendar' },
  { value: 'Trophy', label: 'كأس / Trophy' },
  { value: 'Globe2', label: 'عالمي / Globe' },
  { value: 'Handshake', label: 'شراكة / Handshake' },
];

const AboutPageManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<AboutPageContent>(defaultContent);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().aboutPage) {
          setContent({ ...defaultContent, ...docSnap.data().aboutPage });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'pages');
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(docRef, {
        ...existingData,
        aboutPage: content,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: t('تم الحفظ بنجاح', 'Saved successfully') });
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
      icon: 'GraduationCap',
    };
    setContent({ ...content, goals: [...content.goals, newGoal] });
  };

  const removeGoal = (id: string) => {
    setContent({ ...content, goals: content.goals.filter(g => g.id !== id) });
  };

  const updateGoal = (id: string, field: keyof Goal, value: string) => {
    setContent({
      ...content,
      goals: content.goals.map(g => g.id === id ? { ...g, [field]: value } : g),
    });
  };

  // Custom Sections Functions
  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: Date.now().toString(),
      titleAr: '',
      titleEn: '',
      contentAr: '',
      contentEn: '',
      bgColor: 'default',
      order: (content.customSections?.length || 0) + 1,
    };
    setContent({ ...content, customSections: [...(content.customSections || []), newSection] });
  };

  const removeCustomSection = (id: string) => {
    setContent({ 
      ...content, 
      customSections: (content.customSections || []).filter(s => s.id !== id) 
    });
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: string | number) => {
    setContent({
      ...content,
      customSections: (content.customSections || []).map(s => 
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sections = [...(content.customSections || [])];
    const index = sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    
    // Update order numbers
    sections.forEach((s, i) => s.order = i + 1);
    setContent({ ...content, customSections: sections });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('صفحة من نحن', 'About Page')}</h1>
          <p className="text-muted-foreground">{t('تعديل محتوى صفحة من نحن', 'Edit about page content')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
        </Button>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('قسم المقدمة', 'Hero Section')}</CardTitle>
          <CardDescription>{t('العنوان والفقرات الرئيسية', 'Main title and paragraphs')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('العنوان الرئيسي (عربي)', 'Main Title (Arabic)')}</Label>
              <Input 
                value={content.mainTitleAr} 
                onChange={e => setContent({...content, mainTitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('العنوان الرئيسي (إنجليزي)', 'Main Title (English)')}</Label>
              <Input 
                value={content.mainTitleEn} 
                onChange={e => setContent({...content, mainTitleEn: e.target.value})} 
              />
            </div>
          </div>

          {[1, 2, 3, 4].map(num => (
            <div key={num} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t(`الفقرة ${num} (عربي)`, `Paragraph ${num} (Arabic)`)}</Label>
                <Textarea 
                  rows={3}
                  value={(content as any)[`paragraph${num}Ar`]} 
                  onChange={e => setContent({...content, [`paragraph${num}Ar`]: e.target.value})} 
                />
              </div>
              <div>
                <Label>{t(`الفقرة ${num} (إنجليزي)`, `Paragraph ${num} (English)`)}</Label>
                <Textarea 
                  rows={3}
                  value={(content as any)[`paragraph${num}En`]} 
                  onChange={e => setContent({...content, [`paragraph${num}En`]: e.target.value})} 
                />
              </div>
            </div>
          ))}

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>{t('صورة الصفحة', 'Page Image')}</Label>
            
            {content.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-muted">
                <img 
                  src={content.imageUrl} 
                  alt="About page"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setContent({...content, imageUrl: ''})}
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
                  value={content.imageUrl || ''} 
                  onChange={e => setContent({...content, imageUrl: e.target.value})} 
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
                      const storageRef = ref(storage, `pages/about-${Date.now()}-${file.name}`);
                      await uploadBytes(storageRef, await optimizeImage(file));
                      const url = await getDownloadURL(storageRef);
                      setContent({...content, imageUrl: url});
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
          </div>
        </CardContent>
      </Card>

      {/* Vision Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('قسم الرؤية', 'Vision Section')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('عنوان الرؤية (عربي)', 'Vision Title (Arabic)')}</Label>
              <Input 
                value={content.visionTitleAr} 
                onChange={e => setContent({...content, visionTitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('عنوان الرؤية (إنجليزي)', 'Vision Title (English)')}</Label>
              <Input 
                value={content.visionTitleEn} 
                onChange={e => setContent({...content, visionTitleEn: e.target.value})} 
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('نص الرؤية (عربي)', 'Vision Text (Arabic)')}</Label>
              <Textarea 
                rows={4}
                value={content.visionAr} 
                onChange={e => setContent({...content, visionAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('نص الرؤية (إنجليزي)', 'Vision Text (English)')}</Label>
              <Textarea 
                rows={4}
                value={content.visionEn} 
                onChange={e => setContent({...content, visionEn: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('قسم المهام', 'Tasks Section')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('عنوان المهام (عربي)', 'Tasks Title (Arabic)')}</Label>
              <Input 
                value={content.missionTitleAr} 
                onChange={e => setContent({...content, missionTitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('عنوان المهام (إنجليزي)', 'Tasks Title (English)')}</Label>
              <Input 
                value={content.missionTitleEn} 
                onChange={e => setContent({...content, missionTitleEn: e.target.value})} 
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('نص المهام (عربي)', 'Tasks Text (Arabic)')}</Label>
              <Textarea 
                rows={4}
                value={content.missionAr} 
                onChange={e => setContent({...content, missionAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('نص المهام (إنجليزي)', 'Tasks Text (English)')}</Label>
              <Textarea 
                rows={4}
                value={content.missionEn} 
                onChange={e => setContent({...content, missionEn: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('قسم الرسالة', 'Message Section')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('عنوان الرسالة (عربي)', 'Message Title (Arabic)')}</Label>
              <Input 
                value={content.messageTitleAr} 
                onChange={e => setContent({...content, messageTitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('عنوان الرسالة (إنجليزي)', 'Message Title (English)')}</Label>
              <Input 
                value={content.messageTitleEn} 
                onChange={e => setContent({...content, messageTitleEn: e.target.value})} 
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('نص الرسالة (عربي)', 'Message Text (Arabic)')}</Label>
              <Textarea 
                rows={4}
                value={content.messageAr} 
                onChange={e => setContent({...content, messageAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('نص الرسالة (إنجليزي)', 'Message Text (English)')}</Label>
              <Textarea 
                rows={4}
                value={content.messageEn} 
                onChange={e => setContent({...content, messageEn: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('قسم الأهداف', 'Goals Section')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('عنوان القسم (عربي)', 'Section Title (Arabic)')}</Label>
              <Input 
                value={content.goalsSectionTitleAr} 
                onChange={e => setContent({...content, goalsSectionTitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('عنوان القسم (إنجليزي)', 'Section Title (English)')}</Label>
              <Input 
                value={content.goalsSectionTitleEn} 
                onChange={e => setContent({...content, goalsSectionTitleEn: e.target.value})} 
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('العنوان الفرعي (عربي)', 'Subtitle (Arabic)')}</Label>
              <Input 
                value={content.goalsSectionSubtitleAr} 
                onChange={e => setContent({...content, goalsSectionSubtitleAr: e.target.value})} 
              />
            </div>
            <div>
              <Label>{t('العنوان الفرعي (إنجليزي)', 'Subtitle (English)')}</Label>
              <Input 
                value={content.goalsSectionSubtitleEn} 
                onChange={e => setContent({...content, goalsSectionSubtitleEn: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('الأهداف', 'Goals')}</CardTitle>
            <CardDescription>{t('أضف وعدل الأهداف', 'Add and edit goals')}</CardDescription>
          </div>
          <Button onClick={addGoal} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('إضافة هدف', 'Add Goal')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.goals.map((goal, index) => (
            <div key={goal.id} className="p-4 bg-muted/50 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{t('الهدف', 'Goal')} {index + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>{t('الأيقونة', 'Icon')}</Label>
                  <Select value={goal.icon} onValueChange={v => updateGoal(goal.id, 'icon', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                  <Input 
                    value={goal.titleAr} 
                    onChange={e => updateGoal(goal.id, 'titleAr', e.target.value)} 
                  />
                </div>
                <div>
                  <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                  <Input 
                    value={goal.titleEn} 
                    onChange={e => updateGoal(goal.id, 'titleEn', e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                  <Textarea 
                    value={goal.descriptionAr} 
                    onChange={e => updateGoal(goal.id, 'descriptionAr', e.target.value)} 
                  />
                </div>
                <div>
                  <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                  <Textarea 
                    value={goal.descriptionEn} 
                    onChange={e => updateGoal(goal.id, 'descriptionEn', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          ))}

          {content.goals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('لا توجد أهداف. اضغط على "إضافة هدف" لإنشاء هدف جديد.', 'No goals yet. Click "Add Goal" to create one.')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('أقسام إضافية', 'Custom Sections')}</CardTitle>
            <CardDescription>{t('أضف أقسام مخصصة لصفحة من نحن', 'Add custom sections to the about page')}</CardDescription>
          </div>
          <Button onClick={addCustomSection} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('إضافة قسم', 'Add Section')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(content.customSections || []).map((section, index) => (
            <div key={section.id} className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{t('القسم', 'Section')} {index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === (content.customSections?.length || 0) - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeCustomSection(section.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>{t('لون الخلفية', 'Background Color')}</Label>
                  <Select 
                    value={section.bgColor} 
                    onValueChange={v => updateCustomSection(section.id, 'bgColor', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bgColorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                  <Input 
                    value={section.titleAr} 
                    onChange={e => updateCustomSection(section.id, 'titleAr', e.target.value)} 
                  />
                </div>
                <div>
                  <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                  <Input 
                    value={section.titleEn} 
                    onChange={e => updateCustomSection(section.id, 'titleEn', e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
                  <Textarea 
                    rows={4}
                    value={section.contentAr} 
                    onChange={e => updateCustomSection(section.id, 'contentAr', e.target.value)} 
                  />
                </div>
                <div>
                  <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
                  <Textarea 
                    rows={4}
                    value={section.contentEn} 
                    onChange={e => updateCustomSection(section.id, 'contentEn', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          ))}

          {(!content.customSections || content.customSections.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              {t('لا توجد أقسام إضافية. اضغط على "إضافة قسم" لإنشاء قسم جديد.', 'No custom sections yet. Click "Add Section" to create one.')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPageManager;
