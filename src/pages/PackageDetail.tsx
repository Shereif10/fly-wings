import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight, Check, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Layout from '@/components/layout/Layout';
import PageSeo from '@/components/seo/PageSeo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureHtml, stripHtml } from '@/lib/content';

interface Package {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fullDescriptionAr?: string;
  fullDescriptionEn?: string;
  price: number;
  durationAr: string;
  durationEn: string;
  featuresAr: string[];
  featuresEn: string[];
  licensesAr: string[];
  licensesEn: string[];
  imageUrl?: string;
  popular: boolean;
  active: boolean;
}

const PackageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'packages', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPkg({ id: docSnap.id, ...docSnap.data() } as Package);
        }
      } catch (error) {
        console.error('Error fetching package:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      packageId: pkg?.id,
      packageName: pkg?.nameAr,
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
      (e.target as HTMLFormElement).reset();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div 
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">{t('الباقة غير موجودة', 'Package not found')}</p>
          <Button asChild>
            <Link to="/packages">{t('العودة للباقات', 'Back to Packages')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSeo
        pageKey={`package-${pkg.id}`}
        path={`/packages/${pkg.id}`}
        defaultTitleAr={pkg.nameAr}
        defaultTitleEn={pkg.nameEn}
        defaultDescriptionAr={stripHtml(pkg.fullDescriptionAr || pkg.descriptionAr || '', 155)}
        defaultDescriptionEn={stripHtml(pkg.fullDescriptionEn || pkg.descriptionEn || '', 155)}
        image={pkg.imageUrl}
        breadcrumbs={[{ name: t('الرئيسية', 'Home'), path: '/' }, { name: t('الباقات', 'Packages'), path: '/packages' }, { name: t(pkg.nameAr, pkg.nameEn), path: `/packages/${pkg.id}` }]}
      />
      {/* Hero with animated background */}
      <section className="relative bg-gradient-to-br from-aviation-navy via-[hsl(215,50%,18%)] to-aviation-navy overflow-hidden pt-28 pb-16">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                scale: 0.5 + Math.random() * 0.5
              }}
              animate={{ 
                x: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                y: [null, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                scale: [null, 0.8 + Math.random() * 0.4, 0.5 + Math.random() * 0.5]
              }}
              transition={{ 
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="packageHeroGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0L0 0L0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#packageHeroGrid)" />
          </svg>
        </div>

        {/* Plane decorations */}
        <motion.div 
          className="absolute top-20 left-10 opacity-20"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
        </motion.div>

        <motion.div 
          className="absolute bottom-32 right-20 opacity-15"
          animate={{ x: [0, -15, 0], y: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-accent">
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
              <Link to="/packages" className="text-foreground/80 hover:text-primary transition-colors font-medium">{t('برامجنا', 'Our Programs')}</Link>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <span className="font-semibold text-foreground">{t(pkg.nameAr, pkg.nameEn)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-right"
          >
            {pkg.popular && (
              <motion.span 
                className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Sparkles className="w-4 h-4" />
                {t('الأكثر طلباً', 'Most Popular')}
              </motion.span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t(pkg.nameAr, pkg.nameEn)}
            </h1>
            <p className="text-white/80 max-w-2xl ms-auto text-lg">
              {t(pkg.descriptionAr, pkg.descriptionEn)}
            </p>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[80px] md:h-[100px]" preserveAspectRatio="none">
            <path d="M0 100L48 91.7C96 83.3 192 66.7 288 58.3C384 50 480 50 576 54.2C672 58.3 768 66.7 864 70.8C960 75 1056 75 1152 70.8C1248 66.7 1344 58.3 1392 54.2L1440 50V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <main className="py-16 bg-background relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-card rounded-3xl p-8 shadow-xl border border-border/50 relative overflow-hidden"
              >
                {/* Card decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                
                <h2 className="text-2xl font-bold text-foreground mb-4 relative">
                  {t(pkg.nameAr, pkg.nameEn)}
                </h2>
                <div
                  className="article-content prose prose-lg max-w-none dark:prose-invert text-muted-foreground leading-relaxed relative"
                  dangerouslySetInnerHTML={{
                    __html: ensureHtml(t(pkg.fullDescriptionAr || pkg.descriptionAr, pkg.fullDescriptionEn || pkg.descriptionEn)),
                  }}
                />

                {(pkg.durationAr || pkg.durationEn) && (
                  <motion.div 
                    className="flex items-center gap-4 mt-8 p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('الوقت المتوقع لإنهاء الدراسة', 'Expected Duration')}</p>
                      <p className="font-bold text-foreground text-lg">{t(pkg.durationAr, pkg.durationEn)}</p>
                    </div>
                  </motion.div>
                )}

                {pkg.price > 0 && (
                  <motion.div 
                    className="mt-6 p-6 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent rounded-2xl border border-accent/30 relative overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-accent/20 rounded-full blur-2xl" />
                    <p className="text-sm text-muted-foreground mb-2 relative">{t('السعر', 'Price')}</p>
                    <p className="text-4xl font-bold text-primary relative">
                      {pkg.price.toLocaleString()} 
                      <span className="text-lg font-medium text-muted-foreground ms-2">{t('ريال سعودي', 'SAR')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 relative">{t('شامل قيمة الضريبة المضافة', 'Including VAT')}</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Features Card */}
              {pkg.featuresAr?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-card rounded-3xl p-8 shadow-xl border border-border/50"
                >
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-secondary" />
                    </span>
                    {t('ما يشمله البرنامج', 'Program Includes')}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {pkg.featuresAr.map((feature, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-foreground text-sm">
                          {t(feature, pkg.featuresEn?.[i] || feature)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Licenses Card */}
              {pkg.licensesAr?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-br from-aviation-navy to-[hsl(215,50%,18%)] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden"
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <pattern id="licensesPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                          <circle cx="15" cy="15" r="1" fill="currentColor" className="text-white" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#licensesPattern)" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative">
                    <span className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </span>
                    {t('الرخص المكتسبة', 'Licenses Acquired')}
                  </h3>
                  <div className="space-y-3 relative">
                    {pkg.licensesAr.map((license, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent to-accent/60" />
                        <span className="font-medium">
                          {t(license, pkg.licensesEn?.[i] || license)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Registration Form Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card rounded-3xl shadow-2xl sticky top-24 overflow-hidden border border-border/50"
              >
                {/* Form Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <pattern id="formPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="10" cy="10" r="1" fill="currentColor" className="text-white" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#formPattern)" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold relative">
                    {t('للتسجيل السريع', 'Quick Registration')}
                  </h3>
                  <p className="text-sm text-white/80 mt-1 relative">
                    {t('تفضل بتعبئة البيانات', 'Please fill in your details')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <Label htmlFor="firstName" className="text-sm">{t('الإسم الأول', 'First Name')} *</Label>
                      <Input 
                        id="firstName" 
                        name="firstName" 
                        required 
                        className="mt-1.5 rounded-xl border-border/50 focus:border-primary transition-colors"
                      />
                    </motion.div>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <Label htmlFor="lastName" className="text-sm">{t('الإسم الأخير', 'Last Name')} *</Label>
                      <Input 
                        id="lastName" 
                        name="lastName" 
                        required 
                        className="mt-1.5 rounded-xl border-border/50 focus:border-primary transition-colors"
                      />
                    </motion.div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm">{t('الجوال', 'Phone')} *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      required 
                      className="mt-1.5 rounded-xl border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">{t('البريد الإلكتروني', 'Email')} *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      className="mt-1.5 rounded-xl border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">{t('النوع', 'Gender')}</Label>
                    <RadioGroup name="gender" defaultValue="male" className="flex gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="male" id="male" className="border-primary data-[state=checked]:bg-primary" />
                        <Label htmlFor="male" className="cursor-pointer text-sm">{t('ذكر', 'Male')}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="female" id="female" className="border-primary data-[state=checked]:bg-primary" />
                        <Label htmlFor="female" className="cursor-pointer text-sm">{t('أنثى', 'Female')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm">{t('الرسالة', 'Message')} *</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      rows={4} 
                      required 
                      className="mt-1.5 rounded-xl border-border/50 focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full gap-2 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-base font-medium" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <motion.div 
                          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <>
                          {t('إرسال الطلب', 'Submit Application')}
                          <Arrow className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default PackageDetail;
