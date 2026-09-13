import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ChevronLeft, MapPin, Home, X } from 'lucide-react';
import { collection, getDocs, addDoc, doc, getDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TermItem {
  textAr: string;
  textEn: string;
}

interface RegionalPricing {
  id: string;
  regionAr: string;
  regionEn: string;
  price: string;
  currency: string;
  unit: string;
  notes?: string;
  imageUrl?: string;
}

interface ServiceItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;
  published: boolean;
  terms?: TermItem[];
  regionalPricing?: RegionalPricing[];
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  membershipNumber: string;
  flightHours: string;
  licenseFile: File | null;
  medicalCertFile: File | null;
  englishCertFile: File | null;
  notes: string;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, direction, language } = useLanguage();
  const { toast } = useToast();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<RegionalPricing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    membershipNumber: '',
    flightHours: '',
    licenseFile: null,
    medicalCertFile: null,
    englishCertFile: null,
    notes: '',
  });

  const Arrow = direction === 'rtl' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() } as ServiceItem);
        } else {
          navigate('/services');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      }
      setLoading(false);
    };

    fetchService();
  }, [id, navigate]);

  const handleBookClick = (pricing?: RegionalPricing) => {
    setSelectedPricing(pricing || null);
    setBookingDialogOpen(true);
  };

  const handleFileChange = (field: keyof BookingFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, await optimizeImage(file));
    return getDownloadURL(storageRef);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setSubmitting(true);
    try {
      let licenseUrl = '';
      let medicalUrl = '';
      let englishUrl = '';

      if (formData.licenseFile) {
        licenseUrl = await uploadFile(formData.licenseFile, `service-requests/${Date.now()}_license_${formData.licenseFile.name}`);
      }
      if (formData.medicalCertFile) {
        medicalUrl = await uploadFile(formData.medicalCertFile, `service-requests/${Date.now()}_medical_${formData.medicalCertFile.name}`);
      }
      if (formData.englishCertFile) {
        englishUrl = await uploadFile(formData.englishCertFile, `service-requests/${Date.now()}_english_${formData.englishCertFile.name}`);
      }

      await addDoc(collection(db, 'serviceRequests'), {
        serviceId: service.id,
        serviceTitleAr: service.titleAr,
        serviceTitleEn: service.titleEn,
        regionAr: selectedPricing?.regionAr || '',
        regionEn: selectedPricing?.regionEn || '',
        price: selectedPricing?.price || '',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        membershipNumber: formData.membershipNumber,
        flightHours: formData.flightHours,
        licenseUrl,
        medicalUrl,
        englishUrl,
        notes: formData.notes,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({
        title: t('تم الإرسال', 'Submitted'),
        description: t('تم إرسال طلبك بنجاح وسيتم التواصل معك قريباً', 'Your request has been submitted successfully. We will contact you soon.'),
      });

      setBookingDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        membershipNumber: '',
        flightHours: '',
        licenseFile: null,
        medicalCertFile: null,
        englishCertFile: null,
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في إرسال الطلب', 'Failed to submit request'),
        variant: 'destructive',
      });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">{t('الخدمة غير موجودة', 'Service not found')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={service.imageUrl || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1920'}
            alt={language === 'ar' ? service.titleAr : service.titleEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>

        <div className="container relative z-10 py-20">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          >
            <Link to="/" className="hover:text-foreground flex items-center gap-1">
              <Home className="w-4 h-4" />
              {t('الرئيسية', 'Home')}
            </Link>
            <Arrow className="w-4 h-4" />
            <Link to="/services" className="hover:text-foreground">
              {t('الخدمات', 'Services')}
            </Link>
            <Arrow className="w-4 h-4" />
            <span className="text-foreground">{language === 'ar' ? service.titleAr : service.titleEn}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {language === 'ar' ? service.titleAr : service.titleEn}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl"
          >
            {language === 'ar' ? service.descriptionAr : service.descriptionEn}
          </motion.p>
        </div>
      </section>

      {/* Terms & Conditions Section */}
      {service.terms && service.terms.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-8 shadow-soft border">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t('للحصول على الخدمة', 'To Get This Service')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t('الشروط والأحكام للحصول على هذه الخدمة:', 'Terms and conditions to get this service:')}
                </p>

                <Accordion type="single" collapsible className="space-y-2">
                  {service.terms.map((term, index) => (
                    <AccordionItem
                      key={index}
                      value={`term-${index}`}
                      className="border rounded-lg px-4 bg-background"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-start">
                          {language === 'ar' ? term.textAr : term.textEn}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {language === 'ar' ? term.textAr : term.textEn}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" onClick={() => handleBookClick()} className="gap-2">
                  {t('للحصول على الخدمة', 'Get This Service')}
                  <Arrow className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Regional Pricing Section */}
      {service.regionalPricing && service.regionalPricing.length > 0 && (
        <section className="py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('خدمات تأجير الطائرات الرياضية الخفيفة', 'Light Sport Aircraft Rental Services')}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.regionalPricing.map((pricing, index) => (
                <motion.div
                  key={pricing.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl overflow-hidden shadow-soft border group"
                >
                  {/* Image */}
                  <div className="relative aspect-video">
                    <img
                      src={pricing.imageUrl || service.imageUrl || 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?q=80&w=800'}
                      alt={language === 'ar' ? pricing.regionAr : pricing.regionEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 start-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">
                        {t('متاحة', 'Available')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="px-3 py-1 bg-muted rounded-full text-sm">
                        {language === 'ar' ? pricing.regionAr : pricing.regionEn}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-4">
                      {language === 'ar' ? service.titleAr : service.titleEn}
                    </h3>

                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-lg">
                        {t('للأعضاء فقط', 'Members Only')}
                      </span>
                      <div className="text-end">
                        <span className="text-2xl font-bold text-foreground">
                          {pricing.price}
                        </span>
                        <span className="text-muted-foreground text-sm">/{pricing.unit || t('الساعة', 'hour')}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={() => handleBookClick(pricing)}
                    >
                      {t('طلب الخدمة', 'Request Service')}
                      <Arrow className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Regional Pricing - Show Simple CTA */}
      {(!service.regionalPricing || service.regionalPricing.length === 0) && (!service.terms || service.terms.length === 0) && (
        <section className="py-16">
          <div className="container text-center">
            <Button size="lg" onClick={() => handleBookClick()} className="gap-2">
              {t('طلب الخدمة', 'Request Service')}
              <Arrow className="w-5 h-5" />
            </Button>
          </div>
        </section>
      )}

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-bold">{language === 'ar' ? service.titleAr : service.titleEn}</p>
                {selectedPricing && (
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {language === 'ar' ? selectedPricing.regionAr : selectedPricing.regionEn}
                  </span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('البريد الإلكتروني للمطار', 'Pilot Email')} *</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('إجمالي ساعات الطيران', 'Total Flight Hours')} *</Label>
              <Input
                type="text"
                required
                value={formData.flightHours}
                onChange={(e) => setFormData({ ...formData, flightHours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('رقم العضوية', 'Membership Number')} *</Label>
              <Input
                type="text"
                required
                value={formData.membershipNumber}
                onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('رخصة الطيار', 'Pilot License')} *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('licenseFile', e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('الشهادة الطبية', 'Medical Certificate')} *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('medicalCertFile', e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('شهادة إتقان اللغة الإنجليزية', 'English Proficiency Certificate')}</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('englishCertFile', e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ملاحظات', 'Notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('إرسال', 'Submit')
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ServiceDetail;
