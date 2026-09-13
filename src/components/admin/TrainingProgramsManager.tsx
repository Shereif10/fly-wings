import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import RichTextEditor from './RichTextEditor';

interface TrainingProgram {
  id: string;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationAr: string;
  durationEn: string;
  imageUrl: string;
  order: number;
  published: boolean;
}

const defaultProgram: Omit<TrainingProgram, 'id'> = {
  titleAr: '',
  titleEn: '',
  shortDescAr: '',
  shortDescEn: '',
  descriptionAr: '',
  descriptionEn: '',
  durationAr: '',
  durationEn: '',
  imageUrl: '',
  order: 0,
  published: true,
};

const TrainingProgramsManager = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [formData, setFormData] = useState<Omit<TrainingProgram, 'id'>>(defaultProgram);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const q = query(collection(db, 'training_programs'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram)));
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({ title: 'خطأ في تحميل البرامج', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `training_programs/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, await optimizeImage(file));
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast({ title: 'تم رفع الصورة بنجاح' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'خطأ في رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titleAr || !formData.titleEn) {
      toast({ title: 'يرجى إدخال عنوان البرنامج', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingProgram) {
        await updateDoc(doc(db, 'training_programs', editingProgram.id), formData);
        toast({ title: 'تم تحديث البرنامج بنجاح' });
      } else {
        const newOrder = programs.length > 0 ? Math.max(...programs.map(p => p.order)) + 1 : 1;
        await addDoc(collection(db, 'training_programs'), { ...formData, order: newOrder });
        toast({ title: 'تم إضافة البرنامج بنجاح' });
      }
      setDialogOpen(false);
      setEditingProgram(null);
      setFormData(defaultProgram);
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast({ title: 'خطأ في حفظ البرنامج', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البرنامج؟')) return;

    try {
      await deleteDoc(doc(db, 'training_programs', id));
      toast({ title: 'تم حذف البرنامج بنجاح' });
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({ title: 'خطأ في حذف البرنامج', variant: 'destructive' });
    }
  };

  const handleTogglePublish = async (program: TrainingProgram) => {
    try {
      await updateDoc(doc(db, 'training_programs', program.id), { published: !program.published });
      fetchPrograms();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const openEditDialog = (program: TrainingProgram) => {
    setEditingProgram(program);
    setFormData({
      titleAr: program.titleAr,
      titleEn: program.titleEn,
      shortDescAr: program.shortDescAr,
      shortDescEn: program.shortDescEn,
      descriptionAr: program.descriptionAr,
      descriptionEn: program.descriptionEn,
      durationAr: program.durationAr || '',
      durationEn: program.durationEn || '',
      imageUrl: program.imageUrl,
      order: program.order,
      published: program.published,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingProgram(null);
    setFormData(defaultProgram);
    setDialogOpen(true);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">مراحل التدريب</h2>
          <p className="text-muted-foreground">إدارة مراحل التدريب المختلفة</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مرحلة
        </Button>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {programs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <p className="text-muted-foreground">لا توجد مراحل تدريب بعد</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              إضافة أول مرحلة
            </Button>
          </div>
        ) : (
          programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {program.imageUrl ? (
                  <img src={program.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-bold">
                    المرحلة {index + 1}
                  </span>
                  {!program.published && (
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                      مخفي
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mt-1 truncate">{program.titleAr}</h3>
                <p className="text-sm text-muted-foreground truncate">{program.shortDescAr}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTogglePublish(program)}
                  className="rounded-lg"
                >
                  {program.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(program)}
                  className="rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(program.id)}
                  className="rounded-lg text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'تعديل مرحلة التدريب' : 'إضافة مرحلة تدريب جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>صورة المرحلة</Label>
              <div className="flex items-start gap-4">
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Upload className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                  </Button>
                  <Input
                    placeholder="أو أدخل رابط الصورة"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي) *</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                  placeholder="مثال: اللغة الإنجليزية"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                  placeholder="e.g., English Language"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف المختصر (عربي)</Label>
                <Textarea
                  value={formData.shortDescAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescAr: e.target.value }))}
                  placeholder="وصف مختصر يظهر في القائمة"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Short Description (English)</Label>
                <Textarea
                  value={formData.shortDescEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescEn: e.target.value }))}
                  placeholder="Short description for listing"
                  rows={2}
                />
              </div>
            </div>

            {/* Full Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف الكامل (عربي)</Label>
                <RichTextEditor
                  value={formData.descriptionAr}
                  onChange={(val) => setFormData(prev => ({ ...prev, descriptionAr: val }))}
                  dir="rtl"
                  minHeight="240px"
                />
              </div>
              <div className="space-y-2">
                <Label>Full Description (English)</Label>
                <RichTextEditor
                  value={formData.descriptionEn}
                  onChange={(val) => setFormData(prev => ({ ...prev, descriptionEn: val }))}
                  dir="ltr"
                  minHeight="240px"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مدة البرنامج (عربي)</Label>
                <Input
                  value={formData.durationAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationAr: e.target.value }))}
                  placeholder="مثال: 9 أشهر"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (English)</Label>
                <Input
                  value={formData.durationEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationEn: e.target.value }))}
                  placeholder="e.g., 9 months"
                />
              </div>
            </div>

            {/* Published */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>نشر المرحلة</Label>
                <p className="text-sm text-muted-foreground">إظهار المرحلة في الموقع</p>
              </div>
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'جاري الحفظ...' : editingProgram ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingProgramsManager;