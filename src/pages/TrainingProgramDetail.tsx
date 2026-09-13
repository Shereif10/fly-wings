import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { Plane, ChevronRight, ArrowLeft, ArrowRight, Clock, CheckCircle, GraduationCap, Target, Award } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageSeo from '@/components/seo/PageSeo';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureHtml, stripHtml } from '@/lib/content';

interface TrainingProgram {
  id: string;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationAr?: string;
  durationEn?: string;
  imageUrl: string;
  order: number;
  published: boolean;
}

const TrainingProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, direction } = useLanguage();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [allPrograms, setAllPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchProgram = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'training_programs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProgram({ id: docSnap.id, ...docSnap.data() } as TrainingProgram);
        }

        // Fetch all programs for navigation
        const q = query(collection(db, 'training_programs'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram))
          .filter(p => p.published !== false);
        setAllPrograms(fetched);
      } catch (error) {
        console.error('Error fetching program:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id]);

  const currentIndex = allPrograms.findIndex(p => p.id === id);
  const prevProgram = currentIndex > 0 ? allPrograms[currentIndex - 1] : null;
  const nextProgram = currentIndex < allPrograms.length - 1 ? allPrograms[currentIndex + 1] : null;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Plane className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</p>
        </div>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Plane className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">{t('البرنامج غير موجود', 'Program not found')}</h2>
          <Link to="/training-programs">
            <Button>{t('العودة للبرامج', 'Back to Programs')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSeo
        pageKey={`training-program-${program.id}`}
        path={`/training-programs/${program.id}`}
        defaultTitleAr={program.titleAr}
        defaultTitleEn={program.titleEn}
        defaultDescriptionAr={stripHtml(program.shortDescAr || program.descriptionAr || '', 155)}
        defaultDescriptionEn={stripHtml(program.shortDescEn || program.descriptionEn || '', 155)}
        image={program.imageUrl}
        breadcrumbs={[{ name: t('الرئيسية', 'Home'), path: '/' }, { name: t('البرامج التدريبية', 'Training Programs'), path: '/training-programs' }, { name: t(program.titleAr, program.titleEn), path: `/training-programs/${program.id}` }]}
      />
      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-aviation-navy overflow-hidden min-h-[auto] md:min-h-[60vh] pt-24">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Animated Floating Planes */}
        <motion.div
          className="absolute top-24 left-[10%]"
          animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane className="w-12 h-12 text-white/20 rotate-45" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-[15%]"
          animate={{ y: [0, 15, 0], x: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Plane className="w-16 h-16 text-secondary/30 -rotate-12" />
        </motion.div>

        {/* Glowing Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/20 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-white transition-colors">
                {t('الرئيسية', 'Home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <Link to="/training-programs" className="text-white/70 hover:text-white transition-colors">
                {t('مراحل التدريب', 'Training Stages')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <span className="font-medium text-white">{t(program.titleAr, program.titleEn)}</span>
            </div>
          </motion.div>

          {/* Title & CTA - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-10"
          >
            {/* Stage Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 mb-6">
              <Plane className="w-4 h-4" />
              <span className="text-sm font-bold">{t(`المرحلة ${currentIndex + 1}`, `Stage ${currentIndex + 1}`)}</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t(program.titleAr, program.titleEn)}
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              {t(program.shortDescAr, program.shortDescEn)}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/packages">
                <Button size="lg" className="gap-2 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <GraduationCap className="w-5 h-5" />
                  {t('عرض الباقات', 'View Packages')}
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 text-white hover:bg-white/10">
                  {t('تواصل معنا', 'Contact Us')}
                  <Arrow className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Program Image */}
          {program.imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <img
                  src={program.imageUrl}
                  alt={t(program.titleAr, program.titleEn)}
                  className="w-full aspect-video object-cover"
                />
              </div>
            </motion.div>
          )}

          {/* Info Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-3 md:gap-4 mt-10 max-w-2xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
              <p className="text-white/60 text-xs mb-1">{t('مدة المرحلة', 'Duration')}</p>
              <p className="text-white font-bold text-sm">
                {program.durationAr || program.durationEn 
                  ? t(program.durationAr || '', program.durationEn || '')
                  : t('حسب البرنامج', 'Per Program')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-white/60 text-xs mb-1">{t('ترتيب المرحلة', 'Order')}</p>
              <p className="text-white font-bold text-sm">
                {t(`${currentIndex + 1} من ${allPrograms.length}`, `${currentIndex + 1} of ${allPrograms.length}`)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {/* Description */}
                <div
                  className="article-content prose prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: ensureHtml(t(program.descriptionAr, program.descriptionEn)) }}
                />

                {/* Duration if available */}
                {(program.durationAr || program.durationEn) && (
                  <div className="mt-8 p-6 bg-muted rounded-2xl">
                    <div className="flex items-center gap-3 text-right">
                      <Clock className="w-6 h-6 text-primary" />
                      <div>
                        <h4 className="font-bold text-foreground">{t('مدة البرنامج', 'Program Duration')}</h4>
                        <p className="text-muted-foreground">{t(program.durationAr || '', program.durationEn || '')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Other Stages */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-6 shadow-soft sticky top-24"
              >
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  {t('مراحل التدريب الأخرى', 'Other Training Stages')}
                </h3>
                <div className="space-y-3">
                  {allPrograms.map((p, index) => (
                    <Link
                      key={p.id}
                      to={`/training-programs/${p.id}`}
                      className={`block p-4 rounded-xl transition-all ${
                        p.id === id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          p.id === id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{t(p.titleAr, p.titleEn)}</span>
                        {p.id === id && <CheckCircle className="w-4 h-4 ms-auto" />}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Link to="/contact">
                    <Button className="w-full gap-2 rounded-full">
                      <Plane className="w-4 h-4 rotate-[-45deg]" />
                      {t('سجل الآن', 'Register Now')}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 flex justify-between items-center gap-4"
          >
            {prevProgram ? (
              <Link to={`/training-programs/${prevProgram.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2 rounded-xl py-6 justify-start">
                  <ArrowRight className="w-5 h-5" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('المرحلة السابقة', 'Previous Stage')}</p>
                    <p className="font-medium">{t(prevProgram.titleAr, prevProgram.titleEn)}</p>
                  </div>
                </Button>
              </Link>
            ) : <div className="flex-1" />}
            
            {nextProgram ? (
              <Link to={`/training-programs/${nextProgram.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2 rounded-xl py-6 justify-end">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">{t('المرحلة التالية', 'Next Stage')}</p>
                    <p className="font-medium">{t(nextProgram.titleAr, nextProgram.titleEn)}</p>
                  </div>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            ) : <div className="flex-1" />}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default TrainingProgramDetail;