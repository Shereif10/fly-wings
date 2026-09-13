import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Phone, Mail, Eye, Search, Filter, User, Calendar, Package, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Application {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  subject?: string;
  message?: string;
  packageId?: string;
  packageName?: string;
  age?: string;
  education?: string;
  englishLevel?: string;
  status: string;
  createdAt: string;
}

const ApplicationsManager = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      toast({
        title: t('تم التحديث', 'Updated'),
        description: t('تم تحديث حالة الطلب', 'Application status updated'),
      });
    } catch (error) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحديث الحالة', 'Failed to update status'),
        variant: 'destructive',
      });
    }
  };

  const getDisplayName = (app: Application) => {
    if (app.firstName && app.lastName) {
      return `${app.firstName} ${app.lastName}`;
    }
    return app.fullName || t('غير محدد', 'Unknown');
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const name = getDisplayName(app).toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) ||
                         app.email?.toLowerCase().includes(search.toLowerCase()) ||
                         app.phone?.includes(search);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'closed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('طلبات التسجيل', 'Registration Applications')}</h1>
          <p className="text-muted-foreground">{t('إدارة جميع طلبات التسجيل والاستفسارات', 'Manage all registration requests and inquiries')}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('بحث بالاسم أو البريد...', 'Search by name or email...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 w-64 rounded-xl"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('الكل', 'All')} ({applications.length})</SelectItem>
              <SelectItem value="new">{t('جديد', 'New')} ({applications.filter(a => a.status === 'new').length})</SelectItem>
              <SelectItem value="contacted">{t('تم التواصل', 'Contacted')} ({applications.filter(a => a.status === 'contacted').length})</SelectItem>
              <SelectItem value="closed">{t('مغلق', 'Closed')} ({applications.filter(a => a.status === 'closed').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-card rounded-2xl p-5 border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              <p className="text-sm text-muted-foreground">{t('إجمالي الطلبات', 'Total')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-2xl p-5 border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.filter(a => a.status === 'new').length}</p>
              <p className="text-sm text-muted-foreground">{t('جديد', 'New')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-2xl p-5 border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.filter(a => a.status === 'contacted').length}</p>
              <p className="text-sm text-muted-foreground">{t('تم التواصل', 'Contacted')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-2xl p-5 border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.filter(a => a.status === 'closed').length}</p>
              <p className="text-sm text-muted-foreground">{t('مغلق', 'Closed')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Applications Table */}
      <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-semibold text-foreground">{t('المتقدم', 'Applicant')}</th>
                <th className="px-6 py-4 text-start text-sm font-semibold text-foreground">{t('الشريحة', 'Package')}</th>
                <th className="px-6 py-4 text-start text-sm font-semibold text-foreground">{t('التاريخ', 'Date')}</th>
                <th className="px-6 py-4 text-start text-sm font-semibold text-foreground">{t('الحالة', 'Status')}</th>
                <th className="px-6 py-4 text-start text-sm font-semibold text-foreground">{t('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApps.map((app, index) => (
                <motion.tr 
                  key={app.id} 
                  className="hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {getDisplayName(app).charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{getDisplayName(app)}</p>
                        <p className="text-sm text-muted-foreground">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{app.packageName || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Select value={app.status || 'new'} onValueChange={(val) => updateStatus(app.id, val)}>
                      <SelectTrigger className={`w-32 h-9 text-xs font-medium rounded-lg border ${getStatusColor(app.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t('جديد', 'New')}</SelectItem>
                        <SelectItem value="contacted">{t('تم التواصل', 'Contacted')}</SelectItem>
                        <SelectItem value="closed">{t('مغلق', 'Closed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10" onClick={() => setSelectedApp(app)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-green-100" asChild>
                        <a href={`tel:${app.phone}`}><Phone className="w-4 h-4 text-green-600" /></a>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-blue-100" asChild>
                        <a href={`mailto:${app.email}`}><Mail className="w-4 h-4 text-blue-600" /></a>
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApps.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">{t('لا توجد طلبات', 'No applications found')}</p>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl">{t('تفاصيل الطلب', 'Application Details')}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-5 pt-4">
              {/* Applicant Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {getDisplayName(selectedApp).charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{getDisplayName(selectedApp)}</h3>
                  <p className="text-muted-foreground">{selectedApp.email}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('الجوال', 'Phone')}</p>
                  <p className="font-semibold text-foreground" dir="ltr">{selectedApp.phone || '-'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('النوع', 'Gender')}</p>
                  <p className="font-semibold text-foreground">
                    {selectedApp.gender === 'male' ? t('ذكر', 'Male') : selectedApp.gender === 'female' ? t('أنثى', 'Female') : '-'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('العمر', 'Age')}</p>
                  <p className="font-semibold text-foreground">{selectedApp.age || '-'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('المؤهل', 'Education')}</p>
                  <p className="font-semibold text-foreground">{selectedApp.education || '-'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('مستوى اللغة', 'English Level')}</p>
                  <p className="font-semibold text-foreground">{selectedApp.englishLevel || '-'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('التاريخ', 'Date')}</p>
                  <p className="font-semibold text-foreground">
                    {new Date(selectedApp.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>

              {/* Package */}
              {selectedApp.packageName && (
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-xs text-primary mb-1">{t('الشريحة المختارة', 'Selected Package')}</p>
                  <p className="font-bold text-foreground">{selectedApp.packageName}</p>
                </div>
              )}

              {/* Message */}
              {selectedApp.message && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('الرسالة', 'Message')}</p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedApp.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 gap-2 rounded-xl" asChild>
                  <a href={`tel:${selectedApp.phone}`}>
                    <Phone className="w-4 h-4" />
                    {t('اتصال', 'Call')}
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" asChild>
                  <a href={`mailto:${selectedApp.email}`}>
                    <Mail className="w-4 h-4" />
                    {t('إرسال بريد', 'Send Email')}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsManager;
