import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Save, Phone, Mail, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Plane, LayoutGrid, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clearDocCache } from '@/lib/firestoreCache';

import ImageUpload from './ImageUpload';

// Social media platforms list
const socialPlatforms = [
  { id: 'discord', name: 'Discord', color: '#5865F2' },
  { id: 'telegram', name: 'Telegram', color: '#0088cc' },
  { id: 'whatsapp_channel', name: 'WhatsApp Channel', color: '#25D366' },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500' },
  { id: 'tumblr', name: 'Tumblr', color: '#36465D' },
  { id: 'vimeo', name: 'Vimeo', color: '#1AB7EA' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF' },
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' },
  { id: 'behance', name: 'Behance', color: '#1769FF' },
  { id: 'dribbble', name: 'Dribbble', color: '#EA4C89' },
  { id: 'github', name: 'GitHub', color: '#333333' },
  { id: 'medium', name: 'Medium', color: '#000000' },
  { id: 'quora', name: 'Quora', color: '#B92B27' },
  { id: 'weibo', name: 'Weibo', color: '#DF2029' },
  { id: 'wechat', name: 'WeChat', color: '#7BB32E' },
  { id: 'line', name: 'LINE', color: '#00C300' },
  { id: 'viber', name: 'Viber', color: '#7360F2' },
  { id: 'skype', name: 'Skype', color: '#00AFF0' },
  { id: 'slack', name: 'Slack', color: '#4A154B' },
  { id: 'threads', name: 'Threads', color: '#000000' },
  { id: 'clubhouse', name: 'Clubhouse', color: '#F2E8CF' },
  { id: 'mastodon', name: 'Mastodon', color: '#6364FF' },
  { id: 'bluesky', name: 'Bluesky', color: '#0085FF' },
];

interface OtherSocialLink {
  platform: string;
  url: string;
}

const SettingsManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    phone: '920002936',
    email: 'info@bflywings.com',
    whatsapp: '920002936',
    addressAr: 'المملكة العربية السعودية',
    addressEn: 'Saudi Arabia',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    snapchat: '',
    otherSocialLinks: [] as OtherSocialLink[],
    metaTitleAr: 'أجنحة الطيران - للتدريب على الطيران',
    metaTitleEn: 'Fly Wings - Aviation Training',
    metaDescriptionAr: 'أفضل برامج التدريب على الطيران في المملكة العربية السعودية',
    metaDescriptionEn: 'The best aviation training programs in Saudi Arabia',
    planeImageUrl: '',
    // Per-page hero images
    heroImageAbout: '',
    heroImageJourney: '',
    heroImageBoardMembers: '',
    heroImageTrainingTeam: '',
    heroImagePackages: '',
    heroImageGraduates: '',
    heroImageNews: '',
    heroImageGallery: '',
    heroImageFAQ: '',
    heroImageContact: '',
    heroImageBlog: '',
    heroImageActivities: '',
    heroImageVision: '',
    // Section visibility toggles
    showActivitiesSection: true,
    showGraduatesSection: true,
    showPartnersSection: true,
    showTrainingProgramsSection: true,
    showTrainingTeamSection: true,
  });

  const addOtherSocialLink = () => {
    setSettings({
      ...settings,
      otherSocialLinks: [...settings.otherSocialLinks, { platform: '', url: '' }]
    });
  };

  const removeOtherSocialLink = (index: number) => {
    const newLinks = settings.otherSocialLinks.filter((_, i) => i !== index);
    setSettings({ ...settings, otherSocialLinks: newLinks });
  };

  const updateOtherSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...settings.otherSocialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSettings({ ...settings, otherSocialLinks: newLinks });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...settings, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'general'), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      clearDocCache();
      toast({ title: t('تم الحفظ', 'Settings saved successfully') });

    } catch (error) {
      toast({ title: t('خطأ', 'Error saving settings'), variant: 'destructive' });
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
          <h1 className="text-2xl font-bold text-foreground">{t('الإعدادات', 'Settings')}</h1>
          <p className="text-muted-foreground">{t('إعدادات الموقع العامة', 'General site settings')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              {t('معلومات التواصل', 'Contact Information')}
            </CardTitle>
            <CardDescription>{t('بيانات التواصل الظاهرة في الموقع', 'Contact details shown on the website')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('رقم الهاتف', 'Phone Number')}</Label>
              <Input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} dir="ltr" />
            </div>
            <div>
              <Label>{t('البريد الإلكتروني', 'Email')}</Label>
              <Input value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} dir="ltr" />
            </div>
            <div>
              <Label>{t('واتساب', 'WhatsApp')}</Label>
              <Input value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} dir="ltr" />
            </div>
            <div>
              <Label>{t('العنوان (عربي)', 'Address (Arabic)')}</Label>
              <Input value={settings.addressAr} onChange={e => setSettings({...settings, addressAr: e.target.value})} />
            </div>
            <div>
              <Label>{t('العنوان (إنجليزي)', 'Address (English)')}</Label>
              <Input value={settings.addressEn} onChange={e => setSettings({...settings, addressEn: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t('وسائل التواصل الاجتماعي', 'Social Media')}
            </CardTitle>
            <CardDescription>{t('روابط حسابات التواصل الاجتماعي', 'Social media account links')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Social Media Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-blue-600 shrink-0" />
                <Input value={settings.facebook} onChange={e => setSettings({...settings, facebook: e.target.value})} placeholder="https://facebook.com/..." dir="ltr" />
              </div>
              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-sky-500 shrink-0" />
                <Input value={settings.twitter} onChange={e => setSettings({...settings, twitter: e.target.value})} placeholder="https://twitter.com/..." dir="ltr" />
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-600 shrink-0" />
                <Input value={settings.instagram} onChange={e => setSettings({...settings, instagram: e.target.value})} placeholder="https://instagram.com/..." dir="ltr" />
              </div>
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-blue-700 shrink-0" />
                <Input value={settings.linkedin} onChange={e => setSettings({...settings, linkedin: e.target.value})} placeholder="https://linkedin.com/..." dir="ltr" />
              </div>
              <div className="flex items-center gap-3">
                <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                <Input value={settings.youtube} onChange={e => setSettings({...settings, youtube: e.target.value})} placeholder="https://youtube.com/..." dir="ltr" />
              </div>
              {/* TikTok */}
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <Input value={settings.tiktok} onChange={e => setSettings({...settings, tiktok: e.target.value})} placeholder="https://tiktok.com/@..." dir="ltr" />
              </div>
              {/* Snapchat */}
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03a1.67 1.67 0 0 1-.449-.075c-.449-.12-1.003-.27-1.784-.27-.39 0-.779.029-1.17.09-1.049.15-1.633.81-2.311 1.589-.479.555-1.019 1.154-1.694 1.544-.18.105-.39.162-.599.162-.224 0-.435-.06-.614-.165-.674-.39-1.214-.988-1.693-1.543-.679-.779-1.263-1.439-2.312-1.589-.39-.06-.779-.09-1.168-.09-.766 0-1.319.15-1.769.27-.12.029-.254.06-.389.075h-.045c-.285 0-.479-.135-.555-.405a3.02 3.02 0 0 1-.135-.555c-.044-.195-.104-.479-.164-.57-1.873-.283-2.906-.702-3.146-1.271a.524.524 0 0 1-.045-.225c-.015-.239.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.015-.014c.181-.345.21-.645.12-.87-.194-.449-.883-.674-1.333-.809-.135-.045-.255-.09-.344-.12-.824-.328-1.228-.719-1.213-1.168 0-.359.284-.689.734-.838.149-.06.329-.09.508-.09.12 0 .299.015.465.104.374.18.733.285 1.034.3.197 0 .325-.045.4-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.849 1.069 11.206.793 12.196.793z"/>
                </svg>
                <Input value={settings.snapchat} onChange={e => setSettings({...settings, snapchat: e.target.value})} placeholder="https://snapchat.com/add/..." dir="ltr" />
              </div>
            </div>

            {/* Other Social Links Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">{t('روابط أخرى', 'Other Links')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOtherSocialLink} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('إضافة رابط', 'Add Link')}
                </Button>
              </div>
              
              {settings.otherSocialLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('لا توجد روابط إضافية. اضغط على "إضافة رابط" لإضافة منصة أخرى.', 'No additional links. Click "Add Link" to add another platform.')}
                </p>
              ) : (
                <div className="space-y-3">
                  {settings.otherSocialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateOtherSocialLink(index, 'platform', value)}
                      >
                        <SelectTrigger className="w-[180px] bg-background">
                          <SelectValue placeholder={t('اختر المنصة', 'Select platform')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                          {socialPlatforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: platform.color }}
                                />
                                {platform.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        value={link.url} 
                        onChange={(e) => updateOtherSocialLink(index, 'url', e.target.value)} 
                        placeholder={t('رابط الحساب', 'Account URL')}
                        dir="ltr"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeOtherSocialLink(index)}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hero Images Per Page */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              {t('صور الطائرة للصفحات', 'Page Hero Airplane Images')}
            </CardTitle>
            <CardDescription>{t('صورة الطائرة المستخدمة في الهيرو لكل صفحة', 'Airplane image used in the hero section of each page')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'heroImageAbout', labelAr: 'تعرف علينا', labelEn: 'About Us' },
                { key: 'heroImageJourney', labelAr: 'انطلاقة الأكاديمية', labelEn: 'Academy Journey' },
                { key: 'heroImageBoardMembers', labelAr: 'أعضاء مجلس الإدارة', labelEn: 'Board Members' },
                { key: 'heroImageTrainingTeam', labelAr: 'فريق التدريب', labelEn: 'Training Team' },
                { key: 'heroImagePackages', labelAr: 'الباقات', labelEn: 'Packages' },
                { key: 'heroImageGraduates', labelAr: 'نجوم الطيران', labelEn: 'Graduates' },
                { key: 'heroImageNews', labelAr: 'الأخبار', labelEn: 'News' },
                { key: 'heroImageGallery', labelAr: 'المعرض', labelEn: 'Gallery' },
                { key: 'heroImageFAQ', labelAr: 'الأسئلة', labelEn: 'FAQ' },
                { key: 'heroImageContact', labelAr: 'تواصل', labelEn: 'Contact' },
                { key: 'heroImageBlog', labelAr: 'المدونة', labelEn: 'Blog' },
                { key: 'heroImageActivities', labelAr: 'الأنشطة', labelEn: 'Activities' },
                { key: 'heroImageVision', labelAr: 'الرؤية', labelEn: 'Vision' },
              ].map((page) => (
                <div key={page.key} className="space-y-2">
                  <Label className="font-medium">{t(page.labelAr, page.labelEn)}</Label>
                  <ImageUpload
                    value={(settings as any)[page.key] || ''}
                    onChange={(url) => setSettings({ ...settings, [page.key]: url })}
                    folder="hero-images"
                    placeholder={t('رفع صورة الطائرة', 'Upload airplane image')}
                  />
                </div>
              ))}
            </div>
            
            {/* Legacy/fallback plane image */}
            <div className="mt-6 pt-6 border-t">
              <Label className="font-medium mb-2 block">{t('صورة افتراضية (للصفحات بدون صورة خاصة)', 'Default image (for pages without custom image)')}</Label>
              <ImageUpload
                value={settings.planeImageUrl}
                onChange={(url) => setSettings({ ...settings, planeImageUrl: url })}
                folder="site-images"
                placeholder={t('رابط صورة الطائرة الافتراضية', 'Default plane image URL')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Visibility Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              {t('إظهار/إخفاء الأقسام', 'Section Visibility')}
            </CardTitle>
            <CardDescription>{t('التحكم في إظهار أو إخفاء الأقسام في الصفحة الرئيسية', 'Control which sections are displayed on the homepage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Activities Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">{t('قسم الأنشطة', 'Activities Section')}</Label>
                  <p className="text-sm text-muted-foreground">{t('أحدث الأنشطة', 'Latest Activities')}</p>
                </div>
                <Switch
                  checked={settings.showActivitiesSection}
                  onCheckedChange={(checked) => setSettings({ ...settings, showActivitiesSection: checked })}
                />
              </div>

              {/* Graduates Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">{t('قسم نجوم الطيران', 'Graduates Section')}</Label>
                  <p className="text-sm text-muted-foreground">{t('نجوم الطيران', 'Flying Stars')}</p>
                </div>
                <Switch
                  checked={settings.showGraduatesSection}
                  onCheckedChange={(checked) => setSettings({ ...settings, showGraduatesSection: checked })}
                />
              </div>

              {/* Partners Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">{t('قسم شركاء النجاح', 'Partners Section')}</Label>
                  <p className="text-sm text-muted-foreground">{t('شركاء النجاح', 'Success Partners')}</p>
                </div>
                <Switch
                  checked={settings.showPartnersSection}
                  onCheckedChange={(checked) => setSettings({ ...settings, showPartnersSection: checked })}
                />
              </div>

              {/* Training Programs Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">{t('قسم مراحل التدريب', 'Training Programs Section')}</Label>
                  <p className="text-sm text-muted-foreground">{t('مراحل التدريب', 'Training Programs')}</p>
                </div>
                <Switch
                  checked={settings.showTrainingProgramsSection}
                  onCheckedChange={(checked) => setSettings({ ...settings, showTrainingProgramsSection: checked })}
                />
              </div>

              {/* Training Team Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">{t('قسم فريق التدريب', 'Training Team Section')}</Label>
                  <p className="text-sm text-muted-foreground">{t('فريق التدريب', 'Training Team')}</p>
                </div>
                <Switch
                  checked={settings.showTrainingTeamSection}
                  onCheckedChange={(checked) => setSettings({ ...settings, showTrainingTeamSection: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('إعدادات SEO', 'SEO Settings')}</CardTitle>
            <CardDescription>{t('تحسين ظهور الموقع في محركات البحث', 'Optimize site visibility in search engines')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('عنوان الموقع (عربي)', 'Site Title (Arabic)')}</Label>
                <Input value={settings.metaTitleAr} onChange={e => setSettings({...settings, metaTitleAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('عنوان الموقع (إنجليزي)', 'Site Title (English)')}</Label>
                <Input value={settings.metaTitleEn} onChange={e => setSettings({...settings, metaTitleEn: e.target.value})} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('وصف الموقع (عربي)', 'Meta Description (Arabic)')}</Label>
                <Textarea value={settings.metaDescriptionAr} onChange={e => setSettings({...settings, metaDescriptionAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('وصف الموقع (إنجليزي)', 'Meta Description (English)')}</Label>
                <Textarea value={settings.metaDescriptionEn} onChange={e => setSettings({...settings, metaDescriptionEn: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsManager;
