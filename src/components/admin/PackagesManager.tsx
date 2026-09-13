import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import RichTextEditor from './RichTextEditor';

interface Package {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fullDescriptionAr?: string;
  fullDescriptionEn?: string;
  price: number;
  durationAr: string;
  durationEn: string;
  featuresAr: string[];
  featuresEn: string[];
  licensesAr: string[];
  licensesEn: string[];
  imageUrl?: string;
  popular: boolean;
  active: boolean;
  order: number;
}

const defaultPackages: Omit<Package, 'id'>[] = [
  {
    nameAr: 'الشريحة الأولى - تأسيسية',
    nameEn: 'Tier 1 - Foundation',
    descriptionAr: 'بدءاً من دراسة اللغة الإنجليزية هذه الشريحة وتتضمن برنامج تدريبي شامل ومتكامل لدراسة الطيران',
    descriptionEn: 'Starting with English language study, this tier includes a comprehensive training program for aviation',
    fullDescriptionAr: 'بدءاً من دراسة اللغة الإنجليزية هذه الشريحة وتتضمن برنامج تدريبي شامل ومتكامل لدراسة الطيران، ويمر الطالب بمنهج دراسة الطيران النظري وتنتهي بالتدريب العملي على 3 رخص طيران\n\nوسعياً من فريق اجنحة الطيران لمساعدة الطلاب الراغبين في دراسة الطيران لدينا وتسهيلا عليهم في دفع الرسوم فقد خفضنا سعر الدراسة وكذلك اعتمدنا نظام الدفعات المالية الجديد',
    fullDescriptionEn: 'Starting with English language study, this tier includes a comprehensive training program for aviation. The student goes through theoretical aviation study curriculum and ends with practical training on 3 aviation licenses.\n\nIn our effort to help students who wish to study aviation and facilitate payment, we have reduced study fees and adopted a new payment system.',
    price: 250000,
    durationAr: 'من 18 شهراً إلى 24 شهراً',
    durationEn: '18 to 24 months',
    featuresAr: [
      'دورة لغة انجليزية عامة ولغة الطيران',
      'دورة دراسة الطيران النظرية لعلوم الطيران',
      'دورة الطيران العملي دراسة الطيران العملي لجميع الرخص (PPL - CPL - IR)',
      'تجهيز إجراءات تأشيرة الدراسة',
      'رسوم التأشيرة',
      'تسليم زي الطيارين عدد (2)',
      'التكفل بجميع رسوم الاختبارات التحريرية والعملية للمرة الأولى',
      'المساعدة في معادلة الرخص إلى رخص سعودية',
      'المساعدة في التقديم على شركات الطيران',
      'دورة تأهيلية لاجتياز اختبارات القبول والمقابلة الشخصية بشركات الطيران'
    ],
    featuresEn: [
      'General English and Aviation English course',
      'Theoretical aviation study course',
      'Practical flight training for all licenses (PPL - CPL - IR)',
      'Visa processing assistance',
      'Visa fees',
      'Pilot uniforms (2 sets)',
      'Coverage of all exam fees for first attempt',
      'Assistance in license conversion to Saudi licenses',
      'Assistance in applying to airlines',
      'Preparatory course for airline acceptance tests and interviews'
    ],
    licensesAr: ['رخصة الطيار الخاص (PPL)', 'رخصة الطيران الآلي (IR)', 'رخصة الطيار التجاري (CPL)'],
    licensesEn: ['Private Pilot License (PPL)', 'Instrument Rating (IR)', 'Commercial Pilot License (CPL)'],
    popular: false,
    active: true,
    order: 1,
  },
  {
    nameAr: 'الشريحة الثانية - بدون اللغة',
    nameEn: 'Tier 2 - Without Language',
    descriptionAr: 'تبدأ هذه الشريحة بدورة مصطلحات الطيران باللغة الإنجليزية، وتعتبر شريحة متقدمة ومخصصة للذين يمتلكون لغة',
    descriptionEn: 'This tier starts with aviation terminology in English, designed for those with English proficiency',
    price: 200000,
    durationAr: 'من 14 شهراً إلى 18 شهراً',
    durationEn: '14 to 18 months',
    featuresAr: ['دورة مصطلحات الطيران', 'الدراسة النظرية', 'التدريب العملي 250 ساعة'],
    featuresEn: ['Aviation Terminology', 'Theoretical Study', 'Practical Training 250 hours'],
    licensesAr: ['رخصة الطيار الخاص (PPL)', 'رخصة الطيران الآلي (IR)', 'رخصة الطيار التجاري (CPL)'],
    licensesEn: ['Private Pilot License (PPL)', 'Instrument Rating (IR)', 'Commercial Pilot License (CPL)'],
    popular: true,
    active: true,
    order: 2,
  },
  {
    nameAr: 'الشريحة الثالثة - متقدمة',
    nameEn: 'Tier 3 - Advanced',
    descriptionAr: 'شريحة متقدمة تتضمن برنامج طيران عملي فقط، مع بعض المزايا الأخرى في بلد الابتعاث',
    descriptionEn: 'Advanced tier with practical flight program only, with additional benefits abroad',
    price: 180000,
    durationAr: 'من 12 شهراً إلى 16 شهراً',
    durationEn: '12 to 16 months',
    featuresAr: ['التدريب العملي', 'السكن', 'المواصلات'],
    featuresEn: ['Practical Training', 'Accommodation', 'Transportation'],
    licensesAr: ['رخصة الطيار الخاص (PPL)', 'رخصة الطيران الآلي (IR)', 'رخصة الطيار التجاري (CPL)'],
    licensesEn: ['Private Pilot License (PPL)', 'Instrument Rating (IR)', 'Commercial Pilot License (CPL)'],
    popular: false,
    active: true,
    order: 3,
  },
];

const PackagesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    nameAr: '', nameEn: '', 
    descriptionAr: '', descriptionEn: '',
    fullDescriptionAr: '', fullDescriptionEn: '',
    price: 0,
    durationAr: '', durationEn: '',
    featuresAr: '', featuresEn: '',
    licensesAr: '', licensesEn: '',
    imageUrl: '',
    popular: false, active: true,
  });

  const fetchPackages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'packages'));
      if (snapshot.empty) {
        for (let i = 0; i < defaultPackages.length; i++) {
          await addDoc(collection(db, 'packages'), defaultPackages[i]);
        }
        fetchPackages();
        return;
      }
      const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(pkgs.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('يجب اختيار صورة', 'Please select an image'), variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('حجم الصورة كبير جداً', 'Image too large'), variant: 'destructive' });
      return;
    }

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `packages/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast({ title: t('خطأ في رفع الصورة', 'Upload error'), variant: 'destructive' });
          setUploadProgress(0);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
          setUploadProgress(0);
          toast({ title: t('تم رفع الصورة', 'Image uploaded') });
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: t('خطأ في رفع الصورة', 'Upload error'), variant: 'destructive' });
    }
  };

  const openDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        nameAr: pkg.nameAr, nameEn: pkg.nameEn,
        descriptionAr: pkg.descriptionAr, descriptionEn: pkg.descriptionEn,
        fullDescriptionAr: pkg.fullDescriptionAr || '', fullDescriptionEn: pkg.fullDescriptionEn || '',
        price: pkg.price || 0,
        durationAr: pkg.durationAr || '', durationEn: pkg.durationEn || '',
        featuresAr: pkg.featuresAr?.join('\n') || '', featuresEn: pkg.featuresEn?.join('\n') || '',
        licensesAr: pkg.licensesAr?.join('\n') || '', licensesEn: pkg.licensesEn?.join('\n') || '',
        imageUrl: pkg.imageUrl || '',
        popular: pkg.popular, active: pkg.active,
      });
    } else {
      setEditingPkg(null);
      setFormData({
        nameAr: '', nameEn: '', 
        descriptionAr: '', descriptionEn: '',
        fullDescriptionAr: '', fullDescriptionEn: '',
        price: 0,
        durationAr: '', durationEn: '',
        featuresAr: '', featuresEn: '',
        licensesAr: '', licensesEn: '',
        imageUrl: '',
        popular: false, active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        nameAr: formData.nameAr, nameEn: formData.nameEn,
        descriptionAr: formData.descriptionAr, descriptionEn: formData.descriptionEn,
        fullDescriptionAr: formData.fullDescriptionAr, fullDescriptionEn: formData.fullDescriptionEn,
        price: Number(formData.price) || 0,
        durationAr: formData.durationAr, durationEn: formData.durationEn,
        featuresAr: formData.featuresAr.split('\n').filter(f => f.trim()),
        featuresEn: formData.featuresEn.split('\n').filter(f => f.trim()),
        licensesAr: formData.licensesAr.split('\n').filter(f => f.trim()),
        licensesEn: formData.licensesEn.split('\n').filter(f => f.trim()),
        imageUrl: formData.imageUrl,
        popular: formData.popular, active: formData.active,
        order: editingPkg?.order || packages.length + 1,
        updatedAt: new Date().toISOString(),
      };

      if (editingPkg) {
        await setDoc(doc(db, 'packages', editingPkg.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'packages'), { ...data, createdAt: new Date().toISOString() });
      }

      toast({ title: t('تم الحفظ', 'Saved successfully') });
      setIsDialogOpen(false);
      fetchPackages();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
      toast({ title: t('تم الحذف', 'Deleted') });
      fetchPackages();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const toggleActive = async (pkg: Package) => {
    await setDoc(doc(db, 'packages', pkg.id), { active: !pkg.active }, { merge: true });
    fetchPackages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('الباقات التدريبية', 'Training Packages')}</h1>
          <p className="text-muted-foreground">{t('إدارة الباقات التدريبية', 'Manage training packages')}</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة برنامج', 'Add Package')}
        </Button>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            className={`bg-card rounded-2xl p-6 border shadow-soft ${!pkg.active ? 'opacity-60' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-foreground">{pkg.nameAr}</h3>
                    {pkg.popular && (
                      <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                        {t('الأكثر طلباً', 'Popular')}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{pkg.descriptionAr}</p>
                  {pkg.price > 0 && (
                    <p className="text-lg font-bold text-primary mb-2">
                      {pkg.price.toLocaleString()} {t('ريال', 'SAR')}
                    </p>
                  )}
                  {pkg.durationAr && (
                    <p className="text-sm text-muted-foreground">{pkg.durationAr}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => toggleActive(pkg)}>
                  {pkg.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openDialog(pkg)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPkg ? t('تعديل البرنامج', 'Edit Package') : t('إضافة برنامج', 'Add Package')}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Image Upload */}
            <div>
              <Label>{t('صورة الشريحة', 'Package Image')}</Label>
              <div className="mt-2">
                {formData.imageUrl ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden">
                    <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-2 right-2 w-8 h-8"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('اضغط لرفع صورة', 'Click to upload')}</p>
                    {uploadProgress > 0 && (
                      <div className="w-32 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('الاسم (عربي)', 'Name (Arabic)')}</Label>
                <Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('الاسم (إنجليزي)', 'Name (English)')}</Label>
                <Input value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('الوصف المختصر (عربي)', 'Short Description (Arabic)')}</Label>
                <Textarea value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} rows={2} />
              </div>
              <div>
                <Label>{t('الوصف المختصر (إنجليزي)', 'Short Description (English)')}</Label>
                <Textarea value={formData.descriptionEn} onChange={e => setFormData({...formData, descriptionEn: e.target.value})} rows={2} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('الوصف الكامل (عربي)', 'Full Description (Arabic)')}</Label>
                <RichTextEditor value={formData.fullDescriptionAr} onChange={val => setFormData({...formData, fullDescriptionAr: val})} dir="rtl" minHeight="220px" />
              </div>
              <div>
                <Label>{t('الوصف الكامل (إنجليزي)', 'Full Description (English)')}</Label>
                <RichTextEditor value={formData.fullDescriptionEn} onChange={val => setFormData({...formData, fullDescriptionEn: val})} dir="ltr" minHeight="220px" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('المدة (عربي)', 'Duration (Arabic)')}</Label>
                <Input value={formData.durationAr} onChange={e => setFormData({...formData, durationAr: e.target.value})} placeholder="مثال: من 18 شهراً إلى 24 شهراً" />
              </div>
              <div>
                <Label>{t('المدة (إنجليزي)', 'Duration (English)')}</Label>
                <Input value={formData.durationEn} onChange={e => setFormData({...formData, durationEn: e.target.value})} placeholder="e.g. 18 to 24 months" />
              </div>
            </div>

            <div>
              <Label>{t('السعر (ريال)', 'Price (SAR)')}</Label>
              <Input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                placeholder="250000" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('الرخص (عربي) - سطر لكل رخصة', 'Licenses (Arabic) - one per line')}</Label>
                <Textarea rows={3} value={formData.licensesAr} onChange={e => setFormData({...formData, licensesAr: e.target.value})} placeholder="رخصة الطيار الخاص (PPL)&#10;رخصة الطيران الآلي (IR)" />
              </div>
              <div>
                <Label>{t('الرخص (إنجليزي)', 'Licenses (English)')}</Label>
                <Textarea rows={3} value={formData.licensesEn} onChange={e => setFormData({...formData, licensesEn: e.target.value})} placeholder="Private Pilot License (PPL)&#10;Instrument Rating (IR)" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('المميزات (عربي) - سطر لكل ميزة', 'Features (Arabic) - one per line')}</Label>
                <Textarea rows={5} value={formData.featuresAr} onChange={e => setFormData({...formData, featuresAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('المميزات (إنجليزي)', 'Features (English)')}</Label>
                <Textarea rows={5} value={formData.featuresEn} onChange={e => setFormData({...formData, featuresEn: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.popular} onCheckedChange={v => setFormData({...formData, popular: v})} />
                <Label>{t('الأكثر طلباً', 'Most Popular')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.active} onCheckedChange={v => setFormData({...formData, active: v})} />
                <Label>{t('نشط', 'Active')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
            <Button onClick={handleSave}>{t('حفظ', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesManager;
