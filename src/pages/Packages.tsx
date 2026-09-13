import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, GraduationCap, ShieldCheck, Sparkles, ChevronRight, Plane, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';
import { PackageCard, QuickRegistrationDialog, defaultPackages } from '@/components/PackageCard';
import type { Package } from '@/components/PackageCard';

const pageFaqs = [
  {
    questionAr: 'ما الفرق بين الباقات الأربع الأساسية وباقة Airbus A320؟',
    questionEn: 'What is the difference between the four foundation packages and the Airbus A320 package?',
    answerAr: 'الباقات الأساسية تؤهلك للحصول على رخص PPL وIR وCPL فقط. أما باقة Airbus A320 فهي برنامج متكامل ينتهي بتوظيفك فعلياً ويشمل Type Rating وخبرة تشغيلية على طائرة الإيرباص A320 إلى 1500 ساعة.',
    answerEn: 'The foundation packages qualify you for the PPL, IR and CPL licenses only. The Airbus A320 package is a complete program that ends with your actual employment and includes Type Rating and operational experience on the Airbus A320 of up to 1,500 flight hours.',
  },
  {
    questionAr: 'كم تستغرق مدة التدريب؟',
    questionEn: 'How long does the training take?',
    answerAr: 'الباقات التأسيسية بين 16 و26 شهراً، وبرنامج Airbus A320 من 24 إلى 32 شهراً.',
    answerEn: 'The foundation packages take between 16 and 26 months, while the Airbus A320 program takes from 24 to 32 months.',
  },
  {
    questionAr: 'هل يمكنني السداد على دفعات؟',
    questionEn: 'Can I pay in installments?',
    answerAr: 'نعم، نوفر أنظمة سداد متعددة: دفعة واحدة، أربع دفعات، أو أقساط شهرية بحسب الباقة.',
    answerEn: 'Yes, we offer multiple payment plans: a single payment, four installments, or monthly installments depending on the package.',
  },
];

const whyChoosePoints = [
  {
    ar: 'برامج تدريبية معتمدة دولياً من ICAO والهيئة العامة للطيران المدني السعودية.',
    en: 'Internationally accredited training programs from ICAO and the Saudi General Authority of Civil Aviation.',
  },
  {
    ar: 'مسار متكامل: من اللغة الإنجليزية العامة، إلى مصطلحات الطيران، إلى العلوم النظرية، إلى التدريب العملي.',
    en: 'An integrated path: from general English, to aviation terminology, to theoretical sciences, to practical training.',
  },
  {
    ar: 'حصول الطالب على رخص طيران PPL - IR - CPL - ME بمجموع 250 ساعة طيران فعلي.',
    en: 'Students earn PPL - IR - CPL - ME pilot licenses with a total of 250 actual flight hours.',
  },
  {
    ar: 'باقات مرنة بأنظمة سداد متعددة: دفعة واحدة، أربع دفعات، أو أقساط شهرية.',
    en: 'Flexible packages with multiple payment plans: a single payment, four installments, or monthly installments.',
  },
  {
    ar: 'مساعدة كاملة في إجراءات التأشيرة، السكن، ومعادلة الرخصة داخل السعودية.',
    en: 'Full assistance with visa procedures, accommodation, and license equating inside Saudi Arabia.',
  },
  {
    ar: 'الباقة المنتهية بالتوظيف على طائرة الإيرباص Airbus A320، وتشمل تأهيل الطراز (Type Rating).',
    en: 'The package ending with employment on the Airbus A320, including Type Rating qualification.',
  },
];

const licensesInfo = [
  {
    titleAr: 'رخصة الطيار الخاص (PPL)',
    titleEn: 'Private Pilot License (PPL)',
    descAr: 'نقطة البداية الرسمية لكل طيار.',
    descEn: 'The official starting point for every pilot.',
  },
  {
    titleAr: 'رخصة الطيران بالعدادات (IR)',
    titleEn: 'Instrument Rating (IR)',
    descAr: 'الطيران اعتماداً على أجهزة القمرة في الظروف الجوية المحدودة الرؤية.',
    descEn: 'Flying by reference to cockpit instruments in low-visibility weather conditions.',
  },
  {
    titleAr: 'رخصة الطيار التجاري (CPL)',
    titleEn: 'Commercial Pilot License (CPL)',
    descAr: 'تفتح باب العمل كطيار محترف لدى شركات الطيران.',
    descEn: 'Opens the door to working as a professional pilot for airlines.',
  },
  {
    titleAr: 'رخصة متعدد المحركات ME',
    titleEn: 'Multi-Engine Rating (ME)',
    descAr: 'تؤهل الطيار لقيادة الطائرات متعددة المحركات، مع التدريب على تشغيلها بأمان والتحكم فيها بكفاءة.',
    descEn: 'Qualifies pilots to operate multi-engine aircraft safely and efficiently.',
  },
];

const Packages = () => {
  const { t, direction } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'packages'));
        const pkgs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Package))
          .filter((pkg) => pkg.active)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setPackages(pkgs.length > 0 ? pkgs : defaultPackages);
      } catch (error) {
        console.error('Error fetching packages:', error);
        setPackages(defaultPackages);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openForm = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSeo
        pageKey="packages"
        path="/packages"
        defaultTitleAr={'الباقات التدريبية — أجنحة الطيران'}
        defaultTitleEn={'Training Packages — Fly Wings'}
        defaultDescriptionAr={'باقات تدريب الطيران المتاحة في أجنحة الطيران بالأسعار والمدد والتفاصيل الكاملة.'}
        defaultDescriptionEn={'Explore Fly Wings flight training packages with pricing, duration and full details.'}
      />

      {/* Hero with animated background */}
      <section className="relative bg-gradient-to-br from-aviation-navy via-[hsl(215,50%,18%)] to-aviation-navy overflow-hidden pt-28 pb-20">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl"
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: 0.5 + Math.random() * 0.5,
              }}
              animate={{
                x: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                y: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                scale: [null, 0.8 + Math.random() * 0.4, 0.5 + Math.random() * 0.5],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="packagesHeroGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0L0 0L0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#packagesHeroGrid)" />
          </svg>
        </div>

        {/* Plane decorations */}
        <motion.div
          className="absolute top-24 left-10 opacity-20"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-20 opacity-15"
          animate={{ x: [0, -15, 0], y: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-card/70 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm shadow-lg border border-border/60 dark:bg-card/40">
              <Link to="/" className="text-foreground/80 hover:text-primary transition-colors font-medium">{t('الرئيسية', 'Home')}</Link>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <span className="font-semibold text-foreground">{t('برامجنا', 'Our Programs')}</span>
            </div>
          </motion.div>

          <div className="text-center">
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {t('باقات تدريب الطيران في أجنحة الطيران', 'Flight Training Packages at Fly Wings')}
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              {t(
                'طريقك الكامل من الصفر إلى قمرة القيادة: 5 باقات تدريبية معتمدة دولياً من ICAO والهيئة العامة للطيران المدني السعودية، تبدأ من 179,999 ريال وتصل إلى برنامج توظيف كامل على طائرات Airbus A320.',
                'Your complete path from zero to the cockpit: 5 internationally accredited training packages from ICAO and the Saudi General Authority of Civil Aviation, starting from SAR 179,999 up to a full employment program on the Airbus A320.'
              )}
            </motion.p>
            <motion.div
              className="inline-flex items-center gap-2 bg-card/70 backdrop-blur-sm rounded-full px-5 py-2 mt-6 text-sm font-semibold shadow-lg border border-border/60 dark:bg-card/40"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Plane className="w-4 h-4 text-accent" />
              <span className="text-white">PPL - IR - CPL | Airbus A320 Type Rating</span>
            </motion.div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[80px] md:h-[100px]" preserveAspectRatio="none">
            <path d="M0 100L48 91.7C96 83.3 192 66.7 288 58.3C384 50 480 50 576 54.2C672 58.3 768 66.7 864 70.8C960 75 1056 75 1152 70.8C1248 66.7 1344 58.3 1392 54.2L1440 50V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Why Choose Fly Wings */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <ShieldCheck className="w-4 h-4" />
              {t('مزايا التدريب معنا', 'Why Train With Us')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('لماذا تختار أجنحة الطيران؟', 'Why Choose Fly Wings?')}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              {t(
                'في أجنحة الطيران، لا نكتفي بتدريسك الطيران، بل نبني لك مساراً متكاملاً يبدأ من الأساسيات اللغوية والعلمية، ويمر بالتدريب العملي الفعلي على الطائرات، وينتهي بمساعدتك على معادلة رخصتك والتقديم للعمل لدى شركات الطيران.',
                "At Fly Wings, we don't just teach you to fly — we build you an integrated path that starts with language and scientific foundations, moves through actual hands-on flight training, and ends with helping you equate your license and apply to airlines."
              )}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {whyChoosePoints.map((point, index) => (
              <motion.div
                key={index}
                className="group flex items-start gap-4 bg-card p-6 rounded-2xl shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="text-foreground font-medium leading-relaxed">{t(point.ar, point.en)}</p>
              </motion.div>
            ))}
          </div>

          {/* Employment highlight */}
          <motion.div
            className="mt-12 max-w-3xl mx-auto p-6 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent rounded-2xl border border-accent/30 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
              {t(
                'يتم توظيفك فعلياً على طائرة الإيرباص Airbus A320 فور إتمام البرنامج.',
                'You are actually employed on the Airbus A320 immediately after completing the program.'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Licenses */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <GraduationCap className="w-4 h-4 text-accent" />
              {t('رخص معتمدة دولياً', 'Internationally Accredited Licenses')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('الرخص التي ستحصل عليها', 'Licenses You Will Earn')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {licensesInfo.map((license, index) => (
              <motion.div
                key={index}
                className="bg-card p-6 rounded-2xl shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t(license.titleAr, license.titleEn)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(license.descAr, license.descEn)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* A320 Type Rating note */}
          <motion.div
            className="mt-8 max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6 flex items-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground leading-relaxed">
              {t(
                'تضاف شهادة تأهيل الطراز (Type Rating) على A320، بالإضافة إلى خبرة تشغيلية على طائرة الإيرباص A320 إلى 1500 ساعة طيران.',
                'An Airbus A320 Type Rating certificate is added, along with operational experience on the Airbus A320 of up to 1,500 flight hours.'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Packages Grid */}
      <section id="packages-section" className="py-20 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="packagesPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="2" fill="currentColor" className="text-foreground" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#packagesPattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              {t('اختر الأنسب لك', 'Choose What Fits You')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('برامجنا', 'Our Programs')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <PackageCard key={pkg.id} pkg={pkg} index={index} onRegister={openForm} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-0 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring' }}
            >
              <HelpCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('الأسئلة الشائعة', 'Frequently Asked Questions')}
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {pageFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 px-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <AccordionTrigger className="text-start hover:no-underline py-6 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <motion.div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors"
                        whileHover={{ rotate: 10 }}
                      >
                        <Plane className="w-5 h-5 text-primary" />
                      </motion.div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t(faq.questionAr, faq.questionEn)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 ps-14 text-muted-foreground leading-relaxed">
                    {t(faq.answerAr, faq.answerEn)}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-br from-aviation-navy via-[hsl(215,50%,18%)] to-aviation-navy overflow-hidden py-20">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl"
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: 0.5 + Math.random() * 0.5,
              }}
              animate={{
                x: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                y: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                scale: [null, 0.8 + Math.random() * 0.4, 0.5 + Math.random() * 0.5],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {t('ابدأ رحلتك اليوم نحو مستقبل مهني في عالم الطيران', 'Start Your Journey Today Toward a Professional Future in Aviation')}
          </motion.h2>
          <motion.p
            className="text-lg text-white/80 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {t(
              'من الصفر إلى قمرة قيادة Airbus A320 — تواصل مع فريق أجنحة الطيران لاختيار الباقة الأنسب لك.',
              'From zero to the Airbus A320 cockpit — contact the Fly Wings team to choose the package that suits you best.'
            )}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-full px-8 h-14 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg"
              >
                <Link to="/contact">
                  {t('تواصل معنا', 'Contact Us')}
                  <Arrow className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Application Form Dialog */}
      <QuickRegistrationDialog
        selectedPackage={selectedPackage}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </Layout>
  );
};

export default Packages;
