import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, Calendar, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import RichTextEditor from './RichTextEditor';
import SeoFields from './SeoFields';
import { slugify } from '@/lib/content';

interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  imageUrl: string;
  date: string;
  category: string;
  featured: boolean;
  published: boolean;
  slug?: string;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
}

const defaultNewsItem: Omit<NewsItem, 'id'> = {
  titleAr: '',
  titleEn: '',
  excerptAr: '',
  excerptEn: '',
  contentAr: '',
  contentEn: '',
  imageUrl: '',
  date: new Date().toISOString().split('T')[0],
  category: 'أخبار',
  featured: false,
  published: true,
  slug: '',
  metaTitleAr: '',
  metaTitleEn: '',
  metaDescriptionAr: '',
  metaDescriptionEn: '',
};

const NewsManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState<Omit<NewsItem, 'id'>>(defaultNewsItem);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNews();
    seedDefaultNews();
  }, []);

  // Seed default news if none exist
  const seedDefaultNews = async () => {
    try {
      const newsQuery = query(collection(db, 'news'));
      const snapshot = await getDocs(newsQuery);
      if (snapshot.empty) {
        const sampleNews = [
          {
            titleAr: 'أجنحة الطيران تحقق إنجازاً تاريخياً في معرض الطيران 2025',
            titleEn: 'Fly Wings Achieves Historic Milestone at Aviation Expo 2025',
            excerptAr: 'حققت أكاديمية أجنحة الطيران إنجازاً تاريخياً بتخريج أكبر دفعة من الطيارين المحترفين في تاريخ المملكة',
            excerptEn: 'Fly Wings Academy achieved a historic milestone by graduating the largest batch of professional pilots in the Kingdom\'s history',
            contentAr: '<p>في حدث تاريخي، احتفلت أكاديمية أجنحة الطيران بتخريج أكبر دفعة من الطيارين المحترفين. شهد الحفل حضور كبار المسؤولين في قطاع الطيران.</p><p>أكد المدير التنفيذي للأكاديمية أن هذا الإنجاز يعكس التزامنا بتقديم أعلى معايير التدريب.</p>',
            contentEn: '<p>In a historic event, Fly Wings Academy celebrated graduating the largest batch of professional pilots. The ceremony was attended by senior aviation sector officials.</p><p>The Academy\'s CEO confirmed that this achievement reflects our commitment to providing the highest training standards.</p>',
            imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800',
            date: '2025-01-15',
            category: 'أخبار',
            featured: true,
            published: true,
          },
          {
            titleAr: 'شراكة استراتيجية جديدة مع أكاديميات طيران عالمية',
            titleEn: 'New Strategic Partnership with Global Aviation Academies',
            excerptAr: 'أعلنت أجنحة الطيران عن توقيع اتفاقيات شراكة مع عدة أكاديميات طيران رائدة في أوروبا وأمريكا',
            excerptEn: 'Fly Wings announced signing partnership agreements with several leading aviation academies in Europe and America',
            contentAr: '<p>وقعت أكاديمية أجنحة الطيران اتفاقيات شراكة استراتيجية مع أكاديميات طيران رائدة في أوروبا وأمريكا الشمالية.</p><p>تتيح هذه الشراكات لطلابنا فرص تدريب دولية وشهادات معترف بها عالمياً.</p>',
            contentEn: '<p>Fly Wings Academy signed strategic partnership agreements with leading aviation academies in Europe and North America.</p><p>These partnerships provide our students with international training opportunities and globally recognized certifications.</p>',
            imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800',
            date: '2025-01-10',
            category: 'شراكات',
            featured: false,
            published: true,
          },
          {
            titleAr: 'افتتاح مركز تدريب جديد مجهز بأحدث أجهزة المحاكاة',
            titleEn: 'Opening of New Training Center with Latest Simulators',
            excerptAr: 'افتتحت أجنحة الطيران مركز تدريب جديد في الرياض مجهز بأحدث أجهزة محاكاة الطيران العالمية',
            excerptEn: 'Fly Wings opened a new training center in Riyadh equipped with the latest global flight simulators',
            contentAr: '<p>افتتحت أكاديمية أجنحة الطيران مركز تدريب جديد ومتطور في مدينة الرياض.</p><p>يضم المركز أحدث أجهزة محاكاة الطيران من طراز Boeing و Airbus.</p>',
            contentEn: '<p>Fly Wings Academy opened a new state-of-the-art training center in Riyadh.</p><p>The center features the latest Boeing and Airbus flight simulators.</p>',
            imageUrl: 'https://images.unsplash.com/photo-1559060017-445fb4429b21?q=80&w=800',
            date: '2025-01-05',
            category: 'أخبار',
            featured: false,
            published: true,
          },
          {
            titleAr: 'برنامج منح دراسية جديد للطلاب المتميزين',
            titleEn: 'New Scholarship Program for Outstanding Students',
            excerptAr: 'أطلقت أجنحة الطيران برنامج منح دراسية شاملة للطلاب المتميزين الراغبين في دخول مجال الطيران',
            excerptEn: 'Fly Wings launched a comprehensive scholarship program for outstanding students wishing to enter the aviation field',
            contentAr: '<p>أعلنت أكاديمية أجنحة الطيران عن إطلاق برنامج منح دراسية شامل للطلاب المتميزين.</p><p>يغطي البرنامج تكاليف التدريب كاملة بالإضافة إلى السكن والمعيشة.</p>',
            contentEn: '<p>Fly Wings Academy announced the launch of a comprehensive scholarship program for outstanding students.</p><p>The program covers full training costs in addition to accommodation and living expenses.</p>',
            imageUrl: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?q=80&w=800',
            date: '2024-12-28',
            category: 'تعليم',
            featured: false,
            published: true,
          },
        ];

        for (const newsItem of sampleNews) {
          await addDoc(collection(db, 'news'), newsItem);
        }
        console.log('Seeded 4 sample news items');
        fetchNews();
      }
    } catch (error) {
      console.error('Error seeding news:', error);
    }
  };

  const fetchNews = async () => {
    try {
      const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
      const snapshot = await getDocs(newsQuery);
      const fetchedNews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(fetchedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في جلب الأخبار', 'Failed to fetch news'),
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يرجى اختيار ملف صورة', 'Please select an image file'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'Image size must be less than 5MB'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `news/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, await optimizeImage(file));
      const downloadUrl = await getDownloadURL(storageRef);
      setFormData({ ...formData, imageUrl: downloadUrl });
      toast({
        title: t('تم الرفع', 'Uploaded'),
        description: t('تم رفع الصورة بنجاح', 'Image uploaded successfully'),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في رفع الصورة', 'Failed to upload image'),
        variant: 'destructive',
      });
    }
    setUploading(false);
  };

  const ensureSlug = () =>
    formData.slug || slugify(formData.titleEn || formData.titleAr) || `news-${Date.now()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing
        await updateDoc(doc(db, 'news', editingItem.id), { ...formData, slug: ensureSlug() });
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث الخبر بنجاح', 'News updated successfully'),
        });
      } else {
        // Create new
        await addDoc(collection(db, 'news'), { ...formData, slug: ensureSlug() });
        toast({
          title: t('تمت الإضافة', 'Added'),
          description: t('تمت إضافة الخبر بنجاح', 'News added successfully'),
        });
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(defaultNewsItem);
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حفظ الخبر', 'Failed to save news'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'news', id));
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الخبر بنجاح', 'News deleted successfully'),
      });
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حذف الخبر', 'Failed to delete news'),
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (item: NewsItem) => {
    try {
      await updateDoc(doc(db, 'news', item.id), { published: !item.published });
      fetchNews();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleToggleFeatured = async (item: NewsItem) => {
    try {
      await updateDoc(doc(db, 'news', item.id), { featured: !item.featured });
      fetchNews();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const openEditDialog = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      excerptAr: item.excerptAr,
      excerptEn: item.excerptEn,
      contentAr: item.contentAr,
      contentEn: item.contentEn,
      imageUrl: item.imageUrl,
      date: item.date,
      category: item.category,
      featured: item.featured,
      published: item.published,
      slug: item.slug || '',
      metaTitleAr: item.metaTitleAr || '',
      metaTitleEn: item.metaTitleEn || '',
      metaDescriptionAr: item.metaDescriptionAr || '',
      metaDescriptionEn: item.metaDescriptionEn || '',
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData(defaultNewsItem);
    setDialogOpen(true);
  };

  const filteredNews = news.filter(item =>
    item.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.titleEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('إدارة الأخبار', 'News Management')}</h1>
          <p className="text-muted-foreground">{t('إضافة وتعديل الأخبار', 'Add and edit news')}</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة خبر', 'Add News')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('بحث في الأخبار...', 'Search news...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {t('لا توجد أخبار', 'No news found')}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-soft border"
            >
              {/* Image */}
              <div className="relative aspect-video">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.titleAr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">{t('لا توجد صورة', 'No image')}</span>
                  </div>
                )}
                {/* Status Badges */}
                <div className="absolute top-2 end-2 flex gap-1">
                  {item.featured && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
                      {t('مميز', 'Featured')}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {item.published ? t('منشور', 'Published') : t('مسودة', 'Draft')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.date)}</span>
                </div>
                <h3 className="font-bold text-foreground mb-2 line-clamp-2">{item.titleAr}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.excerptAr}</p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 me-1" />
                    {t('تعديل', 'Edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePublish(item)}
                    title={item.published ? t('إلغاء النشر', 'Unpublish') : t('نشر', 'Publish')}
                  >
                    {item.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFeatured(item)}
                    title={item.featured ? t('إلغاء التمييز', 'Unfeature') : t('تمييز', 'Feature')}
                  >
                    {item.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('حذف الخبر', 'Delete News')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('هل أنت متأكد من حذف هذا الخبر؟ لا يمكن التراجع عن هذا الإجراء.', 
                            'Are you sure you want to delete this news? This action cannot be undone.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          {t('حذف', 'Delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('تعديل الخبر', 'Edit News') : t('إضافة خبر جديد', 'Add New News')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Arabic Title */}
              <div className="space-y-2">
                <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  required
                  dir="rtl"
                />
              </div>

              {/* English Title */}
              <div className="space-y-2">
                <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>

              {/* Arabic Excerpt */}
              <div className="space-y-2">
                <Label>{t('المقتطف (عربي)', 'Excerpt (Arabic)')}</Label>
                <Textarea
                  value={formData.excerptAr}
                  onChange={(e) => setFormData({ ...formData, excerptAr: e.target.value })}
                  rows={2}
                  dir="rtl"
                />
              </div>

              {/* English Excerpt */}
              <div className="space-y-2">
                <Label>{t('المقتطف (إنجليزي)', 'Excerpt (English)')}</Label>
                <Textarea
                  value={formData.excerptEn}
                  onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                  rows={2}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Arabic Content */}
            <div className="space-y-2">
              <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
              <RichTextEditor
                value={formData.contentAr}
                onChange={(val) => setFormData({ ...formData, contentAr: val })}
                dir="rtl"
                minHeight="250px"
              />
            </div>

            {/* English Content */}
            <div className="space-y-2">
              <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
              <RichTextEditor
                value={formData.contentEn}
                onChange={(val) => setFormData({ ...formData, contentEn: val })}
                dir="ltr"
                minHeight="250px"
              />
            </div>

            <SeoFields
              basePath="news"
              titleForSlug={formData.titleEn || formData.titleAr}
              fallbackTitle={formData.titleAr || formData.titleEn}
              values={{
                slug: formData.slug || '',
                metaTitleAr: formData.metaTitleAr || '',
                metaTitleEn: formData.metaTitleEn || '',
                metaDescriptionAr: formData.metaDescriptionAr || '',
                metaDescriptionEn: formData.metaDescriptionEn || '',
              }}
              onChange={(patch) => setFormData({ ...formData, ...patch })}
            />

            <div className="grid md:grid-cols-3 gap-4">
              {/* Image Upload */}
              <div className="space-y-2 md:col-span-3">
                <Label>{t('الصورة', 'Image')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    type="url"
                    placeholder={t('رابط الصورة أو ارفع صورة', 'Image URL or upload')}
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 me-1" />
                        {t('رفع', 'Upload')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>{t('التاريخ', 'Date')}</Label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  type="date"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>{t('التصنيف', 'Category')}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            {/* Switches */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label>{t('منشور', 'Published')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label>{t('مميز', 'Featured')}</Label>
              </div>
            </div>

            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="space-y-2">
                <Label>{t('معاينة الصورة', 'Image Preview')}</Label>
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button type="submit">
                {editingItem ? t('تحديث', 'Update') : t('إضافة', 'Add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManager;
