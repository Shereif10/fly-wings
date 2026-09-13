import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Save, X, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface JourneyMilestone {
  id: string;
  year: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
}

interface JourneySettings {
  pageTitleAr: string;
  pageTitleEn: string;
  pageSubtitleAr: string;
  pageSubtitleEn: string;
}

const defaultSettings: JourneySettings = {
  pageTitleAr: 'انطلاقة الأكاديمية',
  pageTitleEn: 'Academy Launch',
  pageSubtitleAr: 'شاهد رحلة التحول منذ الانطلاقة 2000م وحتى اليوم',
  pageSubtitleEn: 'Watch our transformation journey from 2000 to today',
};

const emptyMilestone: Omit<JourneyMilestone, 'id'> = {
  year: '',
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  order: 1,
};

const JourneyManager = () => {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [settings, setSettings] = useState<JourneySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<JourneyMilestone | null>(null);
  const [formData, setFormData] = useState<Omit<JourneyMilestone, 'id'>>(emptyMilestone);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const seedDefaultData = async () => {
    const defaultMilestones = [
      { year: '2000', titleAr: 'التأسيس', titleEn: 'Foundation', descriptionAr: 'تأسيس أجنحة الطيران كشركة رائدة في التدريب على الطيران في المملكة العربية السعودية.', descriptionEn: 'Fly Wings was established as a leading aviation training company in Saudi Arabia.', order: 1 },
      { year: '2010', titleAr: 'التوسع', titleEn: 'Expansion', descriptionAr: 'توسيع نطاق الخدمات والبرامج التدريبية لتشمل مختلف مجالات الطيران.', descriptionEn: 'Expanding services and training programs to cover various aviation fields.', order: 2 },
      { year: '2015', titleAr: 'الاعتماد الدولي', titleEn: 'International Accreditation', descriptionAr: 'الحصول على الاعتمادات الدولية من هيئات الطيران العالمية.', descriptionEn: 'Obtaining international accreditations from global aviation authorities.', order: 3 },
      { year: '2020', titleAr: 'رؤية 2030', titleEn: 'Vision 2030', descriptionAr: 'المساهمة في تحقيق رؤية المملكة 2030 بتأهيل كوادر سعودية في مجال الطيران.', descriptionEn: 'Contributing to achieving Saudi Vision 2030 by qualifying Saudi talents in aviation.', order: 4 },
    ];

    for (const milestone of defaultMilestones) {
      await addDoc(collection(db, 'journey_milestones'), milestone);
    }
    toast.success('تم إضافة البيانات الافتراضية');
  };

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const settingsDoc = await getDoc(doc(db, 'site_settings', 'journey'));
      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() } as JourneySettings);
      }

      const q = query(collection(db, 'journey_milestones'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      // If empty, seed default data
      if (snapshot.empty) {
        await seedDefaultData();
        // Re-fetch after seeding
        const newSnapshot = await getDocs(q);
        const fetched = newSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JourneyMilestone));
        setMilestones(fetched);
      } else {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JourneyMilestone));
        setMilestones(fetched);
      }
      console.log('Fetched milestones:', milestones.length);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'site_settings', 'journey'), settings);
      toast.success('تم حفظ إعدادات الصفحة');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    }
    setSavingSettings(false);
  };

  const handleOpenAdd = () => {
    setEditingMilestone(null);
    setFormData({ ...emptyMilestone, order: milestones.length + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (milestone: JourneyMilestone) => {
    setEditingMilestone(milestone);
    setFormData({
      year: milestone.year,
      titleAr: milestone.titleAr,
      titleEn: milestone.titleEn,
      descriptionAr: milestone.descriptionAr,
      descriptionEn: milestone.descriptionEn,
      order: milestone.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.year.trim() || !formData.titleAr.trim()) {
      toast.error('الرجاء إدخال السنة والعنوان');
      return;
    }

    setSaving(true);
    try {
      if (editingMilestone) {
        await updateDoc(doc(db, 'journey_milestones', editingMilestone.id), formData);
        toast.success('تم التحديث بنجاح');
      } else {
        await addDoc(collection(db, 'journey_milestones'), formData);
        toast.success('تمت الإضافة بنجاح');
      }
      
      setDialogOpen(false);
      setEditingMilestone(null);
      setFormData(emptyMilestone);
      fetchMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast.error('فشل في الحفظ');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteDoc(doc(db, 'journey_milestones', id));
      toast.success('تم الحذف بنجاح');
      fetchMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('فشل في الحذف');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة انطلاقة الأكاديمية</h2>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة محطة
        </Button>
      </div>

      {/* Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات الصفحة
          </CardTitle>
          <CardDescription>العنوان والوصف الذي يظهر في أعلى صفحة انطلاقة الأكاديمية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>عنوان الصفحة (عربي)</Label>
              <Input
                value={settings.pageTitleAr}
                onChange={(e) => setSettings({ ...settings, pageTitleAr: e.target.value })}
                placeholder="انطلاقة الأكاديمية"
              />
            </div>
            <div>
              <Label>Page Title (English)</Label>
              <Input
                value={settings.pageTitleEn}
                onChange={(e) => setSettings({ ...settings, pageTitleEn: e.target.value })}
                placeholder="Academy Launch"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الوصف (عربي)</Label>
              <Textarea
                value={settings.pageSubtitleAr}
                onChange={(e) => setSettings({ ...settings, pageSubtitleAr: e.target.value })}
                placeholder="شاهد رحلة التحول منذ الانطلاقة..."
                rows={2}
              />
            </div>
            <div>
              <Label>Description (English)</Label>
              <Textarea
                value={settings.pageSubtitleEn}
                onChange={(e) => setSettings({ ...settings, pageSubtitleEn: e.target.value })}
                placeholder="Watch our transformation journey..."
                rows={2}
              />
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            <Save className="w-4 h-4 ml-2" />
            {savingSettings ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </CardContent>
      </Card>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">لا توجد محطات في انطلاقة الأكاديمية</p>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول محطة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <div>
                    <span className="text-lg">{milestone.year} - {milestone.titleAr}</span>
                    <p className="text-sm text-muted-foreground font-normal line-clamp-1">{milestone.descriptionAr}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(milestone)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(milestone.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'تعديل محطة' : 'إضافة محطة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السنة *</Label>
                <Input
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>العنوان (عربي) *</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="التأسيس"
                />
              </div>
              <div>
                <Label>Title (English)</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Foundation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Description (English)</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 ml-2" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JourneyManager;
