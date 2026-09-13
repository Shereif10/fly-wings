import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { Plane, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface TrainingProgram {
  id: string;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;
  published: boolean;
}

const defaultPrograms: TrainingProgram[] = [
  {
    id: '1',
    titleAr: 'اللغة الإنجليزية',
    titleEn: 'English Language',
    shortDescAr: 'في هذه المرحلة تقوم أجنحة الطيران بتعليم الطالب اللغة الإنجليزية',
    shortDescEn: 'In this stage, Fly Wings teaches students the English language',
    descriptionAr: 'في هذه المرحلة تقوم أجنحة الطيران بتعليم الطالب اللغة الانجليزية بأكثر طرق التعليم جذباً عن طريق مدربين محترفين...',
    descriptionEn: 'In this stage, Fly Wings teaches students English using the most engaging methods through professional trainers...',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    order: 1,
    published: true,
  },
  {
    id: '2',
    titleAr: 'الدراسة الأرضية',
    titleEn: 'Ground Study',
    shortDescAr: 'في هذه المرحلة سوف تقوم أجنحة الطيران بتقديم محاضرات',
    shortDescEn: 'In this stage, Fly Wings will provide lectures',
    descriptionAr: 'في هذه المرحلة سوف تقوم أجنحة الطيران بتقديم محاضرات نظرية متقدمة...',
    descriptionEn: 'In this stage, Fly Wings will provide advanced theoretical lectures...',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    order: 2,
    published: true,
  },
  {
    id: '3',
    titleAr: 'الطيران العملي',
    titleEn: 'Practical Flying',
    shortDescAr: 'تعتبر هذه المرحلة هي الأخيرة بالنسبة للمتدرب',
    shortDescEn: 'This is the final stage for the trainee',
    descriptionAr: 'تعتبر هذه المرحلة هي الأخيرة بالنسبة للمتدرب وتقوم أجنحة الطيران بتدريب الطالب على الطيران العملي...',
    descriptionEn: 'This is the final stage for the trainee where Fly Wings trains students on practical flying...',
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
    order: 3,
    published: true,
  },
];

const TrainingPrograms = () => {
  const { t, direction } = useLanguage();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const q = query(collection(db, 'training_programs'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TrainingProgram))
          .filter(p => p.published !== false);
        setPrograms(fetched.length > 0 ? fetched : defaultPrograms);
      } catch (error) {
        console.error('Error fetching training programs:', error);
        setPrograms(defaultPrograms);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <Layout>
      <PageSeo
        pageKey="training-programs"
        path="/training-programs"
        defaultTitleAr={'مراحل التدريب — أجنحة الطيران'}
        defaultTitleEn={'Training Programs — Fly Wings'}
        defaultDescriptionAr={'مراحل التدريب في أكاديمية أجنحة الطيران من اللغة الإنجليزية حتى التدريب العملي.'}
        defaultDescriptionEn={'Fly Wings training stages from aviation English to practical flight training.'}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-aviation-navy overflow-hidden min-h-[50vh] pt-24">
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
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/20 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-white transition-colors">
                {t('الرئيسية', 'Home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <span className="font-medium text-white">{t('مراحل التدريب', 'Training Stages')}</span>
            </div>
          </motion.div>

          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-4 h-4 text-secondary" />
              </motion.div>
              <span className="text-white/90 text-sm font-medium">{t('رحلتك نحو السماء', 'Your Journey to the Sky')}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ x: [0, -10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-8 h-8 text-secondary rotate-[225deg]" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {t('مراحل التدريب', 'Training Stages')}
              </h1>
              <motion.div
                animate={{ x: [0, 10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Plane className="w-8 h-8 text-secondary rotate-[-45deg]" />
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              {t('تعرف على مراحل رحلتك التدريبية مع أجنحة الطيران', 'Discover the stages of your training journey with Fly Wings')}
            </motion.p>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {programs.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/training-programs/${program.id}`}>
                    <div className={`bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all group flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                      {/* Image */}
                      <div className="md:w-1/3 relative overflow-hidden">
                        <img
                          src={program.imageUrl}
                          alt={t(program.titleAr, program.titleEn)}
                          className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 start-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-bold">
                          {t(`المرحلة ${index + 1}`, `Stage ${index + 1}`)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-center text-right">
                        <div className="flex items-center gap-3 mb-3">
                          <Plane className="w-6 h-6 text-primary rotate-[-45deg]" />
                          <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {t(program.titleAr, program.titleEn)}
                          </h3>
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {t(program.shortDescAr, program.shortDescEn)}
                        </p>
                        <Button className="self-start gap-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 group/btn">
                          <motion.div
                            className="group-hover/btn:translate-x-1 transition-transform"
                          >
                            <Plane className="w-4 h-4 rotate-[-45deg]" />
                          </motion.div>
                          {t('اقرأ المزيد', 'Read More')}
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="bg-aviation-navy rounded-2xl p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('هل أنت مستعد للبدء؟', 'Are you ready to start?')}
              </h3>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                {t('انضم إلى أجنحة الطيران وابدأ رحلتك نحو تحقيق حلمك', 'Join Fly Wings and start your journey towards achieving your dream')}
              </p>
              <Link to="/contact">
                <Button className="gap-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Plane className="w-4 h-4 rotate-[-45deg]" />
                  {t('تواصل معنا', 'Contact Us')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default TrainingPrograms;