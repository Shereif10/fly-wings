import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Upload, Loader2, ArrowUpRight, ChevronDown, ChevronUp, MapPin, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface TermItem {
  textAr: string;
  textEn: string;
}

interface RegionalPricing {
  id: string;
  regionAr: string;
  regionEn: string;
  price: string;
  currency: string;
  unit: string;
  notes?: string;
  imageUrl?: string;
}

interface ServiceItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;
  published: boolean;
  terms?: TermItem[];
  regionalPricing?: RegionalPricing[];
}

const defaultServiceItem: Omit<ServiceItem, 'id'> = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  imageUrl: '',
  order: 0,
  published: true,
  terms: [],
  regionalPricing: [],
};

const ServicesManager = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState<Omit<ServiceItem, 'id'>>(defaultServiceItem);
  const [uploading, setUploading] = useState(false);
  const [uploadingPricingImage, setUploadingPricingImage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesQuery = query(collection(db, 'services'), orderBy('order', 'asc'));
      const snapshot = await getDocs(servicesQuery);
      const fetchedServices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceItem[];
      setServices(fetchedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      try {
        const fallbackQuery = query(collection(db, 'services'));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackServices = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceItem[];
        setServices(fallbackServices.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        toast({
          title: t('خطأ', 'Error'),
          description: t('فشل في جلب الخدمات', 'Failed to fetch services'),
          variant: 'destructive',
        });
      }
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
      const fileName = `services/${Date.now()}_${file.name}`;
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

  const handlePricingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
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

    setUploadingPricingImage(index);
    try {
      const fileName = `services/pricing/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, await optimizeImage(file));
      const downloadUrl = await getDownloadURL(storageRef);
      
      const updatedPricing = [...(formData.regionalPricing || [])];
      updatedPricing[index] = { ...updatedPricing[index], imageUrl: downloadUrl };
      setFormData({ ...formData, regionalPricing: updatedPricing });
    } catch (error) {
      console.error('Error uploading pricing image:', error);
    }
    setUploadingPricingImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'services', editingItem.id), formData);
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث الخدمة بنجاح', 'Service updated successfully'),
        });
      } else {
        const newOrder = services.length > 0 ? Math.max(...services.map(s => s.order || 0)) + 1 : 0;
        await addDoc(collection(db, 'services'), { ...formData, order: newOrder });
        toast({
          title: t('تمت الإضافة', 'Added'),
          description: t('تمت إضافة الخدمة بنجاح', 'Service added successfully'),
        });
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(defaultServiceItem);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حفظ الخدمة', 'Failed to save service'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الخدمة بنجاح', 'Service deleted successfully'),
      });
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حذف الخدمة', 'Failed to delete service'),
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (item: ServiceItem) => {
    try {
      await updateDoc(doc(db, 'services', item.id), { published: !item.published });
      fetchServices();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const openEditDialog = (item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      imageUrl: item.imageUrl,
      order: item.order,
      published: item.published,
      terms: item.terms || [],
      regionalPricing: item.regionalPricing || [],
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData(defaultServiceItem);
    setDialogOpen(true);
  };

  // Terms management
  const addTerm = () => {
    setFormData({
      ...formData,
      terms: [...(formData.terms || []), { textAr: '', textEn: '' }]
    });
  };

  const updateTerm = (index: number, field: 'textAr' | 'textEn', value: string) => {
    const updatedTerms = [...(formData.terms || [])];
    updatedTerms[index] = { ...updatedTerms[index], [field]: value };
    setFormData({ ...formData, terms: updatedTerms });
  };

  const removeTerm = (index: number) => {
    const updatedTerms = [...(formData.terms || [])];
    updatedTerms.splice(index, 1);
    setFormData({ ...formData, terms: updatedTerms });
  };

  // Regional pricing management
  const addRegionalPricing = () => {
    setFormData({
      ...formData,
      regionalPricing: [...(formData.regionalPricing || []), {
        id: Date.now().toString(),
        regionAr: '',
        regionEn: '',
        price: '',
        currency: 'SAR',
        unit: 'hour',
        notes: '',
        imageUrl: '',
      }]
    });
  };

  const updateRegionalPricing = (index: number, field: keyof RegionalPricing, value: string) => {
    const updatedPricing = [...(formData.regionalPricing || [])];
    updatedPricing[index] = { ...updatedPricing[index], [field]: value };
    setFormData({ ...formData, regionalPricing: updatedPricing });
  };

  const removeRegionalPricing = (index: number) => {
    const updatedPricing = [...(formData.regionalPricing || [])];
    updatedPricing.splice(index, 1);
    setFormData({ ...formData, regionalPricing: updatedPricing });
  };

  // Add sample data to a service
  const addSampleData = async (serviceId: string) => {
    const sampleTerms: TermItem[] = [
      { textAr: 'يجب تقديم الطلب قبل 48 ساعة على الأقل من موعد الرحلة', textEn: 'Request must be submitted at least 48 hours before the flight' },
      { textAr: 'الأسعار لا تشمل الضرائب والرسوم الحكومية', textEn: 'Prices do not include taxes and government fees' },
      { textAr: 'يحق للشركة إلغاء الحجز في حالة الظروف الجوية السيئة', textEn: 'The company reserves the right to cancel bookings due to bad weather conditions' },
      { textAr: 'يتطلب دفع 50% كعربون غير قابل للاسترداد عند الحجز', textEn: '50% non-refundable deposit required upon booking' },
      { textAr: 'الحد الأقصى للأمتعة 20 كجم لكل راكب', textEn: 'Maximum luggage allowance is 20kg per passenger' },
    ];

    const samplePricing: RegionalPricing[] = [
      {
        id: 'jeddah_1',
        regionAr: 'جدة',
        regionEn: 'Jeddah',
        price: '15000',
        currency: 'SAR',
        unit: 'hour',
        notes: 'تشمل الطيار والوقود',
        imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
      },
      {
        id: 'riyadh_1',
        regionAr: 'الرياض',
        regionEn: 'Riyadh',
        price: '18000',
        currency: 'SAR',
        unit: 'hour',
        notes: 'تشمل الطيار والوقود والضيافة',
        imageUrl: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
      },
      {
        id: 'makkah_1',
        regionAr: 'مكة المكرمة',
        regionEn: 'Makkah',
        price: '20000',
        currency: 'SAR',
        unit: 'hour',
        notes: 'خدمة VIP مع مرافق خاص',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
      },
      {
        id: 'jazan_1',
        regionAr: 'جازان',
        regionEn: 'Jazan',
        price: '22000',
        currency: 'SAR',
        unit: 'hour',
        notes: 'تشمل رحلات ساحلية مميزة',
        imageUrl: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800',
      },
    ];

    try {
      await updateDoc(doc(db, 'services', serviceId), {
        terms: sampleTerms,
        regionalPricing: samplePricing,
      });
      toast({
        title: t('تمت الإضافة', 'Added'),
        description: t('تمت إضافة البيانات التجريبية بنجاح', 'Sample data added successfully'),
      });
      fetchServices();
    } catch (error) {
      console.error('Error adding sample data:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في إضافة البيانات التجريبية', 'Failed to add sample data'),
        variant: 'destructive',
      });
    }
  };

  const filteredServices = services.filter(item =>
    item.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.titleEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('إدارة الخدمات', 'Services Management')}</h1>
          <p className="text-muted-foreground">{t('إضافة وتعديل الخدمات مع الشروط والأسعار', 'Add and edit services with terms and pricing')}</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة خدمة', 'Add Service')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('بحث في الخدمات...', 'Search services...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {t('لا توجد خدمات', 'No services found')}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-soft border group"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 start-4 end-4">
                  <h3 className="font-bold text-white text-lg line-clamp-1">{item.titleAr}</h3>
                  <div className="flex gap-2 mt-2">
                    {(item.terms?.length || 0) > 0 && (
                      <span className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded text-white">
                        {item.terms?.length} {t('شرط', 'terms')}
                      </span>
                    )}
                    {(item.regionalPricing?.length || 0) > 0 && (
                      <span className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded text-white">
                        {item.regionalPricing?.length} {t('منطقة', 'regions')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 end-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 end-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {item.published ? t('منشور', 'Published') : t('مسودة', 'Draft')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4">
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('حذف الخدمة', 'Delete Service')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.', 
                            'Are you sure you want to delete this service? This action cannot be undone.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                          {t('حذف', 'Delete')}
                        </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => addSampleData(item.id)}
                              title={t('إضافة بيانات تجريبية', 'Add Sample Data')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Database className="w-4 h-4" />
                            </Button>
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
              {editingItem ? t('تعديل الخدمة', 'Edit Service') : t('إضافة خدمة جديدة', 'Add New Service')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t('المعلومات الأساسية', 'Basic Info')}</TabsTrigger>
                <TabsTrigger value="terms">{t('الشروط والأحكام', 'Terms')}</TabsTrigger>
                <TabsTrigger value="pricing">{t('الأسعار حسب المنطقة', 'Regional Pricing')}</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>{t('صورة الخدمة', 'Service Image')}</Label>
                  <div className="flex gap-4 items-start">
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="gap-2"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {t('رفع صورة', 'Upload Image')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Titles */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                    <Input
                      value={formData.titleAr}
                      onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                      required
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                    <Input
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                    <Textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                    <Textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      rows={4}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Order & Published */}
                <div className="flex items-center gap-6">
                  <div className="space-y-2">
                    <Label>{t('الترتيب', 'Order')}</Label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                    />
                    <Label>{t('منشور', 'Published')}</Label>
                  </div>
                </div>
              </TabsContent>

              {/* Terms Tab */}
              <TabsContent value="terms" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{t('الشروط والأحكام', 'Terms & Conditions')}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addTerm}>
                    <Plus className="w-4 h-4 me-1" />
                    {t('إضافة شرط', 'Add Term')}
                  </Button>
                </div>

                {formData.terms?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    {t('لا توجد شروط. اضغط على إضافة شرط لإضافة شرط جديد', 'No terms. Click Add Term to add a new term')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.terms?.map((term, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('الشرط', 'Term')} #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTerm(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <Input
                            placeholder={t('النص بالعربي', 'Arabic text')}
                            value={term.textAr}
                            onChange={(e) => updateTerm(index, 'textAr', e.target.value)}
                            dir="rtl"
                          />
                          <Input
                            placeholder={t('النص بالإنجليزي', 'English text')}
                            value={term.textEn}
                            onChange={(e) => updateTerm(index, 'textEn', e.target.value)}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Regional Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{t('الأسعار حسب المنطقة', 'Regional Pricing')}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addRegionalPricing}>
                    <Plus className="w-4 h-4 me-1" />
                    {t('إضافة منطقة', 'Add Region')}
                  </Button>
                </div>

                {formData.regionalPricing?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    {t('لا توجد أسعار. اضغط على إضافة منطقة لإضافة سعر جديد', 'No pricing. Click Add Region to add a new price')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.regionalPricing?.map((pricing, index) => (
                      <div key={pricing.id || index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{t('المنطقة', 'Region')} #{index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRegionalPricing(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Region Image */}
                        <div className="flex gap-4 items-center">
                          {pricing.imageUrl && (
                            <img src={pricing.imageUrl} alt="" className="w-20 h-14 object-cover rounded" />
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePricingImageUpload(e, index)}
                              className="hidden"
                              id={`pricing-image-${index}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`pricing-image-${index}`)?.click()}
                              disabled={uploadingPricingImage === index}
                            >
                              {uploadingPricingImage === index ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 me-1" />
                              )}
                              {t('صورة', 'Image')}
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <Input
                            placeholder={t('اسم المنطقة بالعربي', 'Region name (Arabic)')}
                            value={pricing.regionAr}
                            onChange={(e) => updateRegionalPricing(index, 'regionAr', e.target.value)}
                            dir="rtl"
                          />
                          <Input
                            placeholder={t('اسم المنطقة بالإنجليزي', 'Region name (English)')}
                            value={pricing.regionEn}
                            onChange={(e) => updateRegionalPricing(index, 'regionEn', e.target.value)}
                            dir="ltr"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder={t('السعر', 'Price')}
                            value={pricing.price}
                            onChange={(e) => updateRegionalPricing(index, 'price', e.target.value)}
                          />
                          <Input
                            placeholder={t('العملة', 'Currency')}
                            value={pricing.currency}
                            onChange={(e) => updateRegionalPricing(index, 'currency', e.target.value)}
                          />
                          <Input
                            placeholder={t('الوحدة (ساعة/يوم)', 'Unit (hour/day)')}
                            value={pricing.unit}
                            onChange={(e) => updateRegionalPricing(index, 'unit', e.target.value)}
                          />
                        </div>
                        <Input
                          placeholder={t('ملاحظات إضافية', 'Additional notes')}
                          value={pricing.notes || ''}
                          onChange={(e) => updateRegionalPricing(index, 'notes', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="flex-1">
                {editingItem ? t('تحديث', 'Update') : t('إضافة', 'Add')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('إلغاء', 'Cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManager;
