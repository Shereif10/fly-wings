import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { GraduationCap, Users, Globe2, Calendar, Trophy, Handshake, Building2, Eye, Send, ListChecks, Target, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cachedDoc } from '@/lib/firestoreCache';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logoImg from '@/assets/fly-wings-logo-color.png';
import { useHeroImage } from '@/hooks/useHeroImage';
import { ensureHtml } from '@/lib/content';
import PageSeo from '@/components/seo/PageSeo';

interface Goal {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
}

interface CustomSection {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  bgColor: 'default' | 'muted' | 'primary';
  order: number;
}

interface JourneyMilestone {
  id: string;
  year: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
}

interface AboutContent {
  mainTitleAr: string;
  mainTitleEn: string;
  paragraph1Ar: string;
  paragraph1En: string;
  paragraph2Ar: string;
  paragraph2En: string;
  paragraph3Ar: string;
  paragraph3En: string;
  paragraph4Ar: string;
  paragraph4En: string;
  aboutInfoTitleAr: string;
  aboutInfoTitleEn: string;
  aboutInfoAr: string;
  aboutInfoEn: string;
  visionTitleAr: string;
  visionTitleEn: string;
  visionAr: string;
  visionEn: string;
  missionTitleAr: string;
  missionTitleEn: string;
  missionAr: string;
  missionEn: string;
  messageTitleAr: string;
  messageTitleEn: string;
  messageAr: string;
  messageEn: string;
  valuesSectionTitleAr: string;
  valuesSectionTitleEn: string;
  goalsSectionTitleAr: string;
  goalsSectionTitleEn: string;
  goalsSectionSubtitleAr: string;
  goalsSectionSubtitleEn: string;
  ctaTitleAr: string;
  ctaTitleEn: string;
  ctaDescriptionAr: string;
  ctaDescriptionEn: string;
  goals: Goal[];
  customSections: CustomSection[];
  imageUrl: string;
  planeImageUrl: string;
}

const defaultContent: AboutContent = {
  mainTitleAr: 'تعرف علينا',
  mainTitleEn: 'About Us',
  paragraph1Ar: 'أجنحة الطيران: شركة سعودية رائدة في تدريب الطيران، تأسست عام 2019م، وتشرف على مسارات تدريبية في أكثر من 100 مركز تدريب طيران حول العالم، بشراكات دولية وحضور استراتيجي يخدم رؤية المملكة 2030.',
  paragraph1En: 'Fly Wings: a leading Saudi aviation training company founded in 2019, overseeing training pathways in more than 100 aviation training centers around the world, with international partnerships and a strategic presence serving Saudi Vision 2030.',
  paragraph2Ar: '',
  paragraph2En: '',
  paragraph3Ar: '',
  paragraph3En: '',
  paragraph4Ar: '',
  paragraph4En: '',
  aboutInfoTitleAr: 'ما هي أجنحة الطيران؟',
  aboutInfoTitleEn: 'What is Fly Wings?',
  aboutInfoAr: 'أجنحة الطيران هي شركة سعودية أسست بهدف توفير حلول لتدريب الطيران بأقل التكاليف داخل السعودية وخارجها، عن طريق الإشراف والمتابعة الحثيثة مع أكثر من 100 مركز تدريب طيران حول العالم، ليصبح مجال دراسة الطيران في متناول كل محب وهاوٍ، لا سيما أن هذا المجال بدأ بالتنامي في السعودية بوتيرة متسارعة انطلاقاً من رؤية 2030، ولنساهم بذلك في أن يكون أبناؤنا وبناتنا الطيارون السعوديون هم المستفيد الأول من نمو سوق الطيران في المملكة.',
  aboutInfoEn: 'Fly Wings is a Saudi company founded to provide aviation training solutions at the lowest costs inside and outside Saudi Arabia, through supervision and close follow-up with more than 100 aviation training centers around the world, making the field of aviation studies accessible to every enthusiast and hobbyist, especially as this field is growing rapidly in Saudi Arabia under Vision 2030, contributing to making our sons and daughters, Saudi pilots, the first beneficiaries of the growth of the aviation market in the Kingdom.',
  visionTitleAr: 'الرؤية',
  visionTitleEn: 'Vision',
  visionAr: 'أن نكون الخيار الأول والرائد في تدريب الطيران بالمملكة العربية السعودية.',
  visionEn: 'To be the first choice and leader in aviation training in Saudi Arabia.',
  missionTitleAr: 'المهام',
  missionTitleEn: 'Tasks',
  missionAr: 'تقديم برامج تدريب طيران عالية الجودة.',
  missionEn: 'Providing high-quality aviation training programs.',
  messageTitleAr: 'الرسالة',
  messageTitleEn: 'Message',
  messageAr: 'تسعى أجنحة الطيران إلى تبادل المعرفة العلمية المتعلقة بالطيران.',
  messageEn: 'Fly Wings seeks to share scientific knowledge related to aviation.',
  valuesSectionTitleAr: 'رؤيتنا، رسالتنا، ومهامنا',
  valuesSectionTitleEn: 'Our Vision, Message, and Tasks',
  goalsSectionTitleAr: 'كيف نحقق أهدافنا؟',
  goalsSectionTitleEn: 'How Do We Achieve Our Goals?',
  goalsSectionSubtitleAr: '',
  goalsSectionSubtitleEn: '',
  ctaTitleAr: 'معاً نحو مستقبل الطيران السعودي',
  ctaTitleEn: 'Together Toward the Future of Saudi Aviation',
  ctaDescriptionAr: 'من التأسيس في 2019م إلى رؤية 2030 — أجنحة الطيران شريكك في بناء مسارك المهني نحو قمرة القيادة.',
  ctaDescriptionEn: 'From the foundation in 2019 to Vision 2030 — Fly Wings is your partner in building your career path toward the cockpit.',
  goals: [
    { id: '1', titleAr: 'توفير', titleEn: 'Providing', descriptionAr: 'التدريب الشامل في قطاع الطيران والعلوم المرتبطة به.', descriptionEn: 'Comprehensive training in the aviation sector and related sciences.', icon: 'GraduationCap' },
    { id: '2', titleAr: 'رعاية', titleEn: 'Nurturing', descriptionAr: 'وتنمية المواهب في مجال الطيران.', descriptionEn: 'Developing talents in the aviation field.', icon: 'Users' },
    { id: '3', titleAr: 'التعاون', titleEn: 'Collaboration', descriptionAr: 'مع المؤسسات التعليمية والفنية المتخصصة.', descriptionEn: 'With specialized educational and technical institutions.', icon: 'Building2' },
    { id: '4', titleAr: 'تعزيز', titleEn: 'Enhancing', descriptionAr: 'المشاركة لتمثيل المملكة دولياً.', descriptionEn: 'Participation to represent the Kingdom internationally.', icon: 'Globe2' },
    { id: '5', titleAr: 'إقامة', titleEn: 'Establishing', descriptionAr: 'شراكات استراتيجية مع شركات الطيران.', descriptionEn: 'Strategic partnerships with aviation companies.', icon: 'Handshake' },
  ],
  customSections: [],
  imageUrl: '',
  planeImageUrl: '',
};

const defaultValues = [
  {
    id: 'vision',
    titleAr: 'الرؤية',
    titleEn: 'Vision',
    descriptionAr: 'أن نكون الخيار الأول والرائد في تدريب الطيران بالمملكة العربية السعودية.',
    descriptionEn: 'To be the first choice and leader in aviation training in Saudi Arabia.',
    icon: 'Eye',
  },
  {
    id: 'message',
    titleAr: 'الرسالة',
    titleEn: 'Message',
    descriptionAr: 'تسعى أجنحة الطيران إلى تبادل المعرفة العلمية المتعلقة بالطيران.',
    descriptionEn: 'Fly Wings seeks to share scientific knowledge related to aviation.',
    icon: 'Send',
  },
  {
    id: 'mission',
    titleAr: 'المهام',
    titleEn: 'Tasks',
    descriptionAr: 'تقديم برامج تدريب طيران عالية الجودة.',
    descriptionEn: 'Providing high-quality aviation training programs.',
    icon: 'ListChecks',
  },
  {
    id: 'goals',
    titleAr: 'الأهداف',
    titleEn: 'Goals',
    descriptionAr: 'هدفنا هو تنمية شغف الطيران في السماء إلى الأفضل.',
    descriptionEn: 'Our goal is to develop the passion for flying to the best.',
    icon: 'Target',
  },
];

const defaultMilestones: JourneyMilestone[] = [
  {
    id: '1',
    year: '2019',
    titleAr: 'التأسيس',
    titleEn: 'Foundation',
    descriptionAr: 'تأسيس أجنحة الطيران كشركة رائدة في مجال تدريب الطيران داخل وخارج المملكة العربية السعودية.',
    descriptionEn: 'Establishing Fly Wings as a leading company in aviation training inside and outside the Kingdom of Saudi Arabia.',
    order: 1,
  },
  {
    id: '2',
    year: '2019',
    titleAr: 'التوسع',
    titleEn: 'Expansion',
    descriptionAr: 'ضمن خططنا الاستراتيجية للتوسع، نفتخر بوجود فرع لأكاديمية أجنحة الطيران في جمهورية جنوب أفريقيا، لتقديم التدريب العملي على الطيران وفق معايير معتمدة وبيئة تدريب احترافية تمكن طلابنا من اكتساب الخبرة العملية بكفاءة عالية. يأتي هذا التوسع دعماً لرسالتنا في توفير مسارات تدريب عالمية، تجمع بين الجودة، الاعتماد، وسلاسة الانتقال من الدراسة إلى قمرة القيادة.',
    descriptionEn: 'As part of our strategic expansion plans, we are proud to have a branch of Fly Wings Academy in the Republic of South Africa, providing practical flight training according to accredited standards and a professional training environment that enables our students to gain practical experience with high efficiency. This expansion supports our mission of providing global training pathways that combine quality, accreditation, and a smooth transition from study to the cockpit.',
    order: 2,
  },
  {
    id: '3',
    year: '2019',
    titleAr: 'الاعتماد الدولي',
    titleEn: 'International Accreditation',
    descriptionAr: 'الدخول كشركاء في ثلاث أكاديميات طيران في الولايات المتحدة الأمريكية.',
    descriptionEn: 'Entering as partners in three aviation academies in the United States of America.',
    order: 3,
  },
  {
    id: '4',
    year: '2030',
    titleAr: 'رؤية 2030',
    titleEn: 'Vision 2030',
    descriptionAr: 'المساهمة في تحقيق رؤية المملكة 2030 بتأهيل كوادر سعودية في مجال الطيران.',
    descriptionEn: 'Contributing to achieving Saudi Vision 2030 by qualifying Saudi talents in aviation.',
    order: 4,
  },
];

const journeySection = {
  titleAr: 'انطلاقة الأكاديمية',
  titleEn: 'Academy Launch',
  subtitleAr: 'شاهد رحلة التحول منذ الانطلاقة 2019م وحتى اليوم',
  subtitleEn: 'Watch our transformation journey from 2019 to today',
};

const defaultPlaneImage = "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1974";

const iconMap: { [key: string]: any } = {
  GraduationCap, Users, Building2, Calendar, Trophy, Globe2, Handshake, Eye, Send, ListChecks, Target,
};

const About = () => {
  const { t, direction } = useLanguage();
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [planeImageUrl, setPlaneImageUrl] = useState(defaultPlaneImage);
  const [milestones, setMilestones] = useState<JourneyMilestone[]>(defaultMilestones);
  const [loading, setLoading] = useState(true);
  const heroImage = useHeroImage('About');
  const visionImage = useHeroImage('Vision');
  const goalsRef = useRef(null);
  const isGoalsInView = useInView(goalsRef, { once: true, margin: "-100px" });
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [pages, settings] = await Promise.all([
          cachedDoc('settings', 'pages'),
          cachedDoc('site_settings', 'general'),
        ]);
        if (!active) return;

        if (pages?.aboutPage) {
          const firebaseData = pages.aboutPage;
          setContent({
            ...defaultContent,
            ...firebaseData,
            goals:
              firebaseData.goals && firebaseData.goals.length > 0
                ? firebaseData.goals
                : defaultContent.goals,
          });
        }
        if (settings?.planeImageUrl) setPlaneImageUrl(settings.planeImageUrl);
      } catch (error) {
        console.error('Error fetching about content:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Journey milestones share the same Firestore source as the /about/journey page
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const q = query(collection(db, 'journey_milestones'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JourneyMilestone));
          setMilestones(fetched);
        }
      } catch (error) {
        console.error('Error fetching journey data:', error);
      }
    };
    fetchMilestones();
  }, []);

  // Always render content - use defaults if still loading after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <Layout>
      <PageSeo
        pageKey="about"
        path="/about"
        defaultTitleAr={'من نحن — أجنحة الطيران'}
        defaultTitleEn={'About Us — Fly Wings'}
        defaultDescriptionAr={'تعرف على رؤية ورسالة أكاديمية أجنحة الطيران وأهدافها في تدريب الطيارين.'}
        defaultDescriptionEn={'Learn about Fly Wings Academy vision, mission and goals in pilot training.'}
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
            <span className="text-foreground font-medium">{t('تعرف علينا', 'About Us')}</span>
          </div>
        </div>
      </div>

      {/* Hero Section - Diagonal from LEFT like reference */}
      <section className="relative bg-background overflow-hidden">
        {/* Diagonal Shape from LEFT side - exactly like SAC reference */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Navy diagonal shape */}
          <div
            className="absolute inset-y-0 left-0 w-[60%] md:w-[50%] lg:w-[45%] bg-aviation-navy"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
            }}
          >
            <img
              src={content.imageUrl || heroImage}
              alt="Aviation"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-aviation-navy/80 to-aviation-navy/50" />
          </div>
        </div>

        {/* Content on the RIGHT side */}
        <div className="relative container mx-auto px-4 py-12 md:py-20 min-h-[50vh] md:min-h-[55vh]">
          <div className="max-w-xl md:max-w-2xl mr-0 ml-auto text-right pl-4 md:pl-0">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo */}
              <div className="flex justify-end">
                <img src={logoImg} alt="Fly Wings" className="h-32 w-auto" loading="lazy" />
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t(content.mainTitleAr, content.mainTitleEn)}
              </h1>

              {/* Paragraphs */}
              <div className="space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                <p>{t(content.paragraph1Ar, content.paragraph1En)}</p>
                <p>{t(content.paragraph2Ar, content.paragraph2En)}</p>
                <p>{t(content.paragraph3Ar, content.paragraph3En)}</p>
                <p>{t(content.paragraph4Ar, content.paragraph4En)}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Wave Separator - matching SAC style */}
      <div className="bg-background relative">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[50px] md:h-[80px] block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40 Q 360 80 720 40 T 1440 40 L 1440 80 L 0 80 Z"
            fill="hsl(var(--aviation-navy))"
          />
        </svg>
      </div>

      {/* What is Fly Wings Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mr-0 ml-auto text-right">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t(content.aboutInfoTitleAr, content.aboutInfoTitleEn)}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(content.aboutInfoAr, content.aboutInfoEn)}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Academy Launch Timeline */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t(journeySection.titleAr, journeySection.titleEn)}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t(journeySection.subtitleAr, journeySection.subtitleEn)}
            </p>
            {/* Decorative dots */}
            <div className="flex items-center justify-center mt-5 gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full bg-aviation-teal ${i === 2 ? 'w-8' : 'w-2'}`} />
              ))}
            </div>
          </motion.div>

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

      {/* Vision, Message & Tasks */}
      <section className="relative bg-aviation-navy py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={visionImage}
            alt="Background"
            className="w-full h-full object-cover opacity-10"
            loading="lazy"
          />
        </div>

        <div className="relative container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t(content.valuesSectionTitleAr, content.valuesSectionTitleEn)}
            </h2>
            {/* Decorative dots */}
            <div className="flex items-center justify-center mt-5 gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full bg-aviation-teal ${i === 2 ? 'w-8' : 'w-2'}`} />
              ))}
            </div>
          </motion.div>

          {/* Values Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {defaultValues.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Target;
              return (
                <motion.div
                  key={value.id}
                  className="group bg-card rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aviation-teal to-primary flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {t(value.titleAr, value.titleEn)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(value.descriptionAr, value.descriptionEn)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section ref={goalsRef} className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isGoalsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t(content.goalsSectionTitleAr, content.goalsSectionTitleEn)}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t(content.goalsSectionSubtitleAr, content.goalsSectionSubtitleEn)}
            </p>
            {/* Decorative dots */}
            <div className="flex items-center justify-center mt-5 gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full bg-aviation-teal ${i === 2 ? 'w-8' : 'w-2'}`} />
              ))}
            </div>
          </motion.div>

          {/* Goals Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {content.goals.map((goal, index) => {
              const IconComponent = iconMap[goal.icon] || GraduationCap;
              return (
                <motion.div
                  key={goal.id}
                  className="group bg-card rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isGoalsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aviation-teal to-primary flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {t(goal.titleAr, goal.titleEn)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(goal.descriptionAr, goal.descriptionEn)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Custom Sections - Dynamic from Admin */}
      {(content.customSections || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section, index) => {
          const bgClasses = {
            default: 'bg-background',
            muted: 'bg-muted/30',
            primary: 'bg-aviation-navy text-white',
          };
          const textClasses = {
            default: 'text-white',
            muted: 'text-white',
            primary: 'text-white',
          };
          const descClasses = {
            default: 'text-muted-foreground',
            muted: 'text-muted-foreground',
            primary: 'text-white/80',
          };

          return (
            <section
              key={section.id}
              className={`py-16 md:py-20 ${bgClasses[section.bgColor] || bgClasses.default}`}
            >
              <div className="container mx-auto px-4">
                <div className={`max-w-3xl ${index % 2 === 0 ? 'mr-0 ml-auto text-right' : 'ml-0 mr-auto text-right md:text-left'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                  >
                    <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textClasses[section.bgColor] || textClasses.default}`}>
                      {t(section.titleAr, section.titleEn)}
                    </h2>
                    <div
                      className={`article-content prose prose-lg max-w-none dark:prose-invert text-lg leading-relaxed ${descClasses[section.bgColor] || descClasses.default}`}
                      dangerouslySetInnerHTML={{ __html: ensureHtml(t(section.contentAr, section.contentEn)) }}
                    />
                  </motion.div>
                </div>
              </div>
            </section>
          );
        })}

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
                scale: [
                  null,
                  0.8 + Math.random() * 0.4,
                  0.5 + Math.random() * 0.5,
                ],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
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
            {t(content.ctaTitleAr, content.ctaTitleEn)}
          </motion.h2>
          <motion.p
            className="text-lg text-white/80 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {t(content.ctaDescriptionAr, content.ctaDescriptionEn)}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
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
    </Layout>
  );
};

export default About;
