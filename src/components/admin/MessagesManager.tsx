import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Mail, Trash2, Eye, Search, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MessagesManager = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const deleteMessage = async (id: string) => {
    if (!confirm(t('هل أنت متأكد؟', 'Are you sure?'))) return;
    
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      setMessages(prev => prev.filter(msg => msg.id !== id));
      toast({ title: t('تم الحذف', 'Deleted') });
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const markAsRead = async (msg: any) => {
    if (!msg.read) {
      await updateDoc(doc(db, 'contact_messages', msg.id), { read: true });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
    setSelectedMsg(msg);
  };

  const filteredMsgs = messages.filter(msg =>
    msg.name?.toLowerCase().includes(search.toLowerCase()) ||
    msg.email?.toLowerCase().includes(search.toLowerCase()) ||
    msg.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('الرسائل', 'Messages')}</h1>
          <p className="text-muted-foreground">{t('رسائل التواصل من الزوار', 'Contact messages from visitors')}</p>
        </div>
        
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('بحث...', 'Search...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 w-64"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredMsgs.map((msg) => (
          <motion.div
            key={msg.id}
            className={`bg-card rounded-2xl p-6 border shadow-soft cursor-pointer hover:border-primary/50 transition-colors ${
              !msg.read ? 'border-s-4 border-s-primary' : ''
            }`}
            onClick={() => markAsRead(msg)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {msg.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {msg.name}
                      <Badge variant={msg.read ? 'secondary' : 'default'} className="text-[10px] px-2 py-0">
                        {msg.read ? t('مقروءة', 'Read') : t('غير مقروءة', 'Unread')}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">{msg.email}</p>
                  </div>
                </div>
                <p className="text-foreground line-clamp-2">{msg.message}</p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                    <a href={`mailto:${msg.email}`} onClick={(e) => e.stopPropagation()}>
                      <Mail className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredMsgs.length === 0 && (
          <div className="bg-card rounded-2xl p-12 text-center text-muted-foreground border">
            {t('لا توجد رسائل', 'No messages found')}
          </div>
        )}
      </div>

      {/* Message Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={() => setSelectedMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('تفاصيل الرسالة', 'Message Details')}</DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                  {selectedMsg.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedMsg.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMsg.email}</p>
                  {selectedMsg.phone && <p className="text-sm text-muted-foreground" dir="ltr">{selectedMsg.phone}</p>}
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-foreground whitespace-pre-wrap">{selectedMsg.message}</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <a href={`mailto:${selectedMsg.email}`}>
                    <Mail className="w-4 h-4 me-2" />
                    {t('رد عبر البريد', 'Reply via Email')}
                  </a>
                </Button>
                {selectedMsg.phone && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                    <a href={`https://wa.me/${selectedMsg.phone.replace(/\D/g, '').replace(/^0/, '966')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 me-2" />
                      {t('رد عبر واتساب', 'Reply via WhatsApp')}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesManager;
