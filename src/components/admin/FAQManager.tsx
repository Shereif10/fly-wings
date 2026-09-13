import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FAQ {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  order: number;
}

const defaultFAQs: Omit<FAQ, 'id'>[] = [
  { questionAr: 'ما هي متطلبات التسجيل؟', questionEn: 'What are the registration requirements?', answerAr: 'يجب أن يكون المتقدم حاصلاً على شهادة الثانوية العامة وأن يكون عمره بين 17-35 سنة.', answerEn: 'Applicants must have a high school diploma and be between 17-35 years old.', order: 1 },
  { questionAr: 'كم تستغرق مدة التدريب؟', questionEn: 'How long is the training?', answerAr: 'تتراوح مدة التدريب بين 18-24 شهراً حسب البرنامج المختار.', answerEn: 'Training duration ranges from 18-24 months depending on the program.', order: 2 },
  { questionAr: 'هل يوجد تمويل للرسوم؟', questionEn: 'Is there financing available?', answerAr: 'نعم، نقدم خيارات تمويل متعددة بالتعاون مع عدة بنوك سعودية.', answerEn: 'Yes, we offer multiple financing options with Saudi banks.', order: 3 },
];

const FAQManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({ questionAr: '', questionEn: '', answerAr: '', answerEn: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFAQs = async () => {
    try {
      const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        for (const faq of defaultFAQs) {
          await addDoc(collection(db, 'faqs'), faq);
        }
        fetchFAQs();
        return;
      }
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ)));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const openDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        questionAr: faq.questionAr, questionEn: faq.questionEn,
        answerAr: faq.answerAr, answerEn: faq.answerEn,
      });
    } else {
      setEditingFaq(null);
      setFormData({ questionAr: '', questionEn: '', answerAr: '', answerEn: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        order: editingFaq?.order || faqs.length + 1,
        updatedAt: new Date().toISOString(),
      };

      if (editingFaq) {
        await setDoc(doc(db, 'faqs', editingFaq.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'faqs'), { ...data, createdAt: new Date().toISOString() });
      }

      toast({ title: t('تم الحفظ', 'Saved successfully') });
      setIsDialogOpen(false);
      fetchFAQs();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد؟', 'Are you sure?'))) return;
    try {
      await deleteDoc(doc(db, 'faqs', id));
      toast({ title: t('تم الحذف', 'Deleted') });
      fetchFAQs();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('الأسئلة الشائعة', 'FAQ')}</h1>
          <p className="text-muted-foreground">{t('إدارة الأسئلة والأجوبة', 'Manage questions and answers')}</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('سؤال جديد', 'New Question')}
        </Button>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            className="bg-card rounded-2xl border shadow-soft overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            >
              <div className="p-2 cursor-grab text-muted-foreground">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{faq.questionAr}</h3>
                <p className="text-sm text-muted-foreground">{faq.questionEn}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openDialog(faq); }}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedId === faq.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
            
            {expandedId === faq.id && (
              <motion.div
                className="px-4 pb-4 ps-16 border-t bg-muted/30"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <div className="pt-4 space-y-2">
                  <p className="text-foreground">{faq.answerAr}</p>
                  <p className="text-muted-foreground text-sm">{faq.answerEn}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? t('تعديل السؤال', 'Edit Question') : t('سؤال جديد', 'New Question')}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('السؤال (عربي)', 'Question (Arabic)')}</Label>
                <Input value={formData.questionAr} onChange={e => setFormData({...formData, questionAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('السؤال (إنجليزي)', 'Question (English)')}</Label>
                <Input value={formData.questionEn} onChange={e => setFormData({...formData, questionEn: e.target.value})} />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{t('الإجابة (عربي)', 'Answer (Arabic)')}</Label>
                <Textarea rows={4} value={formData.answerAr} onChange={e => setFormData({...formData, answerAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('الإجابة (إنجليزي)', 'Answer (English)')}</Label>
                <Textarea rows={4} value={formData.answerEn} onChange={e => setFormData({...formData, answerEn: e.target.value})} />
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

export default FAQManager;
