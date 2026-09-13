import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap, ChevronRight, Plane, Quote, Calendar, Star, Award } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageSeo from '@/components/seo/PageSeo';
import { stripHtml } from '@/lib/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

const GraduateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, direction } = useLanguage();
  const [graduate, setGraduate] = useState<GraduateItem | null>(null);
  const [relatedGraduates, setRelatedGraduates] = useState<GraduateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchGraduate = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'graduates', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setGraduate({ id: docSnap.id, ...docSnap.data() } as GraduateItem);
        }

        // Fetch related graduates
        const relatedQuery = query(
          collection(db, 'graduates'),
          orderBy('graduationDate', 'desc'),
          limit(4)
        );
        const relatedSnapshot = await getDocs(relatedQuery);
        const related = relatedSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as GraduateItem))
          .filter(g => g.id !== id && g.published !== false)
          .slice(0, 3);
        setRelatedGraduates(related);
      } catch (error) {
        console.error('Error fetching graduate:', error);
      }
      setLoading(false);
    };

    fetchGraduate();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <GraduationCap className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!graduate) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <GraduationCap className="w-20 h-20 text-muted-foreground/30" />
          <p className="text-xl text-muted-foreground">{t('الخريج غير موجود', 'Graduate not found')}</p>
          <Link to="/graduates">
            <Button className="gap-2">
              <Arrow className="w-4 h-4 rotate-180" />
              {t('العودة للخريجين', 'Back to Graduates')}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSeo
        pageKey={`graduate-${graduate.id}`}
        path={`/graduates/${graduate.id}`}
        defaultTitleAr={graduate.nameAr}
        defaultTitleEn={graduate.nameEn}
        defaultDescriptionAr={stripHtml(graduate.storyAr || graduate.titleAr || '', 155)}
        defaultDescriptionEn={stripHtml(graduate.storyEn || graduate.titleEn || '', 155)}
        image={graduate.imageUrl}
        breadcrumbs={[{ name: t('الرئيسية', 'Home'), path: '/' }, { name: t('نجوم الطيران', 'Flying Stars'), path: '/graduates' }, { name: t(graduate.nameAr, graduate.nameEn), path: `/graduates/${graduate.id}` }]}
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-aviation-navy via-aviation-navy to-primary overflow-hidden pt-24 pb-32">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <FloatingPlane delay={0} className="top-[30%]" />
          <FloatingPlane delay={7} className="top-[60%]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-white transition-colors">
                {t('الرئيسية', 'Home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <Link to="/graduates" className="text-white/70 hover:text-white transition-colors">
                {t('نجوم الطيران', 'Flying Stars')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <span className="font-medium text-white">{t(graduate.nameAr, graduate.nameEn)}</span>
            </div>
          </motion.div>

          {/* Graduate Info */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
                {graduate.imageUrl ? (
                  <img
                    src={graduate.imageUrl}
                    alt={t(graduate.nameAr, graduate.nameEn)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-32 h-32 text-white/30" />
                  </div>
                )}
              </div>
              
              {/* Decorative elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <GraduationCap className="w-10 h-10 text-secondary-foreground" />
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              >
                <Award className="w-8 h-8 text-primary-foreground" />
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white"
            >
              {graduate.featured && (
                <div className="inline-flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  {t('خريج مميز', 'Featured Graduate')}
                </div>
              )}
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t(graduate.nameAr, graduate.nameEn)}
              </h1>
              
              <p className="text-white text-xl mb-6">
                {t(graduate.titleAr, graduate.titleEn)}
              </p>

              <div className="flex flex-wrap gap-4 text-white/70 mb-8">
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Calendar className="w-4 h-4" />
                  {formatDate(graduate.graduationDate)}
                </span>
                {graduate.program && (
                  <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <Plane className="w-4 h-4" />
                    {graduate.program}
                  </span>
                )}
              </div>

              {graduate.quoteAr && (
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                   <Quote className="absolute -top-3 -start-3 w-10 h-10 text-white" />
                  <p className="text-white text-lg italic leading-relaxed">
                    "{t(graduate.quoteAr, graduate.quoteEn)}"
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Story Section */}
      {(graduate.storyAr || graduate.storyEn) && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl border shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{t('قصة النجاح', 'Success Story')}</h2>
                    <p className="text-sm text-muted-foreground">{t(graduate.nameAr, graduate.nameEn)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:p-12">
                <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                  {t(graduate.storyAr, graduate.storyEn)}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Related Graduates */}
      {relatedGraduates.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('المزيد من نجوم الطيران', 'More Flying Stars')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {relatedGraduates.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/graduates/${item.id}`}>
                    <div className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-xl transition-all hover:-translate-y-2">
                      <div className="aspect-square overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={t(item.nameAr, item.nameEn)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <GraduationCap className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {t(item.nameAr, item.nameEn)}
                        </h3>
                        <p className="text-sm text-primary">{t(item.titleAr, item.titleEn)}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/graduates">
                <Button className="gap-2 rounded-full">
                  {t('عرض جميع الخريجين', 'View All Graduates')}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default GraduateDetail;
