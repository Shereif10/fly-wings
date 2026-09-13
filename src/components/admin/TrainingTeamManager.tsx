import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

interface TeamMember {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string;
  bioEn: string;
  qualificationsAr: string[];
  qualificationsEn: string[];
  imageUrl: string;
  order: number;
}

const emptyMember: Omit<TeamMember, 'id'> = {
  nameAr: '',
  nameEn: '',
  positionAr: 'فريق التدريب',
  positionEn: 'Training Team',
  bioAr: '',
  bioEn: '',
  qualificationsAr: [],
  qualificationsEn: [],
  imageUrl: '',
  order: 1,
};

const TrainingTeamManager = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<Omit<TeamMember, 'id'>>(emptyMember);
  const [qualificationsAr, setQualificationsAr] = useState('');
  const [qualificationsEn, setQualificationsEn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const seedDefaultData = async () => {
    const defaultTeam = [
      { nameAr: 'فهد القحطاني', nameEn: 'Fahd Al-Qahtani', positionAr: 'فريق التدريب', positionEn: 'Training Team', bioAr: 'مدرب في مطار الثمامة (OETH)', bioEn: 'Instructor at Thumamah Airport (OETH)', qualificationsAr: ['GACA طيار تجاري (CPL)', 'مدرب طيران معتمد (CFI) / MEI / CFII'], qualificationsEn: ['GACA Commercial Pilot (CPL)', 'Certified Flight Instructor (CFI) / MEI / CFII'], imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', order: 1 },
      { nameAr: 'عبدالله العمران', nameEn: 'Abdullah Al-Omran', positionAr: 'فريق التدريب', positionEn: 'Training Team', bioAr: 'مدرب طيران متخصص في التدريب الأساسي والمتقدم.', bioEn: 'Flight instructor specialized in basic and advanced training.', qualificationsAr: ['طيار تجاري معتمد', 'مدرب طيران معتمد'], qualificationsEn: ['Certified Commercial Pilot', 'Certified Flight Instructor'], imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', order: 2 },
      { nameAr: 'عبدالله السقاف', nameEn: 'Abdullah Al-Saqqaf', positionAr: 'فريق التدريب', positionEn: 'Training Team', bioAr: 'خبرة واسعة في تدريب الطيارين الجدد.', bioEn: 'Extensive experience in training new pilots.', qualificationsAr: ['طيار تجاري معتمد', 'مدرب طيران معتمد'], qualificationsEn: ['Certified Commercial Pilot', 'Certified Flight Instructor'], imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', order: 3 },
    ];

    for (const member of defaultTeam) {
      await addDoc(collection(db, 'training_team'), member);
    }
    toast.success('تم إضافة البيانات الافتراضية');
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'training_team'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      // If empty, seed default data
      if (snapshot.empty) {
        await seedDefaultData();
        const newSnapshot = await getDocs(q);
        const fetched = newSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
        setTeam(fetched);
      } else {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
        setTeam(fetched);
      }
      console.log('Fetched team members:', team.length);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({ ...emptyMember, order: team.length + 1 });
    setQualificationsAr('');
    setQualificationsEn('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      nameAr: member.nameAr,
      nameEn: member.nameEn,
      positionAr: member.positionAr,
      positionEn: member.positionEn,
      bioAr: member.bioAr,
      bioEn: member.bioEn,
      qualificationsAr: member.qualificationsAr || [],
      qualificationsEn: member.qualificationsEn || [],
      imageUrl: member.imageUrl,
      order: member.order,
    });
    setQualificationsAr((member.qualificationsAr || []).join('\n'));
    setQualificationsEn((member.qualificationsEn || []).join('\n'));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nameAr.trim()) {
      toast.error('الرجاء إدخال اسم المدرب');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        qualificationsAr: qualificationsAr.split('\n').filter(q => q.trim()),
        qualificationsEn: qualificationsEn.split('\n').filter(q => q.trim()),
      };

      if (editingMember) {
        await updateDoc(doc(db, 'training_team', editingMember.id), dataToSave);
        toast.success('تم التحديث بنجاح');
      } else {
        await addDoc(collection(db, 'training_team'), dataToSave);
        toast.success('تمت الإضافة بنجاح');
      }
      
      setDialogOpen(false);
      setEditingMember(null);
      setFormData(emptyMember);
      setQualificationsAr('');
      setQualificationsEn('');
      fetchTeam();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('فشل في الحفظ');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteDoc(doc(db, 'training_team', id));
      toast.success('تم الحذف بنجاح');
      fetchTeam();
    } catch (error) {
      console.error('Error deleting member:', error);
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
        <h2 className="text-2xl font-bold">إدارة فريق التدريب</h2>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مدرب
        </Button>
      </div>

      {team.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">لا يوجد أعضاء في فريق التدريب</p>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول مدرب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {team.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {member.imageUrl && (
                      <img src={member.imageUrl} alt={member.nameAr} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div>
                      <span className="text-lg">{member.nameAr}</span>
                      <p className="text-sm text-muted-foreground font-normal">{member.positionAr}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(member)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(member.id)}>
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
              {editingMember ? 'تعديل مدرب' : 'إضافة مدرب جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم (عربي) *</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="أدخل اسم المدرب"
                />
              </div>
              <div>
                <Label>Name (English)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Enter trainer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المنصب (عربي)</Label>
                <Input
                  value={formData.positionAr}
                  onChange={(e) => setFormData({ ...formData, positionAr: e.target.value })}
                />
              </div>
              <div>
                <Label>Position (English)</Label>
                <Input
                  value={formData.positionEn}
                  onChange={(e) => setFormData({ ...formData, positionEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السيرة (عربي)</Label>
                <Textarea
                  value={formData.bioAr}
                  onChange={(e) => setFormData({ ...formData, bioAr: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Bio (English)</Label>
                <Textarea
                  value={formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المؤهلات (عربي) - سطر لكل مؤهل</Label>
                <Textarea
                  value={qualificationsAr}
                  onChange={(e) => setQualificationsAr(e.target.value)}
                  rows={4}
                  placeholder="GACA طيار تجاري (CPL)&#10;مدرب طيران معتمد (CFI)"
                />
              </div>
              <div>
                <Label>Qualifications (English) - one per line</Label>
                <Textarea
                  value={qualificationsEn}
                  onChange={(e) => setQualificationsEn(e.target.value)}
                  rows={4}
                  placeholder="GACA Commercial Pilot (CPL)&#10;Certified Flight Instructor (CFI)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>صورة المدرب</Label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="training-team"
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

export default TrainingTeamManager;
