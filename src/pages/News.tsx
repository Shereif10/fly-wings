import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Grid, List, Plane } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  imageUrl: string;
  date: string;
  category: string;
  featured: boolean;
  published: boolean;
  slug?: string;
}

const defaultNews: NewsItem[] = [
  {
    id: '1',
    titleAr: 'أجنحة الطيران تحقق إنجازاً تاريخياً في مجال التدريب',
    titleEn: 'Fly Wings Achieves Historic Achievement in Training',
    excerptAr: 'حققت أكاديمية أجنحة الطيران إنجازاً تاريخياً بتخريج أكبر دفعة من الطيارين المحترفين',
    excerptEn: 'Fly Wings Academy achieved a historic milestone by graduating the largest batch of professional pilots',
    contentAr: 'تفاصيل الخبر...',
    contentEn: 'News details...',
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800',
    date: '2025-01-15',
    category: 'أخبار',
    featured: true,
    published: true,
  },
  {
    id: '2',
    titleAr: 'شراكة استراتيجية جديدة مع أكاديميات عالمية',
    titleEn: 'New Strategic Partnership with Global Academies',
    excerptAr: 'أعلنت أجنحة الطيران عن شراكة استراتيجية مع عدة أكاديميات طيران عالمية',
    excerptEn: 'Fly Wings announced a strategic partnership with several global aviation academies',
    contentAr: 'تفاصيل الخبر...',
    contentEn: 'News details...',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800',
    date: '2025-01-10',
    category: 'شراكات',
    featured: false,
    published: true,
  },
  {
    id: '3',
    titleAr: 'افتتاح مركز تدريب جديد في الرياض',
    titleEn: 'Opening of New Training Center in Riyadh',
    excerptAr: 'تم افتتاح مركز تدريب جديد مجهز بأحدث أجهزة المحاكاة',
    excerptEn: 'A new training center equipped with the latest simulators has been opened',
    contentAr: 'تفاصيل الخبر...',
    contentEn: 'News details...',
    imageUrl: 'https://images.unsplash.com/photo-1559060017-445fb4429b21?q=80&w=800',
    date: '2025-01-05',
    category: 'أخبار',
    featured: false,
    published: true,
  },
];

const News = () => {
  const { t, direction } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Simple query to avoid composite index requirement
        const newsQuery = query(
          collection(db, 'news'),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(newsQuery);
        if (!snapshot.empty) {
          // Filter published client-side
          const fetchedNews = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as NewsItem))
            .filter(item => item.published !== false);
          setNews(fetchedNews.length > 0 ? fetchedNews : defaultNews);
        } else {
          setNews(defaultNews);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback without ordering
        try {
          const fallbackQuery = query(collection(db, 'news'));
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackNews = fallbackSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as NewsItem))
            .filter(item => item.published !== false)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setNews(fallbackNews.length > 0 ? fallbackNews : defaultNews);
        } catch {
          setNews(defaultNews);
        }
      }
      setLoading(false);
    };
    fetchNews();

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const featuredNews = news.find(n => n.featured) || news[0];
  const otherNews = news.filter(n => n.id !== featuredNews?.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <PageSeo
        pageKey="news"
        path="/news"
        defaultTitleAr={'الأخبار — أجنحة الطيران'}
        defaultTitleEn={'News — Fly Wings'}
        defaultDescriptionAr={'آخر أخبار وفعاليات أكاديمية أجنحة الطيران.'}
        defaultDescriptionEn={'Latest news and updates from Fly Wings Academy.'}
      />

      {/* Hero Section with Navy Background and Pattern */}
      <section ref={heroRef} className="relative bg-aviation-navy overflow-hidden min-h-[60vh] pt-24">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Animated Floating Planes */}
        <motion.div
          className="absolute top-20 left-[10%]"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane className="w-12 h-12 text-white/20 rotate-45" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-[15%]"
          animate={{ 
            y: [0, 15, 0],
            x: [0, -15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Plane className="w-16 h-16 text-secondary/30 -rotate-12" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-32 left-[20%]"
          animate={{ 
            y: [0, 25, 0],
            x: [0, 20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Plane className="w-10 h-10 text-white/15 rotate-[30deg]" />
        </motion.div>

        <motion.div
          className="absolute top-[60%] right-[8%]"
          animate={{ 
            y: [0, -18, 0],
            x: [0, 12, 0],
            rotate: [0, -8, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        >
          <Plane className="w-14 h-14 text-secondary/25 rotate-[60deg]" />
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
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
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
              <span className="font-medium text-white">{t('الأخبار', 'News')}</span>
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
              <span className="text-white/90 text-sm font-medium">{t('آخر المستجدات', 'Latest Updates')}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ x: [0, -10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-8 h-8 text-secondary rotate-[225deg]" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {t('أحدث الأخبار', 'Latest News')}
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
              className="text-white/70 mt-4 text-lg max-w-2xl mx-auto"
            >
              {t('تابع آخر أخبار ومستجدات أكاديمية أجنحة الطيران', 'Stay updated with the latest news from Fly Wings Academy')}
            </motion.p>
          </motion.div>

          {/* Featured News Card */}
          {featuredNews && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              {/* Content Side */}
              <div className="order-2 md:order-1 text-right">
                <span className="inline-block bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4">
                  {featuredNews.category || t('الأخبار', 'News')}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                  {t(featuredNews.titleAr, featuredNews.titleEn)}
                </h2>
                <p className="text-white/70 flex items-center justify-end gap-2 mb-4">
                  <span>{formatDate(featuredNews.date)}</span>
                  <Calendar className="w-4 h-4" />
                </p>
                <p className="text-white/80 mb-6 line-clamp-3">
                  {t(featuredNews.excerptAr, featuredNews.excerptEn)}
                </p>
                <Link to={`/news/${featuredNews.slug || featuredNews.id}`}>
                  <Button className="gap-2 rounded-full bg-white text-aviation-navy hover:bg-white/90">
                    <span>{t('قراءة المزيد', 'Read More')}</span>
                    <div className="w-6 h-6 rounded-full bg-aviation-navy/20 flex items-center justify-center">
                      <Arrow className="w-3 h-3" />
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Image Side */}
              <div className="order-1 md:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={featuredNews.imageUrl}
                    alt={t(featuredNews.titleAr, featuredNews.titleEn)}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* All News Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('جميع الأخبار', 'All News')}
            </h2>
            <p className="text-muted-foreground">
              {t('تصفح أخبار أجنحة الطيران ومستجداته، واضغط لقراءة المزيد', 'Browse Flight Wings news and updates, click to read more')}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-end gap-2 mb-8">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2 rounded-full"
            >
              <Grid className="w-4 h-4" />
              {t('عناصر', 'Grid')}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2 rounded-full"
            >
              <List className="w-4 h-4" />
              {t('قائمة', 'List')}
            </Button>
          </div>

          {/* News Grid */}
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
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <NewsCard item={item} viewMode={viewMode} formatDate={formatDate} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button className="gap-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 group">
              <motion.div
                className="group-hover:translate-x-1 transition-transform"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-4 h-4 rotate-[-45deg]" />
              </motion.div>
              {t('المزيد من الأخبار', 'More News')}
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

// News Card Component
interface NewsCardProps {
  item: NewsItem;
  viewMode: 'grid' | 'list';
  formatDate: (date: string) => string;
}

const NewsCard = ({ item, viewMode, formatDate }: NewsCardProps) => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (viewMode === 'list') {
    return (
      <Link to={`/news/${item.slug || item.id}`}>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all group flex gap-6 p-4">
          <div className="w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={t(item.titleAr, item.titleEn)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-2">
              <span>{formatDate(item.date)}</span>
              <Calendar className="w-4 h-4" />
              <Plane className="w-4 h-4 text-primary rotate-[-45deg]" />
            </div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {t(item.titleAr, item.titleEn)}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {t(item.excerptAr, item.excerptEn)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/news/${item.slug || item.id}`}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all group h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={item.imageUrl}
            alt={t(item.titleAr, item.titleEn)}
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Date Badge */}
          <div className="absolute bottom-4 end-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {formatDate(item.date)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col text-right">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2">
            {t(item.titleAr, item.titleEn)}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
            {t(item.excerptAr, item.excerptEn)}
          </p>
          
          {/* Read More Button */}
          <Button className="w-full gap-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 group">
            <Plane className="w-4 h-4 rotate-[-45deg] group-hover:translate-x-1 transition-transform" />
            <span>{t('قراءة المزيد', 'Read More')}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default News;
