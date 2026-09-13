import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, Calendar, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
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

interface ActivityItem {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  images: string[];
  date: string;
  category: string;
  featured: boolean;
  published: boolean;
}

const defaultActivityItem: Omit<ActivityItem, 'id'> = {
  titleAr: '',
  titleEn: '',
  excerptAr: '',
  excerptEn: '',
  contentAr: '',
  contentEn: '',
  images: [],
  date: new Date().toISOString().split('T')[0],
  category: 'فعالية',
  featured: false,
  published: true,
};

const ActivitiesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [formData, setFormData] = useState<Omit<ActivityItem, 'id'>>(defaultActivityItem);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivities();
    seedDefaultActivities();
  }, []);

  const seedDefaultActivities = async () => {
    try {
      const activitiesQuery = query(collection(db, 'activities'));
      const snapshot = await getDocs(activitiesQuery);
      if (snapshot.empty) {
        const sampleActivities = [
          {
            titleAr: 'معرض الطيران العام ساند اند فن 2025',
            titleEn: 'General Aviation Airshow Sand and Fun 2025',
            excerptAr: 'الحدث الأول للطيران في المملكة العربية السعودية الذي يجمع بين الابتكار والثقافة والمغامرة',
            excerptEn: 'The first aviation event in Saudi Arabia combining innovation, culture, and adventure',
            contentAr: '<p>الحدث الأول للطيران في المملكة العربية السعودية الذي يجمع بين الابتكار والثقافة والمغامرة في عرض استثنائي. هذا أكثر من مجرد عرض جوي، إنه تجمع عالمي حيث يلتقي عشاق الطيران وقادة الصناعة.</p>',
            contentEn: '<p>The first aviation event in Saudi Arabia combining innovation, culture, and adventure in an exceptional display. This is more than just an air show, it is a global gathering where aviation enthusiasts and industry leaders meet.</p>',
            images: [
              'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800',
              'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800',
            ],
            date: '2025-11-25',
            category: 'معرض',
            featured: true,
            published: true,
          },
          {
            titleAr: 'ملتقى الطيران العام وفعالية فلاي-ان بالمدينة المنورة',
            titleEn: 'General Aviation Meeting and Fly-In Event in Madinah',
            excerptAr: 'تجمع لعشاق الطيران من مختلف المناطق في فعالية فلاي-ان الممتعة',
            excerptEn: 'A gathering of aviation enthusiasts from various regions in an exciting fly-in event',
            contentAr: '<p>ملتقى سنوي يجمع هواة ومحترفي الطيران للتعرف على أحدث التقنيات وتبادل الخبرات.</p>',
            contentEn: '<p>An annual meeting bringing together aviation hobbyists and professionals to learn about the latest technologies and exchange experiences.</p>',
            images: [
              'https://images.unsplash.com/photo-1559060017-445fb4429b21?q=80&w=800',
            ],
            date: '2025-01-09',
            category: 'ملتقى',
            featured: false,
            published: true,
          },
          {
            titleAr: 'المؤتمر العام الـ(118) للاتحاد العالمي للرياضات الجوية',
            titleEn: '118th FAI General Conference',
            excerptAr: 'استضافة المؤتمر العام للاتحاد الدولي للطيران في الرياض',
            excerptEn: 'Hosting the FAI General Conference in Riyadh',
            contentAr: '<p>فخورون باستضافة المؤتمر العام الـ118 للاتحاد الدولي للرياضات الجوية في مدينة الرياض.</p>',
            contentEn: '<p>Proud to host the 118th FAI General Conference in Riyadh.</p>',
            images: [
              'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?q=80&w=800',
            ],
            date: '2024-11-19',
            category: 'مؤتمر',
            featured: false,
            published: true,
          },
        ];

        for (const activity of sampleActivities) {
          await addDoc(collection(db, 'activities'), activity);
        }
        console.log('Seeded sample activities');
        fetchActivities();
      }
    } catch (error) {
      console.error('Error seeding activities:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const activitiesQuery = query(collection(db, 'activities'), orderBy('date', 'desc'));
      const snapshot = await getDocs(activitiesQuery);
      const fetchedActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityItem[];
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في جلب الأنشطة', 'Failed to fetch activities'),
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileName = `activities/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, await optimizeImage(file));
        const downloadUrl = await getDownloadURL(storageRef);
        newImages.push(downloadUrl);
      }

      setFormData({ ...formData, images: [...formData.images, ...newImages] });
      toast({
        title: t('تم الرفع', 'Uploaded'),
        description: t(`تم رفع ${newImages.length} صورة بنجاح`, `${newImages.length} images uploaded successfully`),
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في رفع بعض الصور', 'Failed to upload some images'),
        variant: 'destructive',
      });
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'activities', editingItem.id), formData);
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث النشاط بنجاح', 'Activity updated successfully'),
        });
      } else {
        await addDoc(collection(db, 'activities'), formData);
        toast({
          title: t('تمت الإضافة', 'Added'),
          description: t('تمت إضافة النشاط بنجاح', 'Activity added successfully'),
        });
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(defaultActivityItem);
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حفظ النشاط', 'Failed to save activity'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activities', id));
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف النشاط بنجاح', 'Activity deleted successfully'),
      });
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حذف النشاط', 'Failed to delete activity'),
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (item: ActivityItem) => {
    try {
      await updateDoc(doc(db, 'activities', item.id), { published: !item.published });
      fetchActivities();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleToggleFeatured = async (item: ActivityItem) => {
    try {
      await updateDoc(doc(db, 'activities', item.id), { featured: !item.featured });
      fetchActivities();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const openEditDialog = (item: ActivityItem) => {
    setEditingItem(item);
    setFormData({
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      excerptAr: item.excerptAr,
      excerptEn: item.excerptEn,
      contentAr: item.contentAr,
      contentEn: item.contentEn,
      images: item.images || [],
      date: item.date,
      category: item.category,
      featured: item.featured,
      published: item.published,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData(defaultActivityItem);
    setDialogOpen(true);
  };

  const filteredActivities = activities.filter(item =>
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
          <h1 className="text-2xl font-bold">{t('إدارة الأنشطة', 'Activities Management')}</h1>
          <p className="text-muted-foreground">{t('إضافة وتعديل الأنشطة والفعاليات', 'Add and edit activities and events')}</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة نشاط', 'Add Activity')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('بحث في الأنشطة...', 'Search activities...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {t('لا توجد أنشطة', 'No activities found')}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-soft border"
            >
              {/* Image */}
              <div className="relative aspect-video">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.titleAr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {item.images && item.images.length > 1 && (
                  <span className="absolute bottom-2 start-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    +{item.images.length - 1} {t('صور', 'images')}
                  </span>
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
                  <span className="px-2 py-0.5 rounded bg-muted">{item.category}</span>
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
                        <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Delete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('هل أنت متأكد من حذف هذا النشاط؟', 'Are you sure you want to delete this activity?')}
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
              {editingItem ? t('تعديل نشاط', 'Edit Activity') : t('إضافة نشاط جديد', 'Add New Activity')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Upload */}
            <div className="space-y-3">
              <Label>{t('الصور', 'Images')}</Label>
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 end-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('الملخص (عربي)', 'Excerpt (Arabic)')}</Label>
                <Textarea
                  value={formData.excerptAr}
                  onChange={(e) => setFormData({ ...formData, excerptAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('الملخص (إنجليزي)', 'Excerpt (English)')}</Label>
                <Textarea
                  value={formData.excerptEn}
                  onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
                <Textarea
                  value={formData.contentAr}
                  onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
                <Textarea
                  value={formData.contentEn}
                  onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                  rows={5}
                />
              </div>
            </div>

            {/* Date & Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('التاريخ', 'Date')}</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('التصنيف', 'Category')}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('مثال: معرض، فعالية، مؤتمر', 'e.g., Exhibition, Event, Conference')}
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

            {/* Submit */}
            <div className="flex justify-end gap-3">
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

export default ActivitiesManager;
