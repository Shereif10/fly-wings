import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logoSvg from '@/assets/fly-wings-logo-color.png';
import { useHeroImage } from '@/hooks/useHeroImage';
import PageSeo from '@/components/seo/PageSeo';

interface JourneyMilestone {
  id: string;
  year: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
}

interface JourneySettings {
  pageTitleAr: string;
  pageTitleEn: string;
  pageSubtitleAr: string;
  pageSubtitleEn: string;
}

const defaultSettings: JourneySettings = {
  pageTitleAr: 'انطلاقة الأكاديمية',
  pageTitleEn: 'Academy Launch',
  pageSubtitleAr: 'شاهد رحلة التحول منذ الانطلاقة 2000م وحتى اليوم',
  pageSubtitleEn: 'Watch our transformation journey from 2000 to today',
};

const defaultMilestones: JourneyMilestone[] = [
  {
    id: '1',
    year: '2000',
    titleAr: 'التأسيس',
    titleEn: 'Foundation',
    descriptionAr: 'تأسيس أجنحة الطيران كشركة رائدة في التدريب على الطيران في المملكة العربية السعودية.',
    descriptionEn: 'Fly Wings was established as a leading aviation training company in Saudi Arabia.',
    order: 1,
  },
  {
    id: '2',
    year: '2010',
    titleAr: 'التوسع',
    titleEn: 'Expansion',
    descriptionAr: 'توسيع نطاق الخدمات والبرامج التدريبية لتشمل مختلف مجالات الطيران.',
    descriptionEn: 'Expanding services and training programs to cover various aviation fields.',
    order: 2,
  },
  {
    id: '3',
    year: '2015',
    titleAr: 'الاعتماد الدولي',
    titleEn: 'International Accreditation',
    descriptionAr: 'الحصول على الاعتمادات الدولية من هيئات الطيران العالمية.',
    descriptionEn: 'Obtaining international accreditations from global aviation authorities.',
    order: 3,
  },
  {
    id: '4',
    year: '2020',
    titleAr: 'رؤية 2030',
    titleEn: 'Vision 2030',
    descriptionAr: 'المساهمة في تحقيق رؤية المملكة 2030 بتأهيل كوادر سعودية في مجال الطيران.',
    descriptionEn: 'Contributing to achieving Saudi Vision 2030 by qualifying Saudi talents in aviation.',
    order: 4,
  },
];

const OurJourney = () => {
  const { t, language } = useLanguage();
  const [milestones, setMilestones] = useState<JourneyMilestone[]>(defaultMilestones);
  const [settings, setSettings] = useState<JourneySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const heroImage = useHeroImage('Journey');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsDoc = await getDoc(doc(db, 'site_settings', 'journey'));
        if (settingsDoc.exists()) {
          setSettings({ ...defaultSettings, ...settingsDoc.data() } as JourneySettings);
        }

        // Fetch milestones
        const q = query(collection(db, 'journey_milestones'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JourneyMilestone));
          setMilestones(fetched);
        }
      } catch (error) {
        console.error('Error fetching journey data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <PageSeo
        pageKey="journey"
        path="/our-journey"
        defaultTitleAr={'انطلاقة الأكاديمية — أجنحة الطيران'}
        defaultTitleEn={'Our Journey — Fly Wings'}
        defaultDescriptionAr={'محطات ومسيرة أكاديمية أجنحة الطيران منذ التأسيس.'}
        defaultDescriptionEn={'Milestones and the story of Fly Wings Academy since its founding.'}
      />

      {/* Paper Airplane Header Strip */}
      <div className="bg-muted/50 py-2 overflow-hidden pt-20 md:pt-24">
        <div className="flex items-center justify-center gap-3">
          {[...Array(25)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-aviation-navy/30 flex-shrink-0"
              style={{ transform: `rotate(${-30 + (i % 4) * 10}deg)` }}
            >
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-background py-3">
        <div className="container mx-auto px-4 flex justify-end">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border bg-background shadow-sm text-sm">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
              {t('الرئيسية', 'Home')}
            </a>
            <span className="text-muted-foreground">/</span>
            <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">
              {t('من نحن', 'About')}
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{t(settings.pageTitleAr, settings.pageTitleEn)}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 w-[60%] md:w-[50%] lg:w-[45%] bg-aviation-navy"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
            }}
          >
            <img
              src={heroImage}
              alt="Aviation"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-aviation-navy/80 to-aviation-navy/50" />
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-20 min-h-[40vh]">
          <div className="max-w-xl md:max-w-2xl mr-0 ml-auto text-right pl-4 md:pl-0">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-end">
                <img src={logoSvg} alt="Fly Wings" className="h-32 w-auto" loading="lazy" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t(settings.pageTitleAr, settings.pageTitleEn)}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t(settings.pageSubtitleAr, settings.pageSubtitleEn)}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                className="flex flex-col md:flex-row items-center gap-6 mb-16 last:mb-0"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Year Box */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-40 md:w-28 md:h-48 bg-aviation-navy rounded-2xl flex items-center justify-center shadow-xl">
                    <span
                      className="text-4xl md:text-5xl font-bold text-white"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                      {milestone.year}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-3 mb-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {t(milestone.titleAr, milestone.titleEn)}
                    </h3>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-6 h-6 text-aviation-teal"
                    >
                      <path
                        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl ml-auto">
                    {t(milestone.descriptionAr, milestone.descriptionEn)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OurJourney;
