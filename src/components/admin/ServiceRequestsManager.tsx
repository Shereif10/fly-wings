import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Search, Eye, Check, X, Clock, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { collection, getDocs, updateDoc, doc, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceTitleAr: string;
  serviceTitleEn: string;
  regionAr: string;
  regionEn: string;
  price: string;
  name: string;
  email: string;
  phone: string;
  membershipNumber: string;
  flightHours: string;
  licenseUrl: string;
  medicalUrl: string;
  englishUrl: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

const ServiceRequestsManager = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const requestsQuery = query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(requestsQuery);
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceRequest[];
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Try without ordering
      try {
        const fallbackQuery = query(collection(db, 'serviceRequests'));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackRequests = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceRequest[];
        setRequests(fallbackRequests.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        }));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
      }
    }
    setLoading(false);
  };

  const handleStatusChange = async (requestId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), { status: newStatus });
      toast({
        title: t('تم التحديث', 'Updated'),
        description: t('تم تحديث حالة الطلب', 'Request status updated'),
      });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في تحديث الحالة', 'Failed to update status'),
        variant: 'destructive',
      });
    }
  };

  const openDetailDialog = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">{t('موافق عليه', 'Approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('مرفوض', 'Rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('قيد المراجعة', 'Pending')}</Badge>;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceTitleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceTitleEn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('طلبات الخدمات', 'Service Requests')}</h1>
        <p className="text-muted-foreground">{t('إدارة طلبات الخدمات المقدمة', 'Manage submitted service requests')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('بحث بالبريد أو رقم العضوية...', 'Search by email or membership...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('كل الحالات', 'All Statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('كل الحالات', 'All Statuses')}</SelectItem>
            <SelectItem value="pending">{t('قيد المراجعة', 'Pending')}</SelectItem>
            <SelectItem value="approved">{t('موافق عليه', 'Approved')}</SelectItem>
            <SelectItem value="rejected">{t('مرفوض', 'Rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {t('لا توجد طلبات', 'No requests found')}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('الخدمة', 'Service')}</TableHead>
                <TableHead>{t('المنطقة', 'Region')}</TableHead>
                <TableHead>{t('البريد', 'Email')}</TableHead>
                <TableHead>{t('رقم العضوية', 'Membership')}</TableHead>
                <TableHead>{t('التاريخ', 'Date')}</TableHead>
                <TableHead>{t('الحالة', 'Status')}</TableHead>
                <TableHead>{t('إجراءات', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request, index) => (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b"
                >
                  <TableCell className="font-medium">
                    {language === 'ar' ? request.serviceTitleAr : request.serviceTitleEn}
                  </TableCell>
                  <TableCell>
                    {language === 'ar' ? request.regionAr : request.regionEn || '-'}
                  </TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.membershipNumber}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailDialog(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleStatusChange(request.id, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('تفاصيل الطلب', 'Request Details')}</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t('الخدمة', 'Service')}</p>
                  <p className="font-medium">
                    {language === 'ar' ? selectedRequest.serviceTitleAr : selectedRequest.serviceTitleEn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('المنطقة', 'Region')}</p>
                  <p className="font-medium">
                    {language === 'ar' ? selectedRequest.regionAr : selectedRequest.regionEn || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('السعر', 'Price')}</p>
                  <p className="font-medium">{selectedRequest.price || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('الحالة', 'Status')}</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Applicant Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t('معلومات مقدم الطلب', 'Applicant Information')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('البريد الإلكتروني', 'Email')}</p>
                    <p className="font-medium">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('رقم العضوية', 'Membership Number')}</p>
                    <p className="font-medium">{selectedRequest.membershipNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ساعات الطيران', 'Flight Hours')}</p>
                    <p className="font-medium">{selectedRequest.flightHours}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('تاريخ التقديم', 'Submission Date')}</p>
                    <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t('المستندات', 'Documents')}</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedRequest.licenseUrl && (
                    <a
                      href={selectedRequest.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('رخصة الطيار', 'Pilot License')}
                    </a>
                  )}
                  {selectedRequest.medicalUrl && (
                    <a
                      href={selectedRequest.medicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('الشهادة الطبية', 'Medical Certificate')}
                    </a>
                  )}
                  {selectedRequest.englishUrl && (
                    <a
                      href={selectedRequest.englishUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('شهادة اللغة الإنجليزية', 'English Certificate')}
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('ملاحظات', 'Notes')}</h3>
                  <p className="text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleStatusChange(selectedRequest.id, 'approved');
                      setDetailDialogOpen(false);
                    }}
                  >
                    <Check className="w-4 h-4 me-2" />
                    {t('موافقة', 'Approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(selectedRequest.id, 'rejected');
                      setDetailDialogOpen(false);
                    }}
                  >
                    <X className="w-4 h-4 me-2" />
                    {t('رفض', 'Reject')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequestsManager;
