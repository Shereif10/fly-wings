import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, Calendar, Upload, Loader2, GraduationCap } from 'lucide-react';
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

interface GraduateItem {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  storyAr: string;
  storyEn: string;
  quoteAr: string;
  quoteEn: string;
  imageUrl: string;
  graduationDate: string;
  program: string;
  featured: boolean;
  published: boolean;
}

const defaultGraduateItem: Omit<GraduateItem, 'id'> = {
  nameAr: '',
  nameEn: '',
  titleAr: '',
  titleEn: '',
  storyAr: '',
  storyEn: '',
  quoteAr: '',
  quoteEn: '',
  imageUrl: '',
  graduationDate: new Date().toISOString().split('T')[0],
  program: '',
  featured: false,
  published: true,
};

const GraduatesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GraduateItem | null>(null);
  const [formData, setFormData] = useState<Omit<GraduateItem, 'id'>>(defaultGraduateItem);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGraduates();
  }, []);

  const fetchGraduates = async () => {
    try {
      const graduatesQuery = query(collection(db, 'graduates'), orderBy('graduationDate', 'desc'));
      const snapshot = await getDocs(graduatesQuery);
      const fetchedGraduates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GraduateItem[];
      setGraduates(fetchedGraduates);
    } catch (error) {
      console.error('Error fetching graduates:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في جلب الخريجين', 'Failed to fetch graduates'),
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يرجى اختيار ملف صورة', 'Please select an image file'),
        variant: 'destructive',
      });
      return;
    }

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
      const fileName = `graduates/${Date.now()}_${file.name}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'graduates', editingItem.id), formData);
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث بيانات الخريج بنجاح', 'Graduate updated successfully'),
        });
      } else {
        await addDoc(collection(db, 'graduates'), formData);
        toast({
          title: t('تمت الإضافة', 'Added'),
          description: t('تمت إضافة الخريج بنجاح', 'Graduate added successfully'),
        });
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(defaultGraduateItem);
      fetchGraduates();
    } catch (error) {
      console.error('Error saving graduate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حفظ بيانات الخريج', 'Failed to save graduate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'graduates', id));
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الخريج بنجاح', 'Graduate deleted successfully'),
      });
      fetchGraduates();
    } catch (error) {
      console.error('Error deleting graduate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حذف الخريج', 'Failed to delete graduate'),
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (item: GraduateItem) => {
    try {
      await updateDoc(doc(db, 'graduates', item.id), { published: !item.published });
      fetchGraduates();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleToggleFeatured = async (item: GraduateItem) => {
    try {
      await updateDoc(doc(db, 'graduates', item.id), { featured: !item.featured });
      fetchGraduates();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const openEditDialog = (item: GraduateItem) => {
    setEditingItem(item);
    setFormData({
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      storyAr: item.storyAr,
      storyEn: item.storyEn,
      quoteAr: item.quoteAr,
      quoteEn: item.quoteEn,
      imageUrl: item.imageUrl,
      graduationDate: item.graduationDate,
      program: item.program,
      featured: item.featured,
      published: item.published,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData(defaultGraduateItem);
    setDialogOpen(true);
  };

  const filteredGraduates = graduates.filter(item =>
    item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            {t('نجوم الطيران', 'Flying Stars')}
          </h1>
          <p className="text-muted-foreground">{t('إدارة خريجي التدريب', 'Manage training graduates')}</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة خريج', 'Add Graduate')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('بحث في الخريجين...', 'Search graduates...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Graduates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredGraduates.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          {t('لا يوجد خريجين', 'No graduates found')}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGraduates.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-soft border"
            >
              {/* Image */}
              <div className="relative aspect-square">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.nameAr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <GraduationCap className="w-16 h-16 text-muted-foreground/30" />
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
                  <span>{formatDate(item.graduationDate)}</span>
                </div>
                <h3 className="font-bold text-foreground mb-1">{item.nameAr}</h3>
                <p className="text-sm text-primary mb-2">{item.titleAr}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.quoteAr}</p>

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
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Delete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('هل أنت متأكد من حذف هذا الخريج؟ لا يمكن التراجع عن هذا الإجراء.', 
                             'Are you sure you want to delete this graduate? This action cannot be undone.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {editingItem ? t('تعديل الخريج', 'Edit Graduate') : t('إضافة خريج جديد', 'Add New Graduate')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>{t('صورة الخريج', 'Graduate Photo')}</Label>
              <div className="flex items-center gap-4">
                {formData.imageUrl && (
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                )}
                <div>
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
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {t('رفع صورة', 'Upload Photo')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('الاسم (عربي)', 'Name (Arabic)')}</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('الاسم (إنجليزي)', 'Name (English)')}</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Title/Position */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('المسمى الوظيفي (عربي)', 'Job Title (Arabic)')}</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder={t('مثال: طيار في الخطوط السعودية', 'e.g. Pilot at Saudi Airlines')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('المسمى الوظيفي (إنجليزي)', 'Job Title (English)')}</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                />
              </div>
            </div>

            {/* Quote */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('اقتباس (عربي)', 'Quote (Arabic)')}</Label>
                <Textarea
                  value={formData.quoteAr}
                  onChange={(e) => setFormData({ ...formData, quoteAr: e.target.value })}
                  placeholder={t('كلمة من الخريج...', 'A word from the graduate...')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('اقتباس (إنجليزي)', 'Quote (English)')}</Label>
                <Textarea
                  value={formData.quoteEn}
                  onChange={(e) => setFormData({ ...formData, quoteEn: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Story */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('قصة النجاح (عربي)', 'Success Story (Arabic)')}</Label>
                <Textarea
                  value={formData.storyAr}
                  onChange={(e) => setFormData({ ...formData, storyAr: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('قصة النجاح (إنجليزي)', 'Success Story (English)')}</Label>
                <Textarea
                  value={formData.storyEn}
                  onChange={(e) => setFormData({ ...formData, storyEn: e.target.value })}
                  rows={5}
                />
              </div>
            </div>

            {/* Date & Program */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('تاريخ التخرج', 'Graduation Date')}</Label>
                <Input
                  type="date"
                  value={formData.graduationDate}
                  onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('البرنامج التدريبي', 'Training Program')}</Label>
                <Input
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  placeholder={t('مثال: رخصة طيار تجاري', 'e.g. Commercial Pilot License')}
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
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('إلغاء', 'Cancel')}
              </Button>
              <Button type="submit">
                {editingItem ? t('حفظ التغييرات', 'Save Changes') : t('إضافة الخريج', 'Add Graduate')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GraduatesManager;
