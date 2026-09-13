import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Share2, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import PageSeo from '@/components/seo/PageSeo';
import { stripHtml } from '@/lib/content';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Activity {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  images: string[];
  date: string;
  category: string;
}

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'activities', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActivity({ id: docSnap.id, ...docSnap.data() } as Activity);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
      setLoading(false);
    };
    fetchActivity();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const nextImage = () => {
    if (activity?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % activity.images.length);
    }
  };

  const prevImage = () => {
    if (activity?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + activity.images.length) % activity.images.length);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!activity) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-xl text-muted-foreground mb-4">
            {t('لم يتم العثور على النشاط', 'Activity not found')}
          </p>
          <Link to="/activities">
            <Button>{t('العودة للأنشطة', 'Back to Activities')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageSeo
        pageKey={`activity-${activity.id}`}
        path={`/activities/${activity.id}`}
        defaultTitleAr={activity.titleAr}
        defaultTitleEn={activity.titleEn}
        defaultDescriptionAr={stripHtml(activity.excerptAr || activity.contentAr || '', 155)}
        defaultDescriptionEn={stripHtml(activity.excerptEn || activity.contentEn || '', 155)}
        image={activity.images?.[0]}
        breadcrumbs={[{ name: t('الرئيسية', 'Home'), path: '/' }, { name: t('الأنشطة', 'Activities'), path: '/activities' }, { name: t(activity.titleAr, activity.titleEn), path: `/activities/${activity.id}` }]}
      />
      {/* Hero with Wave Pattern */}
      <section className="relative overflow-hidden bg-aviation-navy pt-20">
        {/* Wave Pattern Top */}
        <div className="absolute top-0 inset-x-0">
          <svg className="w-full h-16" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,30 Q360,60 720,30 T1440,30 V0 H0 Z" fill="hsl(var(--background))" opacity="0.1" />
          </svg>
        </div>

        {/* Animated plane pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <svg width="32" height="20" viewBox="0 0 40 24" fill="currentColor" className="text-white">
                <path d="M38.5 12L30 4.5V9.5L10 9.5L0 12L10 14.5L30 14.5V19.5L38.5 12Z" />
              </svg>
            </motion.div>
          ))}
        </div>

        <div className="container mx-auto container-padding relative z-10 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/60 mb-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">
              {t('الرئيسية', 'Home')}
            </Link>
            <span>{'>'}</span>
            <Link to="/activities" className="hover:text-white transition-colors">
              {t('الأنشطة', 'Activities')}
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-2 lg:order-1"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t(activity.titleAr, activity.titleEn)}
              </h1>
              <div className="flex items-center gap-4 text-white/70 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(activity.date)}
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                  {activity.category}
                </span>
              </div>
            </motion.div>

            {/* Logo decoration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <svg viewBox="0 0 200 150" className="w-48 h-36 text-white opacity-20">
                <path
                  d="M40 75 L80 40 L90 50 L60 75 L90 100 L80 110 Z M100 75 L140 40 L150 50 L120 75 L150 100 L140 110 Z M160 75 L170 40 L180 50 L165 75 L180 100 L170 110 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Wave Pattern Bottom */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,40 1440,30 L1440,60 L0,60 Z" fill="hsl(var(--background))" />
        </svg>
      </section>

      {/* Image Carousel */}
      {activity.images && activity.images.length > 0 && (
        <section className="container mx-auto container-padding -mt-8 relative z-20">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Main Image */}
              <div className="relative aspect-video">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={activity.images[currentImageIndex]}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                
                {activity.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      {direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      {direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />}
                    </button>
                  </>
                )}
              </div>

              {/* Second Image or Placeholder */}
              {activity.images[1] && (
                <div className="relative aspect-video hidden md:block">
                  <img
                    src={activity.images[(currentImageIndex + 1) % activity.images.length]}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Dots */}
            {activity.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {activity.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <section className="section-padding bg-background">
        <div className="container mx-auto container-padding">
          <div className="max-w-4xl mx-auto">
            {/* Article Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{
                __html: t(activity.contentAr, activity.contentEn) || t(activity.excerptAr, activity.excerptEn)
              }}
            />

            {/* Share */}
            <div className="flex items-center gap-4 py-6 border-t">
              <span className="text-muted-foreground">{t('مشاركة:', 'Share:')}</span>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#0077B5] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(t(activity.titleAr, activity.titleEn))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                }}
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-center pt-6 border-t">
              <Link to="/activities">
                <Button variant="outline" className="gap-2">
                  <Arrow className="w-4 h-4 rotate-180" />
                  {t('العودة للأنشطة', 'Back to Activities')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ActivityDetail;
