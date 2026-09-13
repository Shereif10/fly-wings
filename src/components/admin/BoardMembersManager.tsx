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

interface BoardMember {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string;
  bioEn: string;
  imageUrl: string;
  order: number;
}

const emptyMember: Omit<BoardMember, 'id'> = {
  nameAr: '',
  nameEn: '',
  positionAr: '',
  positionEn: '',
  bioAr: '',
  bioEn: '',
  imageUrl: '',
  order: 1,
};

const BoardMembersManager = () => {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [formData, setFormData] = useState<Omit<BoardMember, 'id'>>(emptyMember);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const seedDefaultData = async () => {
    const defaultMembers = [
      { nameAr: 'الأمير سلطان بن سلمان بن عبدالعزيز', nameEn: 'Prince Sultan bin Salman', positionAr: 'مؤسس ورئيس مجلس الإدارة', positionEn: 'Founder & Chairman', bioAr: 'قائد ملهم في مجال الطيران السعودي، يقود رؤية الشركة نحو التميز والريادة في صناعة الطيران.', bioEn: 'An inspiring leader in Saudi aviation, driving the company vision towards excellence.', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', order: 1 },
      { nameAr: 'الأمير سعود بن خالد الفيصل', nameEn: 'Prince Saud bin Khaled Al-Faisal', positionAr: 'نائب الرئيس مجلس الإدارة', positionEn: 'Vice Chairman', bioAr: 'خبرة واسعة في قيادة المؤسسات وتطوير قطاع الطيران في المملكة.', bioEn: 'Extensive experience in leading institutions and developing the aviation sector.', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', order: 2 },
    ];

    for (const member of defaultMembers) {
      await addDoc(collection(db, 'board_members'), member);
    }
    toast.success('تم إضافة البيانات الافتراضية');
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'board_members'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      // If empty, seed default data
      if (snapshot.empty) {
        await seedDefaultData();
        const newSnapshot = await getDocs(q);
        const fetched = newSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BoardMember));
        setMembers(fetched);
      } else {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BoardMember));
        setMembers(fetched);
      }
      console.log('Fetched board members:', members.length);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({ ...emptyMember, order: members.length + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: BoardMember) => {
    setEditingMember(member);
    setFormData({
      nameAr: member.nameAr,
      nameEn: member.nameEn,
      positionAr: member.positionAr,
      positionEn: member.positionEn,
      bioAr: member.bioAr,
      bioEn: member.bioEn,
      imageUrl: member.imageUrl,
      order: member.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nameAr.trim()) {
      toast.error('الرجاء إدخال اسم العضو');
      return;
    }

    setSaving(true);
    try {
      if (editingMember) {
        await updateDoc(doc(db, 'board_members', editingMember.id), formData);
        toast.success('تم التحديث بنجاح');
      } else {
        await addDoc(collection(db, 'board_members'), formData);
        toast.success('تمت الإضافة بنجاح');
      }
      
      setDialogOpen(false);
      setEditingMember(null);
      setFormData(emptyMember);
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('فشل في الحفظ');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteDoc(doc(db, 'board_members', id));
      toast.success('تم الحذف بنجاح');
      fetchMembers();
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
        <h2 className="text-2xl font-bold">إدارة مجلس الإدارة</h2>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة عضو
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">لا يوجد أعضاء في مجلس الإدارة</p>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول عضو
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
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
              {editingMember ? 'تعديل عضو' : 'إضافة عضو جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم (عربي) *</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="أدخل اسم العضو"
                />
              </div>
              <div>
                <Label>Name (English)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Enter member name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المنصب (عربي)</Label>
                <Input
                  value={formData.positionAr}
                  onChange={(e) => setFormData({ ...formData, positionAr: e.target.value })}
                  placeholder="رئيس مجلس الإدارة"
                />
              </div>
              <div>
                <Label>Position (English)</Label>
                <Input
                  value={formData.positionEn}
                  onChange={(e) => setFormData({ ...formData, positionEn: e.target.value })}
                  placeholder="Chairman"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السيرة (عربي)</Label>
                <Textarea
                  value={formData.bioAr}
                  onChange={(e) => setFormData({ ...formData, bioAr: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Bio (English)</Label>
                <Textarea
                  value={formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>صورة العضو</Label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="board-members"
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

export default BoardMembersManager;
