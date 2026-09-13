import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap, ChevronRight, Plane, Quote, Star, Calendar } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface GraduateItem {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  storyAr: string;
  storyEn: string;
  quoteAr: string;
  quoteEn: string;
  imageUrl: string;
  graduationDate: string;
  program: string;
  featured: boolean;
  published: boolean;
}

const FloatingPlane = ({ delay = 0, className = "" }: { delay?: number; className?: string }) => (
  <motion.div
    className={`absolute text-white/10 ${className}`}
    initial={{ x: "-100%", y: 0 }}
    animate={{ 
      x: "200%",
      y: [0, -15, 0, 15, 0],
    }}
    transition={{
      x: { duration: 20, repeat: Infinity, delay, ease: "linear" },
      y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    }}
  >
    <Plane className="w-6 h-6 rotate-[-35deg]" />
  </motion.div>
);

const Graduates = () => {
  const { t, direction } = useLanguage();
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const fetchGraduates = async () => {
      try {
        const graduatesQuery = query(
          collection(db, 'graduates'),
          orderBy('graduationDate', 'desc')
        );
        const snapshot = await getDocs(graduatesQuery);
        const fetchedGraduates = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as GraduateItem))
          .filter(item => item.published !== false);
        setGraduates(fetchedGraduates);
      } catch (error) {
        console.error('Error fetching graduates:', error);
      }
      setLoading(false);
    };
    fetchGraduates();

    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const featuredGraduate = graduates.find(g => g.featured) || graduates[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <Layout>
      <PageSeo
        pageKey="graduates"
        path="/graduates"
        defaultTitleAr={'نجوم الطيران — أجنحة الطيران'}
        defaultTitleEn={'Flying Stars — Fly Wings'}
        defaultDescriptionAr={'قصص نجاح خريجي أكاديمية أجنحة الطيران.'}
        defaultDescriptionEn={'Success stories of Fly Wings Academy graduates.'}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-gradient-to-br from-aviation-navy via-aviation-navy to-primary overflow-hidden min-h-[70vh] pt-24">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-64 h-64 bg-primary/30 rounded-full blur-[80px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <FloatingPlane delay={0} className="top-[20%]" />
          <FloatingPlane delay={5} className="top-[50%]" />
          <FloatingPlane delay={10} className="top-[80%]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

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
              <span className="font-medium text-white">{t('نجوم الطيران', 'Flying Stars')}</span>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <GraduationCap className="w-5 h-5 text-secondary" />
              </motion.div>
              <span className="text-white/90 text-sm font-medium">{t('قصص نجاح ملهمة', 'Inspiring Success Stories')}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Star className="w-8 h-8 text-secondary fill-secondary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {t('نجوم الطيران', 'Flying Stars')}
              </h1>
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Star className="w-8 h-8 text-secondary fill-secondary" />
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white text-lg max-w-2xl mx-auto"
            >
              {t('خريجونا هم فخرنا، تعرف على قصص نجاحهم الملهمة', 'Our graduates are our pride, learn about their inspiring success stories')}
            </motion.p>
          </motion.div>

          {/* Featured Graduate */}
          {featuredGraduate && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <Link to={`/graduates/${featuredGraduate.id}`}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl overflow-hidden hover:bg-white/15 transition-colors group">
                  <div className="grid md:grid-cols-2 gap-6 p-6">
                    {/* Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      {featuredGraduate.imageUrl ? (
                        <img
                          src={featuredGraduate.imageUrl}
                          alt={t(featuredGraduate.nameAr, featuredGraduate.nameEn)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <GraduationCap className="w-24 h-24 text-white/30" />
                        </div>
                      )}
                      <div className="absolute top-4 start-4 bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {t('خريج مميز', 'Featured Graduate')}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center text-white">
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        {t(featuredGraduate.nameAr, featuredGraduate.nameEn)}
                      </h2>
                      <p className="text-white text-lg mb-4">
                        {t(featuredGraduate.titleAr, featuredGraduate.titleEn)}
                      </p>
                      
                      {featuredGraduate.quoteAr && (
                        <div className="relative mb-6">
                          <Quote className="absolute -top-2 -start-2 w-8 h-8 text-white" />
                          <p className="text-white italic ps-6 line-clamp-3">
                            "{t(featuredGraduate.quoteAr, featuredGraduate.quoteEn)}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-white/60 text-sm mb-6">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(featuredGraduate.graduationDate)}
                        </span>
                        {featuredGraduate.program && (
                          <span className="flex items-center gap-1">
                            <Plane className="w-4 h-4" />
                            {featuredGraduate.program}
                          </span>
                        )}
                      </div>

                      <Button className="w-fit gap-2 rounded-full bg-white text-aviation-navy hover:bg-white/90">
                        <span>{t('اقرأ القصة كاملة', 'Read Full Story')}</span>
                        <Arrow className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* All Graduates Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('خريجونا المتميزون', 'Our Distinguished Graduates')}
            </h2>
            <p className="text-muted-foreground">
              {t('تعرف على المزيد من قصص النجاح الملهمة', 'Discover more inspiring success stories')}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <GraduationCap className="w-12 h-12 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</p>
            </div>
          ) : graduates.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-lg">
                {t('لا يوجد خريجين حالياً', 'No graduates available')}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {graduates.map((graduate, index) => (
                <motion.div
                  key={graduate.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/graduates/${graduate.id}`}>
                    <div className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden">
                        {graduate.imageUrl ? (
                          <img
                            src={graduate.imageUrl}
                            alt={t(graduate.nameAr, graduate.nameEn)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <GraduationCap className="w-20 h-20 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {graduate.featured && (
                          <div className="absolute top-4 start-4 bg-secondary text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {t('مميز', 'Featured')}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {t(graduate.nameAr, graduate.nameEn)}
                        </h3>
                        <p className="text-white/80 text-sm mb-3">
                          {t(graduate.titleAr, graduate.titleEn)}
                        </p>
                        
                        {graduate.quoteAr && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 italic">
                            "{t(graduate.quoteAr, graduate.quoteEn)}"
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(graduate.graduationDate)}
                          </span>
                          <motion.div
                            className="flex items-center gap-1 text-primary text-sm font-medium"
                            whileHover={{ x: 5 }}
                          >
                            <span>{t('اقرأ المزيد', 'Read More')}</span>
                            <Arrow className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Graduates;
