import { useState } from 'react';
import { m as motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Clock, GraduationCap, Sparkles, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Package {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  durationAr: string;
  durationEn: string;
  featuresAr: string[];
  featuresEn: string[];
  notIncludedAr?: string[];
  notIncludedEn?: string[];
  premiumNoteAr?: string;
  premiumNoteEn?: string;
  licensesAr: string[];
  licensesEn: string[];
  imageUrl?: string;
  popular: boolean;
  active: boolean;
  order: number;
}

// Fallback content used when the Firestore 'packages' collection is empty
export const defaultPackages: Package[] = [
  {
    id: 'c3Ds5F61nySoqae6rc65',
    nameAr: 'الباقة الأولى — التأسيسية (نظام الأقساط)',
    nameEn: 'Package 1 - Foundation (Installment Plan)',
    descriptionAr:
      'برنامج تدريبي متكامل يشمل اللغة الإنجليزية ومصطلحات الطيران والعلوم النظرية والطيران العملي، بنظام أقساط شهرية مريحة.',
    descriptionEn:
      'A comprehensive training program covering English language, aviation terminology, ground school and practical flight training, with convenient monthly installments.',
    price: 279000,
    durationAr: 'من 16 إلى 26 شهراً',
    durationEn: '16 to 26 months',
    featuresAr: [
      'لغة إنجليزية عامة ومصطلحات الطيران',
      'دراسة الطيران النظرية',
      'الطيران العملي PPL - IR - CPL - ME (250 ساعة)',
      'تأشيرة الدراسة ورسومها + تجهيز إجراءات التأشيرة',
      'تذكرة سفر ذهاب وعودة',
      'استقبال ومتابعة في دولة الطيران العملي',
      'سكن في دولة الطيران العملي لمدة 5 أشهر',
      'الاختبارات التحريرية والنظرية للمرة الأولى',
      'تسليم زي الطيارين (قطعتان)',
      'المساعدة في معادلة الرخص إلى رخص سعودية',
      'دورة تأهيلية لاجتياز اختبارات القبول في شركات الطيران',
    ],
    featuresEn: [
      'General English language & aviation terminology',
      'Aviation theory study',
      'Practical flight training PPL - IR - CPL - ME (250 hours)',
      'Study visa and its fees + visa procedures preparation',
      'Round-trip flight ticket',
      'Reception and follow-up in the practical flight training country',
      'Accommodation in the practical flight training country for 5 months',
      'Written and theoretical exams for the first time',
      'Pilot uniform provided (2 sets)',
      'Assistance with equating licenses to Saudi licenses',
      'Preparatory course to pass airline admission tests',
    ],
    licensesAr: [
      'رخصة الطيار الخاص PPL',
      'رخصة الطيران بالعدادات IR',
      'رخصة الطيار التجاري CPL',
      'رخصة متعدد المحركات ME',
    ],
    licensesEn: [
      'Private Pilot License (PPL)',
      'Instrument Rating (IR)',
      'Commercial Pilot License (CPL)',
      'Multi-Engine License (ME)',
    ],
    imageUrl: '',
    popular: false,
    active: true,
    order: 1,
  },
  {
    id: '2SbfAnxQ5N42cyvrMn6t',
    nameAr: 'الباقة الثانية — على أربع دفعات',
    nameEn: 'Package 2 - Four Installments',
    descriptionAr:
      'نفس البرنامج التدريبي المتكامل مع مرونة السداد على أربع دفعات.',
    descriptionEn:
      'The same comprehensive training program with the flexibility of payment in four installments.',
    price: 219999,
    durationAr: 'من 16 إلى 26 شهراً',
    durationEn: '16 to 26 months',
    featuresAr: [
      'لغة إنجليزية عامة ومصطلحات الطيران',
      'دراسة الطيران النظرية',
      'الطيران العملي PPL - IR - CPL - ME (250 ساعة)',
      'رسوم التأشيرة',
      'تجهيز إجراءات التأشيرة',
      'تسليم زي الطيارين (قطعتان)',
      'المساعدة في معادلة الرخص إلى رخص سعودية',
      'دورة تأهيلية لاجتياز اختبارات القبول في شركات الطيران',
    ],
    featuresEn: [
      'General English language & aviation terminology',
      'Aviation theory study',
      'Practical flight training PPL - IR - CPL - ME (250 hours)',
      'Visa fees',
      'Visa procedures preparation',
      'Pilot uniform provided (2 sets)',
      'Assistance with equating licenses to Saudi licenses',
      'Preparatory course to pass airline admission tests',
    ],
    notIncludedAr: ['تذكرة السفر', 'السكن', 'رسوم الاختبارات'],
    notIncludedEn: ['Flight ticket', 'Accommodation', 'Exam fees'],
    licensesAr: [
      'رخصة الطيار الخاص PPL',
      'رخصة الطيران بالعدادات IR',
      'رخصة الطيار التجاري CPL',
      'رخصة متعدد المحركات ME',
    ],
    licensesEn: [
      'Private Pilot License (PPL)',
      'Instrument Rating (IR)',
      'Commercial Pilot License (CPL)',
      'Multi-Engine License (ME)',
    ],
    imageUrl: '',
    popular: false,
    active: true,
    order: 2,
  },
  {
    id: 'vscgZRgBrVka51rXn24u',
    nameAr: 'الباقة الثالثة — العرض الخاص (دفعة واحدة)',
    nameEn: 'Package 3 - Special Offer (Single Payment)',
    descriptionAr:
      'الأقل سعرًا بين الباقات، تُدفع دفعة واحدة كاملة عند التسجيل.',
    descriptionEn:
      'The lowest-priced package, paid in one full payment upon registration.',
    price: 179999,
    durationAr: 'من 16 إلى 26 شهراً',
    durationEn: '16 to 26 months',
    featuresAr: [
      'لغة إنجليزية عامة ومصطلحات الطيران',
      'دراسة الطيران النظرية',
      'الطيران العملي PPL - IR - CPL - ME (250 ساعة)',
      'تجهيز إجراءات التأشيرة',
      'المساعدة في معادلة الرخص إلى رخص سعودية',
      'دورة تأهيلية لاجتياز اختبارات القبول في شركات الطيران',
    ],
    featuresEn: [
      'General English language & aviation terminology',
      'Aviation theory study',
      'Practical flight training PPL - IR - CPL - ME (250 hours)',
      'Visa procedures preparation',
      'Assistance with equating licenses to Saudi licenses',
      'Preparatory course to pass airline admission tests',
    ],
    notIncludedAr: [
      'رسوم التأشيرة',
      'تذكرة السفر',
      'السكن',
      'رسوم الاختبارات',
      'زي الطيارين',
    ],
    notIncludedEn: [
      'Visa fees',
      'Flight ticket',
      'Accommodation',
      'Exam fees',
      'Pilot uniform',
    ],
    licensesAr: [
      'رخصة الطيار الخاص PPL',
      'رخصة الطيران بالعدادات IR',
      'رخصة الطيار التجاري CPL',
      'رخصة متعدد المحركات ME',
    ],
    licensesEn: [
      'Private Pilot License (PPL)',
      'Instrument Rating (IR)',
      'Commercial Pilot License (CPL)',
      'Multi-Engine License (ME)',
    ],
    imageUrl: '',
    popular: false,
    active: true,
    order: 3,
  },
  {
    id: 'vmsH4LtQnN8e8zmpWMTN',
    nameAr: 'الباقة الرابعة — Airbus A320 المنتهية بالتوظيف (دفعة واحدة)',
    nameEn: 'Package 4 - Airbus A320 Employment Program (Single Payment)',
    descriptionAr:
      'منتهية بالتوظيف براتب يصل إلى 8,000 دولار — 10 مقاعد فقط سنوياً.',
    descriptionEn:
      'Ends with employment at a salary of up to USD 8,000 — only 10 seats per year.',
    price: 699999,
    durationAr: 'من 24 إلى 32 شهراً',
    durationEn: '24 to 32 months',
    featuresAr: [
      '6 أشهر لغة إنجليزية مكثفة + 3 أشهر مصطلحات طيران',
      '3 أشهر علوم أرضية + 12 شهراً تدريب عملي PPL / IR / CPL / ME',
      '6 أشهر تدريب على محاكي A320 للحصول على Type Rating',
      '24 شهراً خبرة تشغيلية على طائرات A320',
      'PPL - IR - CPL - ME - Type Rating A320 + خبرة تشغيلية على طائرة Airbus A320 إلى 1500 ساعة',
    ],
    featuresEn: [
      '6 months intensive English + 3 months aviation terminology',
      '3 months ground school + 12 months practical training PPL / IR / CPL / ME',
      '6 months A320 simulator training to obtain the Type Rating',
      '24 months operational experience on A320 aircraft',
      'PPL - IR - CPL - ME - Type Rating A320 + operational experience on the Airbus A320 of up to 1,500 hours',
    ],
    premiumNoteAr:
      'شاملة السكن، التذاكر، رسوم الاختبارات، زي الطيارين، التأشيرة',
    premiumNoteEn:
      'Includes accommodation, tickets, exam fees, pilot uniform, and visa',
    licensesAr: [
      'رخصة الطيار الخاص PPL',
      'رخصة الطيران بالعدادات IR',
      'رخصة الطيار التجاري CPL',
      'رخصة متعدد المحركات ME',
      'Type Rating A320',
    ],
    licensesEn: [
      'Private Pilot License (PPL)',
      'Instrument Rating (IR)',
      'Commercial Pilot License (CPL)',
      'Multi-Engine License (ME)',
      'Type Rating A320',
    ],
    imageUrl: '',
    popular: false,
    active: true,
    order: 4,
  },
  {
    id: 'cbCpfAJzSlOR6pYFONX0',
    nameAr: 'الباقة الخامسة — Airbus A320 المنتهية بالتوظيف (دفعتين)',
    nameEn: 'Package 5 - Airbus A320 Employment Program (Two Installments)',
    descriptionAr:
      'نفس مراحل ومزايا باقة الدفعة الواحدة، مع مرونة تقسيم المبلغ على دفعتين.',
    descriptionEn:
      'The same stages and benefits as the single-payment package, with the flexibility of splitting the amount into two payments.',
    price: 899999,
    durationAr: 'من 24 إلى 32 شهراً',
    durationEn: '24 to 32 months',
    featuresAr: [
      '6 أشهر لغة إنجليزية مكثفة + 3 أشهر مصطلحات طيران',
      '3 أشهر علوم أرضية + 12 شهراً تدريب عملي PPL / IR / CPL / ME',
      '6 أشهر تدريب على محاكي A320 للحصول على Type Rating',
      '24 شهراً خبرة تشغيلية على طائرات A320',
      'PPL - IR - CPL - ME - Type Rating A320 + خبرة تشغيلية على طائرة Airbus A320 إلى 1500 ساعة',
    ],
    featuresEn: [
      '6 months intensive English + 3 months aviation terminology',
      '3 months ground school + 12 months practical training PPL / IR / CPL / ME',
      '6 months A320 simulator training to obtain the Type Rating',
      '24 months operational experience on A320 aircraft',
      'PPL - IR - CPL - ME - Type Rating A320 + operational experience on the Airbus A320 of up to 1,500 hours',
    ],
    premiumNoteAr:
      'شاملة السكن، التذاكر، رسوم الاختبارات، زي الطيارين، التأشيرة',
    premiumNoteEn:
      'Includes accommodation, tickets, exam fees, pilot uniform, and visa',
    licensesAr: [
      'رخصة الطيار الخاص PPL',
      'رخصة الطيران بالعدادات IR',
      'رخصة الطيار التجاري CPL',
      'رخصة متعدد المحركات ME',
      'Type Rating A320',
    ],
    licensesEn: [
      'Private Pilot License (PPL)',
      'Instrument Rating (IR)',
      'Commercial Pilot License (CPL)',
      'Multi-Engine License (ME)',
      'Type Rating A320',
    ],
    imageUrl: '',
    popular: false,
    active: true,
    order: 5,
  },
];

interface PackageCardProps {
  pkg: Package;
  index: number;
  onRegister: (pkg: Package) => void;
}

export const PackageCard = ({ pkg, index, onRegister }: PackageCardProps) => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      className={`relative h-full flex flex-col bg-card rounded-3xl overflow-hidden shadow-xl border transition-all duration-300 hover:shadow-2xl group ${
        pkg.popular
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border/50 hover:border-primary/30'
      }`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <motion.div
          className="absolute top-4 start-4 z-10 flex items-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg"
          initial={{ scale: 0, rotate: -10 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <Sparkles className="w-3 h-3" />
          {t('الأكثر طلباً', 'Most Popular')}
        </motion.div>
      )}

      {/* Card Header */}
      <div className={`p-6 pb-4 ${pkg.popular ? 'pt-14' : ''}`}>
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {t(pkg.nameAr, pkg.nameEn)}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {t(pkg.descriptionAr, pkg.descriptionEn)}
        </p>
      </div>

      {/* Price Section */}
      {pkg.price > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-y border-border/30">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {pkg.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">{t('ريال سعودي', 'SAR')}</span>
          </div>
          {(pkg.durationAr || pkg.durationEn) && (
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{t(pkg.durationAr, pkg.durationEn)}</span>
            </div>
          )}
        </div>
      )}

      {/* Includes */}
      {pkg.featuresAr?.length > 0 && (
        <div className="px-6 pt-4 pb-2 space-y-2.5">
          {pkg.featuresAr.map((feature, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {t(feature, pkg.featuresEn?.[i] || feature)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Premium included benefit */}
      {pkg.premiumNoteAr && (
        <div className="px-6 pt-2">
          <motion.div
            className="flex items-start gap-2.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-400/15 via-amber-300/10 to-transparent px-4 py-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-semibold leading-relaxed text-amber-600 dark:text-amber-400">
              {t(pkg.premiumNoteAr, pkg.premiumNoteEn || pkg.premiumNoteAr)}
            </span>
          </motion.div>
        </div>
      )}

      {/* Not included */}
      {pkg.notIncludedAr && pkg.notIncludedAr.length > 0 && (
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2.5">
            <XCircle className="w-4 h-4" />
            {t('غير مشمولة في الباقة', 'Not Included')}
          </div>
          <div className="space-y-2">
            {pkg.notIncludedAr.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-2.5"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground/80 text-sm leading-relaxed">
                  {t(item, pkg.notIncludedEn?.[i] || item)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Licenses */}
      {pkg.licensesAr?.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            {t('الرخص المكتسبة', 'Licenses')}
          </div>
          <div className="flex flex-wrap gap-2">
            {pkg.licensesAr?.map((_, i) => (
              <motion.span
                key={i}
                className="text-xs bg-gradient-to-r from-primary/15 to-secondary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {t(pkg.licensesAr[i], pkg.licensesEn?.[i] || pkg.licensesAr[i])}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 pt-2 mt-auto">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full gap-2 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onRegister(pkg);
            }}
          >
            {t('سجل الآن', 'Register Now')}
            <Arrow className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

interface QuickRegistrationDialogProps {
  selectedPackage: Package | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickRegistrationDialog = ({
  selectedPackage,
  isOpen,
  onClose,
}: QuickRegistrationDialogProps) => {
  const { t, direction } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      packageId: selectedPackage?.id,
      packageName: selectedPackage?.nameAr,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      gender: formData.get('gender'),
      message: formData.get('message'),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'applications'), data);
      toast({
        title: t('تم إرسال طلبك بنجاح', 'Application submitted successfully'),
        description: t('سنتواصل معك قريباً', 'We will contact you soon'),
      });
      onClose();
    } catch (error) {
      toast({
        title: t('حدث خطأ', 'Error occurred'),
        description: t('يرجى المحاولة مرة أخرى', 'Please try again'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 -m-6 mb-4 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {t('التسجيل السريع', 'Quick Registration')}
            </DialogTitle>
            {selectedPackage && (
              <p className="text-sm text-white/80 mt-1">
                {t(selectedPackage.nameAr, selectedPackage.nameEn)}
              </p>
            )}
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-sm">
                {t('الاسم الأول', 'First Name')} *
              </Label>
              <Input id="firstName" name="firstName" required className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm">
                {t('الاسم الأخير', 'Last Name')} *
              </Label>
              <Input id="lastName" name="lastName" required className="mt-1.5 rounded-xl" />
            </div>
          </div>

          <div>
            <Label>{t('النوع', 'Gender')}</Label>
            <RadioGroup name="gender" defaultValue="male" className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="cursor-pointer text-sm">
                  {t('ذكر', 'Male')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="cursor-pointer text-sm">
                  {t('أنثى', 'Female')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm">
              {t('رقم الجوال', 'Phone Number')} *
            </Label>
            <Input id="phone" name="phone" type="tel" required className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">
              {t('البريد الإلكتروني', 'Email')} *
            </Label>
            <Input id="email" name="email" type="email" required className="mt-1.5 rounded-xl" />
          </div>

          <div>
            <Label htmlFor="message" className="text-sm">
              {t('رسالتك', 'Your Message')}
            </Label>
            <Textarea id="message" name="message" rows={3} className="mt-1.5 rounded-xl resize-none" />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div
                  className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  {t('إرسال الطلب', 'Submit Application')}
                  <Arrow className="w-5 h-5 ms-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
