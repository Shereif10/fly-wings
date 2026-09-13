import { m as motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Plane, BookOpen, GraduationCap, Award, 
  Users, Clock, Globe2, Shield, Star, CheckCircle2, Play,
  ChevronLeft, ChevronRight, Quote, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cachedDoc } from '@/lib/firestoreCache';

import PartnersSection from '@/components/home/PartnersSection';
import PageSeo from '@/components/seo/PageSeo';
import { PackageCard, QuickRegistrationDialog } from '@/components/PackageCard';
import type { Package } from '@/components/PackageCard';
const heroVideoAsset = { url: '/media/hero.mp4' };
const heroPosterAsset = { url: '/media/hero-poster.jpg' };

// The original hero clip was 2.1 MB. A compressed copy is served from the CDN,
// so the heavy stored file is swapped out automatically.
const LEGACY_HERO_VIDEO = 'videos%2Fhero-1787823472270.mp4';
const resolveHeroVideo = (url: string) =>
  url && url.includes(LEGACY_HERO_VIDEO) ? heroVideoAsset.url : url;

// Page Content Types
interface Feature {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

interface PageContent {
  home: {
    badgeAr: string;
    badgeEn: string;
    heroTitleAr: string;
    heroTitleEn: string;
    heroSubtitleAr: string;
    heroSubtitleEn: string;
    heroVideoUrl: string;
    heroImageUrl: string;
    heroPosterUrl?: string;
    heroMediaType: 'video' | 'image';
    heroAnimatedTextAr: string;
    heroAnimatedTextEn: string;
  };
  homeAbout: {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    imageUrl: string;
    statsTitleAr: string;
    statsTitleEn: string;
    statsItems: Array<{
      id: string;
      value: string;
      labelAr: string;
      labelEn: string;
    }>;
  };
  stats: {
    graduates: number;
    graduatesLabelAr: string;
    graduatesLabelEn: string;
    years: number;
    yearsLabelAr: string;
    yearsLabelEn: string;
    partners: number;
    partnersLabelAr: string;
    partnersLabelEn: string;
    successRate: number;
    successRateLabelAr: string;
    successRateLabelEn: string;
  };
  features: {
    sectionTitleAr: string;
    sectionTitleEn: string;
    sectionSubtitleAr: string;
    sectionSubtitleEn: string;
    items: Feature[];
  };
}

const defaultContent: PageContent = {
  home: {
    badgeAr: 'التسجيل متاح الآن للدفعة الجديدة',
    badgeEn: 'Registration Now Open for New Batch',
    heroTitleAr: 'أجنحة الطيران',
    heroTitleEn: 'Fly Wings',
    heroSubtitleAr: 'أفضل برامج التدريب على الطيران في المملكة العربية السعودية',
    heroSubtitleEn: 'The best aviation training programs in Saudi Arabia',
    heroVideoUrl: '',
    heroImageUrl: '',
    heroPosterUrl: '',
    heroMediaType: 'video',
    heroAnimatedTextAr: 'الشغف نحو .. الطيران',
    heroAnimatedTextEn: 'Passion for .. Aviation',
  },
  homeAbout: {
    titleAr: 'أجنحة الطيران',
    titleEn: 'Fly Wings',
    subtitleAr: 'في سطور',
    subtitleEn: 'In Brief',
    descriptionAr: 'شركة سعودية رائدة في مجال التدريب على الطيران، تأسست لتكون الخيار الأول للراغبين في تحقيق حلم الطيران. نقدم برامج تدريبية متكاملة تبدأ من اللغة الإنجليزية وتنتهي بالحصول على رخصة الطيار التجاري.',
    descriptionEn: 'A leading Saudi company in aviation training, established to be the first choice for those who want to achieve their dream of flying. We offer comprehensive training programs starting from English language to obtaining a commercial pilot license.',
    imageUrl: '',
    statsTitleAr: 'الإحصائيات - 2021 - 2025',
    statsTitleEn: 'Statistics - 2021 - 2025',
    statsItems: [
      { id: '1', value: '58,900', labelAr: 'ساعات تدريب عملي', labelEn: 'Practical Training Hours' },
      { id: '2', value: '19,002', labelAr: 'ساعات تدريب نظري', labelEn: 'Theoretical Training Hours' },
      { id: '3', value: '19,934', labelAr: 'الإقلاع والهبوط', labelEn: 'Takeoffs & Landings' },
      { id: '4', value: '361', labelAr: 'متدرب طيران', labelEn: 'Aviation Trainees' },
      { id: '5', value: '209', labelAr: 'حصلوا على جميع الرخص', labelEn: 'Obtained All Licenses' },
      { id: '6', value: '101', labelAr: 'التحقوا بسوق العمل', labelEn: 'Joined Workforce' },
    ],
  },
  stats: {
    graduates: 1500,
    graduatesLabelAr: 'خريج ناجح',
    graduatesLabelEn: 'Successful Graduates',
    years: 15,
    yearsLabelAr: 'سنة خبرة',
    yearsLabelEn: 'Years Experience',
    partners: 25,
    partnersLabelAr: 'شريك تدريبي',
    partnersLabelEn: 'Training Partners',
    successRate: 98,
    successRateLabelAr: 'نسبة النجاح',
    successRateLabelEn: 'Success Rate',
  },
  features: {
    sectionTitleAr: 'لماذا أجنحة الطيران؟',
    sectionTitleEn: 'Why Fly Wings?',
    sectionSubtitleAr: 'نقدم لك تجربة تدريبية استثنائية تجمع بين الجودة والاحترافية',
    sectionSubtitleEn: 'We offer an exceptional training experience combining quality and professionalism',
    items: [
      { id: '1', titleAr: 'معتمد دولياً', titleEn: 'Internationally Certified', descriptionAr: 'شهادات معتمدة من ICAO والهيئة العامة للطيران المدني', descriptionEn: 'Certificates recognized by ICAO and GACA' },
      { id: '2', titleAr: 'مدربين محترفين', titleEn: 'Professional Instructors', descriptionAr: 'نخبة من الكابتنات ذوي الخبرة العالمية', descriptionEn: 'Elite captains with international experience' },
      { id: '3', titleAr: 'تدريب دولي', titleEn: 'International Training', descriptionAr: 'شراكات مع أفضل أكاديميات الطيران العالمية', descriptionEn: 'Partnerships with top global aviation academies' },
      { id: '4', titleAr: 'برامج مرنة', titleEn: 'Flexible Programs', descriptionAr: 'خطط تدريب تناسب جميع المستويات والاحتياجات', descriptionEn: 'Training plans for all levels and needs' },
    ],
  },
};

// Context for page content
const PageContentContext = createContext<PageContent>(defaultContent);

// Animated Counter Component
const Counter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, end]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Renders heavy below-the-fold sections only when they approach the viewport,
// which keeps initial JavaScript execution and Firestore reads off the critical path.
const DeferredSection = ({ children, minHeight = 420 }: { children: React.ReactNode; minHeight?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [show]);

  // The page-wide [data-reveal] scroll-reveal observer (see the effect below,
  // in Index) only scans the DOM once on mount, so it never sees `[data-reveal]`
  // sections that this wrapper mounts later. Mark them visible immediately here —
  // by the time this wrapper renders its children it has already decided they're
  // near the viewport, so there's nothing left to "reveal".
  useEffect(() => {
    if (!show) return;
    const node = ref.current;
    if (!node) return;
    node.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
  }, [show]);

  return <div ref={ref}>{show ? children : <div style={{ minHeight }} aria-hidden="true" />}</div>;
};

// About Preview Section for Homepage
const AboutPreviewSection = () => {
  const { t, direction } = useLanguage();
  const content = useContext(PageContentContext);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = (content.homeAbout.statsItems || []).map(stat => ({
    value: stat.value,
    label: { ar: stat.labelAr, en: stat.labelEn }
  }));

  return (
    <section ref={ref} data-reveal className="relative overflow-hidden">
      {/* Main About Section with Background - direct transition, no wave */}
      <div className="relative bg-aviation-navy">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={content.homeAbout.imageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1974"}
            alt="Aviation Training"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-aviation-navy/40 via-aviation-navy/70 to-aviation-navy/90" />
        </div>

        <div className="container mx-auto relative z-10 py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-8 items-center min-h-[500px]">
            {/* Stats Side - Left */}
            <motion.div
              className="lg:col-span-4 flex items-center px-4 lg:px-8"
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-start gap-6">
                {/* Vertical Text */}
                <div className="hidden lg:flex items-center h-full">
                  <span 
                    className="text-white/50 text-xs font-medium tracking-widest whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {t(content.homeAbout.statsTitleAr, content.homeAbout.statsTitleEn)}
                  </span>
                </div>

                {/* Stats Grid - Olive/Gold Style */}
                <div className="space-y-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -30 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    >
                      <div className="bg-gradient-to-r from-aviation-teal/95 to-aviation-blue/95 backdrop-blur-sm rounded-lg px-4 py-2.5 flex items-center gap-3 min-w-[180px] shadow-soft border border-white/10">
                        <div className="text-white/80 text-sm font-medium">
                          {t(stat.label.ar, stat.label.en)}
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-white mr-auto">
                          {stat.value}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Content Side - Right */}
            <motion.div
              className="lg:col-span-8 flex items-center px-4 lg:px-12"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <div className="max-w-2xl">
                {/* Logo Icon */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-4"
                >
                  <div className="w-16 h-16 flex items-center justify-center">
                    <svg viewBox="0 0 100 80" className="w-full h-full text-secondary" fill="currentColor">
                      <path d="M50 0L0 40L10 45L50 15L90 45L100 40L50 0Z" />
                      <path d="M20 50L50 25L80 50L85 47L50 18L15 47L20 50Z" opacity="0.7" />
                      <path d="M30 55L50 38L70 55L75 52L50 30L25 52L30 55Z" opacity="0.5" />
                    </svg>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1">
                    {t(content.homeAbout.titleAr, content.homeAbout.titleEn)}
                  </h2>
                  <h3 className="text-xl md:text-2xl font-bold text-secondary mb-4">
                    {t(content.homeAbout.subtitleAr, content.homeAbout.subtitleEn)}
                  </h3>
                </motion.div>

                {/* Description */}
                <motion.p 
                  className="text-base md:text-lg text-white/80 leading-relaxed mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {t(content.homeAbout.descriptionAr, content.homeAbout.descriptionEn)}
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Link to="/about">
                    <Button size="lg" className="gap-3 rounded-full px-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                      <span>{t('قراءة المزيد', 'Read More')}</span>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Arrow className="w-4 h-4" />
                      </div>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>
    </section>
  );
};

// Hero Section
const HeroSection = () => {
  const { t } = useLanguage();
  const content = useContext(PageContentContext);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Background video is heavy: only start downloading it after first paint,
  // and never on small screens, slow connections or reduced-motion setups.
  const [loadBgVideo, setLoadBgVideo] = useState(false);

  const heroVideoUrl = resolveHeroVideo(content.home.heroVideoUrl);
  const posterUrl =
    content.home.heroPosterUrl ||
    (heroVideoUrl === heroVideoAsset.url ? heroPosterAsset.url : '') ||
    content.home.heroImageUrl ||
    '';

  useEffect(() => {
    if (content.home.heroMediaType === 'image' || !heroVideoUrl) return;

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const conn = nav.connection;
    const slow = Boolean(conn?.saveData) || /2g/.test(conn?.effectiveType || '');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 768px)').matches;
    if (slow || reduced || small) return;

    let timer: number;
    const start = () => {
      timer = window.setTimeout(() => setLoadBgVideo(true), 800);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', start);
    };
  }, [content.home.heroMediaType, heroVideoUrl]);

  const handlePlayClick = () => {
    if (heroVideoUrl) {
      setShowVideo(true);
    }
  };

  return (
    <section data-reveal className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video/Image Background */}
      <div className="absolute inset-0">
        {content.home.heroMediaType === 'image' && content.home.heroImageUrl ? (
          <img
            src={content.home.heroImageUrl}
            alt="Hero background"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchpriority is a valid HTML attribute
            fetchpriority="high"
          />
        ) : heroVideoUrl ? (
          loadBgVideo ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={heroVideoUrl}
              poster={posterUrl || undefined}
              width={1080}
              height={1920}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            />
          ) : posterUrl ? (
            <img
              src={posterUrl}
              alt="Hero background"
              className="w-full h-full object-cover"
              width={1920}
              height={1080}
              loading="eager"
              decoding="async"
              // @ts-expect-error fetchpriority is a valid HTML attribute
              fetchpriority="high"
            />
          ) : (
            <div className="w-full h-full bg-gradient-hero" />
          )
        ) : (
          <div className="w-full h-full bg-gradient-hero" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Logo/Title */}
        <div className="mb-8 animate-fade-in">
          <img 
            src="/logo.png" 
            alt="Fly Wings" 
            className="h-32 md:h-48 mx-auto mb-6 drop-shadow-2xl"
            width={512}
            height={512}
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchpriority is a valid HTML attribute
            fetchpriority="high"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
            {t(content.home.heroTitleAr, content.home.heroTitleEn)}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mt-4">
            {t(content.home.heroSubtitleAr, content.home.heroSubtitleEn)}
          </p>
        </div>

        {/* Play Button */}
        {content.home.heroMediaType !== 'image' && heroVideoUrl && (
          <button
            onClick={handlePlayClick}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent/90 hover:bg-accent flex items-center justify-center mx-auto mb-12 transition-all hover:scale-110 shadow-2xl animate-scale-in"
          >
            <Play className="w-8 h-8 md:w-10 md:h-10 text-accent-foreground ml-1" fill="currentColor" />
          </button>
        )}

        {/* Animated Text */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-2xl md:text-4xl text-white font-bold">
            {t(content.home.heroAnimatedTextAr, content.home.heroAnimatedTextEn)}
          </p>
        </div>
      </div>


      {/* Video Modal */}
      {showVideo && heroVideoUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative w-full max-w-5xl aspect-video"
            onClick={e => e.stopPropagation()}
          >
            <video
              className="w-full h-full rounded-2xl"
              src={heroVideoUrl}
              width={1080}
              height={1920}
              controls
              autoPlay
            />
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white hover:text-accent"
            >
              {t('إغلاق', 'Close')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const { t } = useLanguage();
  const content = useContext(PageContentContext);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const icons = [Shield, Users, Globe2, Clock, Star, Award];

  return (
    <section ref={ref} data-reveal className="section-padding bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto container-padding relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t('لماذا نحن', 'Why Us')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t(content.features.sectionTitleAr, content.features.sectionTitleEn)}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t(content.features.sectionSubtitleAr, content.features.sectionSubtitleEn)}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.features.items.map((feature, index) => {
            const IconComponent = icons[index % icons.length];
            return (
              <motion.div
                key={feature.id}
                className="group bg-card rounded-3xl p-8 shadow-soft border border-border/50 card-hover"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {t(feature.titleAr, feature.titleEn)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(feature.descriptionAr, feature.descriptionEn)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Training Stages Section
const TrainingStages = () => {
  const { t, direction } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stages = [
    {
      step: '01',
      icon: BookOpen,
      title: { ar: 'اللغة الإنجليزية', en: 'English Language' },
      description: { ar: 'تأهيل لغوي متخصص للطيران مع التحضير لاختبار ICAO للحصول على المستوى المطلوب', en: 'Specialized aviation language training with ICAO test preparation to achieve required level' },
      duration: { ar: '٣-٦ أشهر', en: '3-6 months' },
      details: [
        { ar: 'دورة اللغة الإنجليزية التأسيسية', en: 'Foundation English Course' },
        { ar: 'مصطلحات الطيران الأساسية', en: 'Basic Aviation Terminology' },
        { ar: 'التحضير لاختبار ICAO', en: 'ICAO Test Preparation' },
        { ar: 'المستوى المطلوب: ICAO Level 4', en: 'Required Level: ICAO Level 4' },
      ],
    },
    {
      step: '02',
      icon: GraduationCap,
      title: { ar: 'الدراسة الأرضية', en: 'Ground School' },
      description: { ar: 'دراسة نظرية شاملة تشمل جميع علوم الطيران والملاحة الجوية والأنظمة', en: 'Comprehensive theoretical study covering all aviation sciences, navigation, and systems' },
      duration: { ar: '٤-٦ أشهر', en: '4-6 months' },
      details: [
        { ar: 'مبادئ الطيران وديناميكا الهواء', en: 'Principles of Flight & Aerodynamics' },
        { ar: 'الملاحة الجوية', en: 'Air Navigation' },
        { ar: 'الأرصاد الجوية', en: 'Meteorology' },
        { ar: 'أنظمة الطائرات', en: 'Aircraft Systems' },
        { ar: 'قوانين الطيران', en: 'Aviation Regulations' },
      ],
    },
    {
      step: '03',
      icon: Plane,
      title: { ar: 'التدريب العملي', en: 'Flight Training' },
      description: { ar: 'تدريب عملي على الطائرات في أفضل الأكاديميات العالمية للحصول على الرخص المطلوبة', en: 'Practical aircraft training at top global academies to obtain required licenses' },
      duration: { ar: '٨-١٢ شهر', en: '8-12 months' },
      details: [
        { ar: 'رخصة الطيار الخاص (PPL) - 45 ساعة', en: 'Private Pilot License (PPL) - 45 hours' },
        { ar: 'رخصة الطيران الآلي (IR) - 55 ساعة', en: 'Instrument Rating (IR) - 55 hours' },
        { ar: 'رخصة الطيار التجاري (CPL) - 150 ساعة', en: 'Commercial Pilot License (CPL) - 150 hours' },
        { ar: 'تدريب الطائرات متعددة المحركات (ME)', en: 'Multi-Engine Training (ME)' },
      ],
    },
  ];

  return (
    <section ref={ref} data-reveal className="section-padding bg-muted/50">
      <div className="container mx-auto container-padding">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            {t('مسار التدريب', 'Training Path')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('مراحل التدريب', 'Training Stages')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t(
              'رحلة متكاملة من البداية حتى الحصول على رخصة الطيار التجاري',
              'A complete journey from start to obtaining a commercial pilot license'
            )}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className={`hidden lg:block absolute top-16 ${direction === 'rtl' ? 'end-full' : 'start-full'} w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0`} />
              )}
              
              <div className="relative bg-card rounded-3xl p-8 shadow-card border h-full card-hover">
                {/* Step number */}
                <div className="absolute -top-4 start-8 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-bold">
                  {stage.step}
                </div>

                <div className="pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <stage.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {t(stage.title.ar, stage.title.en)}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t(stage.description.ar, stage.description.en)}
                  </p>
                  
                  {/* Details list */}
                  <ul className="space-y-2 mb-4">
                    {stage.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t(detail.ar, detail.en)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center gap-2 text-sm text-primary font-medium pt-4 border-t">
                    <Clock className="w-4 h-4" />
                    {t(stage.duration.ar, stage.duration.en)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section
const StatsSection = () => {
  const { t } = useLanguage();
  const content = useContext(PageContentContext);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    { value: content.stats.graduates, suffix: '+', label: { ar: content.stats.graduatesLabelAr, en: content.stats.graduatesLabelEn }, icon: Users },
    { value: content.stats.years, suffix: '+', label: { ar: content.stats.yearsLabelAr, en: content.stats.yearsLabelEn }, icon: Award },
    { value: content.stats.partners, suffix: '+', label: { ar: content.stats.partnersLabelAr, en: content.stats.partnersLabelEn }, icon: Globe2 },
    { value: content.stats.successRate, suffix: '%', label: { ar: content.stats.successRateLabelAr, en: content.stats.successRateLabelEn }, icon: Star },
  ];

  return (
    <section ref={ref} data-reveal className="py-16 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
      
      <div className="container mx-auto container-padding relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-white/70 font-medium">
                {t(stat.label.ar, stat.label.en)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Packages Preview
const PackagesPreview = () => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const packages = [
    {
      name: { ar: 'الشريحة الأولى - مع اللغة', en: 'Tier 1 - With Language' },
      features: [
        { ar: 'دورة اللغة الإنجليزية', en: 'English Course' },
        { ar: 'الدراسة الأرضية', en: 'Ground School' },
        { ar: 'التدريب العملي', en: 'Flight Training' },
        { ar: 'رخصة PPL + IR + CPL', en: 'PPL + IR + CPL License' },
      ],
      popular: false,
    },
    {
      name: { ar: 'الشريحة الثانية - بدون اللغة', en: 'Tier 2 - Without Language' },
      features: [
        { ar: 'مصطلحات الطيران', en: 'Aviation Terminology' },
        { ar: 'الدراسة النظرية', en: 'Theory Study' },
        { ar: '250 ساعة طيران', en: '250 Flight Hours' },
        { ar: '3 رخص طيران', en: '3 Licenses' },
      ],
      popular: true,
    },
    {
      name: { ar: 'شريحة التحويل', en: 'Conversion Tier' },
      features: [
        { ar: 'تحويل الرخصة الأجنبية', en: 'Foreign License Conversion' },
        { ar: 'اختبارات نظرية', en: 'Theory Exams' },
        { ar: 'تدريب تكميلي', en: 'Supplementary Training' },
      ],
      popular: false,
    },
  ];

  return (
    <section ref={ref} data-reveal className="section-padding bg-background">
      <div className="container mx-auto container-padding">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
            {t('البرامج التدريبية', 'Training Programs')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('اختر برنامجك', 'Choose Your Program')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t(
              'برامج متنوعة تناسب جميع المستويات والأهداف',
              'Various programs suitable for all levels and goals'
            )}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, index) => (
            <motion.div
              key={index}
              className={`relative bg-card rounded-3xl p-8 shadow-card border card-hover ${pkg.popular ? 'ring-2 ring-primary' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  {t('الأكثر طلباً', 'Most Popular')}
                </div>
              )}

              <h3 className="text-xl font-bold text-foreground mb-6 text-center">
                {t(pkg.name.ar, pkg.name.en)}
              </h3>

              <ul className="space-y-4 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{t(feature.ar, feature.en)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Link to="/packages">
            <Button size="lg" className="gap-2 rounded-2xl">
              {t('عرض جميع البرامج', 'View All Programs')}
              <Arrow className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const testimonials = [
    {
      name: { ar: 'محمد العتيبي', en: 'Mohammed Al-Otaibi' },
      role: { ar: 'طيار في الخطوط السعودية', en: 'Saudi Airlines Pilot' },
      content: { ar: 'تجربة استثنائية غيرت مجرى حياتي. الفريق محترف والتدريب على أعلى مستوى.', en: 'An exceptional experience that changed my life. Professional team and top-level training.' },
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      name: { ar: 'سارة المالكي', en: 'Sara Al-Malki' },
      role: { ar: 'طيارة في طيران ناس', en: 'Flynas Pilot' },
      content: { ar: 'أفضل قرار اتخذته في حياتي. الدعم المستمر والمتابعة كانت رائعة.', en: 'The best decision I ever made. Continuous support and follow-up were amazing.' },
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    {
      name: { ar: 'خالد الشمري', en: 'Khalid Al-Shammari' },
      role: { ar: 'طيار في طيران أديل', en: 'Flyadeal Pilot' },
      content: { ar: 'برنامج متكامل ومنظم. حققت حلمي بفضل فريق أجنحة الطيران.', en: 'A complete and organized program. I achieved my dream thanks to Fly Wings team.' },
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
  ];

  return (
    <section ref={ref} data-reveal className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t('قالوا عنا', 'Testimonials')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('تجارب خريجينا', 'Our Graduates Experiences')}
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            key={current}
            className="bg-card rounded-3xl p-8 md:p-12 shadow-card border text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
              "{t(testimonials[current].content.ar, testimonials[current].content.en)}"
            </p>
            <div className="flex items-center justify-center gap-4">
              <img 
                src={testimonials[current].image} 
                alt={t(testimonials[current].name.ar, testimonials[current].name.en)}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="text-start">
                <div className="font-bold text-foreground">
                  {t(testimonials[current].name.ar, testimonials[current].name.en)}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t(testimonials[current].role.ar, testimonials[current].role.en)}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCurrent((current - 1 + testimonials.length) % testimonials.length)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${index === current ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  onClick={() => setCurrent(index)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCurrent((current + 1) % testimonials.length)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Graduates Section - Flying Stars
interface GraduateItem {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  quoteAr: string;
  quoteEn: string;
  imageUrl: string;
  graduationDate: string;
  featured: boolean;
}

const GraduatesSection = () => {
  const { t, direction } = useLanguage();
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [loadingGraduates, setLoadingGraduates] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    const fetchGraduates = async () => {
      try {
        const graduatesQuery = query(
          collection(db, 'graduates'),
          orderBy('graduationDate', 'desc'),
          limit(6)
        );
        const snapshot = await getDocs(graduatesQuery);
        const fetchedGraduates = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as GraduateItem & { published?: boolean }))
          .filter(item => item.published !== false)
          .slice(0, 4);
        setGraduates(fetchedGraduates);
      } catch (error) {
        console.error('Error fetching graduates:', error);
      } finally {
        setLoadingGraduates(false);
      }
    };
    fetchGraduates();
  }, []);

  return (
    <section ref={ref} data-reveal className="section-padding bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-[100px]"
          style={{ top: '10%', right: '5%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-primary/10 rounded-full blur-[80px]"
          style={{ bottom: '20%', left: '10%' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <GraduationCap className="w-4 h-4" />
            </motion.span>
            <span>{t('نجوم الطيران', 'Flying Stars')}</span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('خريجونا فخرنا', 'Our Graduates, Our Pride')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('تعرف على قصص نجاح خريجينا الذين حققوا أحلامهم في عالم الطيران', 'Discover success stories of our graduates who achieved their dreams in aviation')}
          </p>
        </motion.div>

        {loadingGraduates ? (
          <div className="flex items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <GraduationCap className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
        ) : graduates.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-6">
              {t('لا يوجد خريجين منشورين حالياً', 'No published graduates yet')}
            </p>
            <Link to="/graduates">
              <Button variant="outline" size="lg" className="gap-2 rounded-full">
                {t('عرض صفحة الخريجين', 'View Graduates Page')}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {graduates.map((graduate, index) => (
              <Link key={graduate.id} to={`/graduates/${graduate.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {graduate.imageUrl ? (
                      <motion.img
                        src={graduate.imageUrl}
                        alt={t(graduate.nameAr, graduate.nameEn)}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {graduate.featured && (
                      <motion.div 
                        className="absolute top-3 end-3 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        {t('مميز', 'Featured')}
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {t(graduate.nameAr, graduate.nameEn)}
                    </h3>
                    <p className="text-sm text-white/80 mb-2 line-clamp-1">
                      {t(graduate.titleAr, graduate.titleEn)}
                    </p>
                    {graduate.quoteAr && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        "{t(graduate.quoteAr, graduate.quoteEn)}"
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loadingGraduates && graduates.length > 0 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/graduates">
              <Button className="gap-2 group px-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {t('عرض جميع الخريجين', 'View All Graduates')}
                <motion.div className="group-hover:translate-x-1 transition-transform">
                  <Arrow className="w-4 h-4" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

// News Section for Homepage
interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  imageUrl: string;
  date: string;
  category: string;
  featured: boolean;
  slug?: string;
}

const NewsSection = () => {
  const { t, direction } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Simple query without composite index requirement
        const newsQuery = query(
          collection(db, 'news'),
          orderBy('date', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(newsQuery);
        // Filter published news client-side to avoid index requirement
        const fetchedNews = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as NewsItem & { published?: boolean }))
          .filter(item => item.published !== false)
          .slice(0, 4);
        setNews(fetchedNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        try {
          const fallbackQuery = query(collection(db, 'news'), limit(10));
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackNews = fallbackSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as NewsItem & { published?: boolean }))
            .filter(item => item.published !== false)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4);
          setNews(fallbackNews);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const featuredNews = news[0];
  const otherNews = news.slice(1, 4);

  return (
    <section ref={ref} data-reveal className="section-padding bg-aviation-navy relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="newsHomePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0L0 30L10 35L50 10L90 35L100 30L50 0Z" fill="currentColor" className="text-white/30" />
              <path d="M50 20L20 40L30 45L50 30L70 45L80 40L50 20Z" fill="currentColor" className="text-white/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#newsHomePattern)" />
        </svg>
      </div>

      <div className="container mx-auto container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="text-right flex-1">
            <span className="inline-block px-4 py-1.5 bg-secondary/20 text-secondary rounded-full text-sm font-medium mb-4">
              {t('آخر الأخبار', 'Latest News')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t('أخبار أجنحة الطيران', 'Fly Wings News')}
            </h2>
          </div>
          <Link to="/news">
            <Button className="gap-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              {t('عرض الكل', 'View All')}
              <Arrow className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {loadingNews ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/80 mb-6">{t('لا توجد أخبار منشورة حالياً', 'No published news yet')}</p>
            <Link to="/news">
              <Button className="rounded-full bg-white text-aviation-navy hover:bg-white/90">
                {t('اذهب للأخبار', 'Go to News')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Featured News - Large Card */}
            {featuredNews && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Link to={`/news/${featuredNews.slug || featuredNews.id}`}>
                  <div className="group relative rounded-2xl overflow-hidden h-full min-h-[400px]">
                    <img
                      src={featuredNews.imageUrl}
                      alt={t(featuredNews.titleAr, featuredNews.titleEn)}
                      className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-right">
                      <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium mb-3">
                        {featuredNews.category || t('أخبار', 'News')}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                        {t(featuredNews.titleAr, featuredNews.titleEn)}
                      </h3>
                      <div className="flex items-center justify-end gap-2 text-white/70 text-sm">
                        <span>{formatDate(featuredNews.date)}</span>
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Other News - Stacked Cards */}
            <div className="space-y-4">
              {otherNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Link to={`/news/${item.slug || item.id}`}>
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden flex gap-4 p-3 hover:bg-white/20 transition-colors">
                      <div className="w-28 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={t(item.titleAr, item.titleEn)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 text-right py-1">
                        <div className="flex items-center justify-end gap-2 text-white/60 text-xs mb-2">
                          <span>{formatDate(item.date)}</span>
                          <Calendar className="w-3 h-3" />
                        </div>
                        <h4 className="font-bold text-white group-hover:text-secondary transition-colors line-clamp-2 text-sm md:text-base">
                          {t(item.titleAr, item.titleEn)}
                        </h4>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
          <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

const PackagesSection = () => {
  const { t, direction } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });

  const openForm = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsFormOpen(true);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packagesQuery = query(collection(db, 'packages'), limit(12));
        const snapshot = await getDocs(packagesQuery);
        const fetchedPackages = snapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as any) } as Package & { published?: boolean }))
          .filter((item) => item.published !== false)
          .filter((item) => item.active !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .slice(0, 6);

        console.log('[Home] Packages fetched:', fetchedPackages.length, fetchedPackages);
        setPackages(fetchedPackages);
      } catch (error: any) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  if (loadingPackages) {
    return (
      <section data-reveal className="section-padding bg-background">
        <div className="container mx-auto container-padding flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <>
    <section id="packages" ref={ref} data-reveal className="scroll-mt-28 py-20 md:py-28 bg-gradient-to-b from-background via-secondary/5 to-background relative overflow-hidden is-visible">
      {/* Animated geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <motion.div
          className="absolute w-96 h-96 rounded-full border border-primary/10"
          style={{ top: '-10%', right: '-5%' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-secondary/10"
          style={{ bottom: '10%', left: '-5%' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Glowing orbs */}
        <motion.div
          className="absolute w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          style={{ top: '20%', left: '10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-secondary/5 rounded-full blur-3xl"
          style={{ bottom: '15%', right: '10%' }}
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="packagesGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#packagesGrid)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated badge */}
          <motion.div
            className="inline-flex items-center gap-3 bg-card/60 text-foreground px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-border/60 backdrop-blur-sm dark:bg-card/40 dark:border-border/70"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>{t('برامجنا التدريبية', 'Our Training Programs')}</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✈️
            </motion.div>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              {t('برامجنا', 'Our Programs')}
            </span>
          </motion.h2>

          <motion.p
            className="text-muted-foreground text-lg max-w-2xl mx-auto dark:text-foreground/70"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t(
              'اختر البرنامج التدريبي المناسب لك وابدأ رحلتك نحو عالم الطيران',
              'Choose the training program that suits you and start your journey into the world of aviation'
            )}
          </motion.p>
        </motion.div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-8 text-center text-muted-foreground">
            {t('لا توجد باقات منشورة حالياً', 'No packages published yet')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <PackageCard key={pkg.id} pkg={pkg} index={index} onRegister={openForm} />
            ))}
          </div>
        )}

        {/* View All Button */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/packages">
            <motion.button
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{t('عرض جميع الباقات', 'View All Packages')}</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Arrow className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
    <QuickRegistrationDialog
      selectedPackage={selectedPackage}
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
    />
    </>
  );
};

// Activities Section
const ActivitiesSection = () => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Avoid composite-index requirement by ordering only, then filtering client-side
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('date', 'desc'),
          limit(12)
        );
        const snapshot = await getDocs(activitiesQuery);
        const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Treat missing `published` as published (same behavior as News)
        const published = all.filter((a: any) => a.published !== false);
        setActivities(published.slice(0, 4));
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section ref={ref} data-reveal className="section-padding relative overflow-hidden bg-gradient-to-b from-muted/50 via-muted/30 to-background is-visible">
      {/* Animated Wave Top */}
      <div className="absolute top-0 inset-x-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-20 md:h-24" preserveAspectRatio="none">
          <motion.path
            d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 V0 H0 Z"
            fill="hsl(var(--background))"
            animate={{
              d: [
                "M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 V0 H0 Z",
                "M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 V0 H0 Z",
                "M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 V0 H0 Z"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Floating circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          style={{ top: '10%', right: '10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          style={{ bottom: '20%', left: '5%' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Animated plane pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-aviation-navy"
            style={{ top: `${10 + Math.random() * 80}%`, left: `${Math.random() * 100}%` }}
            animate={{ x: [0, 30, 0], y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          >
            <svg width="32" height="20" viewBox="0 0 40 24" fill="currentColor">
              <path d="M38.5 12L30 4.5V9.5L10 9.5L0 12L10 14.5L30 14.5V19.5L38.5 12Z" />
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto container-padding relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Animated badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✈
            </motion.span>
            <span>{t('أنشطتنا', 'Our Activities')}</span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('أحدث الأنشطة', 'Latest Activities')}
          </h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('شاهد أحدث الأنشطة التي نظمها / شارك فيها أجنحة الطيران', 'See the latest activities organized / participated in by Flight Wings')}
          </motion.p>
        </motion.div>

        {loadingActivities ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              {t('لا توجد أنشطة منشورة حالياً', 'No published activities yet')}
            </p>
            <Link to="/activities">
              <Button variant="outline" size="lg" className="gap-2">
                {t('مشاهدة كل الأنشطة', 'View All Activities')}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity, index) => (
              <Link key={activity.id} to={`/activities/${activity.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {activity.images?.[0] ? (
                      <motion.img
                        src={activity.images[0]}
                        alt={t(activity.titleAr, activity.titleEn)}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <motion.div 
                      className="absolute top-3 end-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {formatDate(activity.date)}
                    </motion.div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {t(activity.titleAr, activity.titleEn)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>{t('قراءة المزيد', 'Read More')}</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Arrow className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loadingActivities && activities.length > 0 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/activities">
              <Button variant="outline" size="lg" className="gap-2 group px-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                {t('مشاهدة المزيد', 'View More')}
                <motion.div
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <Arrow className="w-4 h-4" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Animated Wave Bottom */}
      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-20 md:h-24" preserveAspectRatio="none">
          <motion.path
            d="M0,60 C360,100 720,20 1080,60 C1260,80 1350,40 1440,60 V120 H0 Z"
            fill="hsl(var(--background))"
            animate={{
              d: [
                "M0,60 C360,100 720,20 1080,60 C1260,80 1350,40 1440,60 V120 H0 Z",
                "M0,60 C360,20 720,100 1080,60 C1260,40 1350,80 1440,60 V120 H0 Z",
                "M0,60 C360,100 720,20 1080,60 C1260,80 1350,40 1440,60 V120 H0 Z"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section data-reveal className="section-padding bg-gradient-hero relative overflow-hidden">
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto container-padding relative text-center">
        <motion.h2
          className="text-3xl md:text-5xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('ابدأ رحلتك نحو السماء اليوم', 'Start Your Journey to the Sky Today')}
        </motion.h2>
        <motion.p
          className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t(
            'انضم إلى آلاف الخريجين الناجحين وحقق حلمك في أن تصبح طياراً محترفاً',
            'Join thousands of successful graduates and achieve your dream of becoming a professional pilot'
          )}
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/packages">
            <Button size="lg" className="h-14 px-8 text-lg rounded-2xl gap-3 bg-white text-primary hover:bg-white/90">
              {t('سجل الآن', 'Register Now')}
              <Arrow className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl border-white/30 text-white hover:bg-white/10">
              {t('تواصل معنا', 'Contact Us')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Main Component
const Index = () => {
  const { t } = useLanguage();
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [sectionVisibility, setSectionVisibility] = useState({
    showActivitiesSection: true,
    showGraduatesSection: true,
    showPartnersSection: true,
    showTrainingProgramsSection: true,
  });

  // Safety timeout to avoid getting stuck on loading in case Firestore hangs
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timeout);
  }, []);

  // Fetch section visibility settings
  useEffect(() => {
    const fetchVisibilitySettings = async () => {
      try {
        const data = await cachedDoc('site_settings', 'general');
        if (data) {
          setSectionVisibility({
            showActivitiesSection: data.showActivitiesSection !== false,
            showGraduatesSection: data.showGraduatesSection !== false,
            showPartnersSection: data.showPartnersSection !== false,
            showTrainingProgramsSection: data.showTrainingProgramsSection !== false,
          });
        }

      } catch (error) {
        console.error('Error fetching section visibility:', error);
      }
    };
    fetchVisibilitySettings();
  }, []);

  // UI safety net:
  // 1) Enable CSS scroll-reveal system
  // 2) If framer-motion ever leaves elements stuck at opacity:0, force them visible after a short delay
  useEffect(() => {
    document.body.classList.add('reveal-ready');

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const supportsIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;

    let observer: IntersectionObserver | null = null;
    if (supportsIO) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              el.classList.add('is-visible');
              observer?.unobserve(el);
            }
          });
        },
        { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
      );
      els.forEach((el) => observer!.observe(el));
    } else {
      // If IO isn't supported, don't hide anything.
      els.forEach((el) => el.classList.add('is-visible'));
    }

    const force = window.setTimeout(() => {
      document.body.classList.add('force-visible');
      // Also ensure any still-hidden reveal blocks become visible.
      els.forEach((el) => el.classList.add('is-visible'));
    }, 1200);

    return () => {
      window.clearTimeout(force);
      observer?.disconnect();
      document.body.classList.remove('reveal-ready');
      document.body.classList.remove('force-visible');
    };
  }, []);

  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setContentError(null);
        const data = await cachedDoc('settings', 'pages');
        if (data) {
          setContent({
            home: { ...defaultContent.home, ...data.home },
            homeAbout: { ...defaultContent.homeAbout, ...data.homeAbout },
            stats: { ...defaultContent.stats, ...data.stats },
            features: { ...defaultContent.features, ...data.features },
          });
        }

      } catch (error: any) {
        console.error('Error fetching page content:', error);
        setContentError(error?.message || String(error));
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  // Always render the page; show a lightweight overlay while content loads
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <PageContentContext.Provider value={content}>
      <Layout>
      <PageSeo
        pageKey="home"
        path="/"
        defaultTitleAr={'أجنحة الطيران — أكاديمية تدريب الطيران'}
        defaultTitleEn={'Fly Wings — Aviation Training Academy'}
        defaultDescriptionAr={'أكاديمية أجنحة الطيران لتدريب الطيارين: باقات تدريب معتمدة، مراحل تدريب متكاملة، وفريق مدربين محترفين.'}
        defaultDescriptionEn={'Fly Wings Academy: accredited pilot training packages, complete training stages and professional instructors.'}
      />

        {loading && <LoadingOverlay />}
        {contentError && (
          <div className="fixed z-[70] top-24 start-4 end-4 sm:start-auto sm:end-6 sm:w-[520px] rounded-2xl border bg-card/95 backdrop-blur p-4 shadow-soft">
            <p className="font-medium text-destructive">{t('خطأ في تحميل محتوى الصفحة', 'Failed to load page content')}</p>
            <p className="mt-1 text-sm text-muted-foreground break-words">{contentError}</p>
          </div>
        )}
        <HeroSection />
        <AboutPreviewSection />
        <FeaturesSection />
        <DeferredSection><TrainingStages /></DeferredSection>
        {sectionVisibility.showGraduatesSection && <DeferredSection><GraduatesSection /></DeferredSection>}
        <DeferredSection><NewsSection /></DeferredSection>
        <DeferredSection><PackagesSection /></DeferredSection>
        {sectionVisibility.showActivitiesSection && <DeferredSection><ActivitiesSection /></DeferredSection>}
        {sectionVisibility.showPartnersSection && <DeferredSection minHeight={220}><PartnersSection /></DeferredSection>}
      </Layout>
    </PageContentContext.Provider>
  );
};

export default Index;
