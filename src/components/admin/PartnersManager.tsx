import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, Upload, X, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Partner {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  websiteUrl: string;
  order: number;
  published: boolean;
}

const samplePartners = [
  {
    nameAr: 'خدمات الملاحة الجوية السعودية',
    nameEn: 'Saudi Air Navigation Services (SANS)',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Saudi_Air_Navigation_Services_logo.svg/1200px-Saudi_Air_Navigation_Services_logo.svg.png',
    websiteUrl: 'https://www.sans.gov.sa',
    order: 1,
    published: true,
  },
  {
    nameAr: 'محمية الملك خالد الملكية',
    nameEn: 'King Khalid Royal Reserve',
    logoUrl: '',
    websiteUrl: 'https://www.kkwr.gov.sa',
    order: 2,
    published: true,
  },
  {
    nameAr: 'هيئة تطوير محمية الإمام عبدالعزيز بن محمد الملكية',
    nameEn: 'Imam Abdulaziz bin Mohammed Royal Reserve',
    logoUrl: '',
    websiteUrl: 'https://www.iabmrr.gov.sa',
    order: 3,
    published: true,
  },
  {
    nameAr: 'تجمع مطارات 2',
    nameEn: 'Airports Cluster 2',
    logoUrl: '',
    websiteUrl: 'https://www.gaca.gov.sa',
    order: 4,
    published: true,
  },
  {
    nameAr: 'الهيئة العامة للطيران المدني',
    nameEn: 'General Authority of Civil Aviation (GACA)',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/GACA_Logo.svg/1200px-GACA_Logo.svg.png',
    websiteUrl: 'https://www.gaca.gov.sa',
    order: 5,
    published: true,
  },
  {
    nameAr: 'أكاديمية أكسفورد السعودية للطيران',
    nameEn: 'Oxford Saudi Aviation Academy',
    logoUrl: '',
    websiteUrl: 'https://www.oxfordsaudiaviation.com',
    order: 6,
    published: true,
  },
];

const PartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    logoUrl: '',
    websiteUrl: '',
    published: true,
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const q = query(collection(db, 'partners'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Partner[];
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في تحميل الشركاء', 'Failed to load partners'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `partners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, await optimizeImage(file));
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, logoUrl: url }));
      toast({
        title: t('تم الرفع', 'Uploaded'),
        description: t('تم رفع الشعار بنجاح', 'Logo uploaded successfully'),
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في رفع الشعار', 'Failed to upload logo'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingPartner) {
        await updateDoc(doc(db, 'partners', editingPartner.id), {
          ...formData,
          updatedAt: new Date(),
        });
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث الشريك بنجاح', 'Partner updated successfully'),
        });
      } else {
        const maxOrder = partners.length > 0 ? Math.max(...partners.map(p => p.order || 0)) : 0;
        await addDoc(collection(db, 'partners'), {
          ...formData,
          order: maxOrder + 1,
          createdAt: new Date(),
        });
        toast({
          title: t('تمت الإضافة', 'Added'),
          description: t('تم إضافة الشريك بنجاح', 'Partner added successfully'),
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حفظ الشريك', 'Failed to save partner'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (!confirm(t('هل أنت متأكد من حذف هذا الشريك؟', 'Are you sure you want to delete this partner?'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'partners', partner.id));
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الشريك بنجاح', 'Partner deleted successfully'),
      });
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في حذف الشريك', 'Failed to delete partner'),
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      nameAr: partner.nameAr,
      nameEn: partner.nameEn,
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl,
      published: partner.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      logoUrl: '',
      websiteUrl: '',
      published: true,
    });
  };

  const togglePublish = async (partner: Partner) => {
    try {
      await updateDoc(doc(db, 'partners', partner.id), {
        published: !partner.published,
      });
      fetchPartners();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const seedSampleData = async () => {
    if (partners.length > 0) {
      if (!confirm(t('يوجد شركاء بالفعل. هل تريد إضافة بيانات تجريبية إضافية؟', 'Partners already exist. Add more sample data?'))) {
        return;
      }
    }

    setSeeding(true);
    try {
      for (const partner of samplePartners) {
        await addDoc(collection(db, 'partners'), {
          ...partner,
          createdAt: new Date(),
        });
      }
      toast({
        title: t('تم بنجاح', 'Success'),
        description: t('تم إضافة البيانات التجريبية', 'Sample data added successfully'),
      });
      fetchPartners();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في إضافة البيانات', 'Failed to add sample data'),
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('شركاء النجاح', 'Success Partners')}</h1>
          <p className="text-muted-foreground">{t('إدارة شركاء النجاح', 'Manage success partners')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedSampleData} disabled={seeding} className="gap-2">
            <Database className="w-4 h-4" />
            {seeding ? t('جاري الإضافة...', 'Adding...') : t('إضافة بيانات تجريبية', 'Add Sample Data')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('إضافة شريك', 'Add Partner')}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? t('تعديل الشريك', 'Edit Partner') : t('إضافة شريك جديد', 'Add New Partner')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('الاسم بالعربية', 'Name (Arabic)')}</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  required
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('الاسم بالإنجليزية', 'Name (English)')}</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('الشعار', 'Logo')}</Label>
                {formData.logoUrl ? (
                  <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden">
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploading ? t('جاري الرفع...', 'Uploading...') : t('اضغط لرفع الشعار', 'Click to upload logo')}
                      </p>
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('رابط الموقع', 'Website URL')}</Label>
                <Input
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('منشور', 'Published')}</Label>
                <Switch
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving || uploading} className="flex-1">
                  {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('إلغاء', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {partners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('لا يوجد شركاء بعد', 'No partners yet')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id} className={`relative ${!partner.published ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.nameEn}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-muted-foreground">
                      {partner.nameEn.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-center mb-1">{partner.nameAr}</h3>
                <p className="text-sm text-muted-foreground text-center mb-3">{partner.nameEn}</p>
                {partner.websiteUrl && (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-xs text-primary hover:underline mb-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t('زيارة الموقع', 'Visit Website')}
                  </a>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(partner)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => togglePublish(partner)}>
                    {partner.published ? t('إخفاء', 'Hide') : t('نشر', 'Publish')}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(partner)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnersManager;
