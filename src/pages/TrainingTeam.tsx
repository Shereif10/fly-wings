import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import logoImg from '@/assets/fly-wings-logo-color.png';
import { useHeroImage } from '@/hooks/useHeroImage';
import { Button } from '@/components/ui/button';
import PageSeo from '@/components/seo/PageSeo';

interface TeamMember {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string;
  bioEn: string;
  qualificationsAr: string[];
  qualificationsEn: string[];
  imageUrl: string;
  order: number;
}

const defaultTeam: TeamMember[] = [
  {
    id: '1',
    nameAr: 'فهد القحطاني',
    nameEn: 'Fahd Al-Qahtani',
    positionAr: 'فريق التدريب',
    positionEn: 'Training Team',
    bioAr: 'مدرب في مطار الثمامة (OETH)',
    bioEn: 'Instructor at Thumamah Airport (OETH)',
    qualificationsAr: ['GACA طيار تجاري (CPL)', 'مدرب طيران معتمد (CFI) / MEI / CFII'],
    qualificationsEn: ['GACA Commercial Pilot (CPL)', 'Certified Flight Instructor (CFI) / MEI / CFII'],
    imageUrl: '',
    order: 1,
  },
  {
    id: '2',
    nameAr: 'عبدالله العمران',
    nameEn: 'Abdullah Al-Omran',
    positionAr: 'فريق التدريب',
    positionEn: 'Training Team',
    bioAr: 'مدرب طيران متخصص في التدريب الأساسي والمتقدم.',
    bioEn: 'Flight instructor specialized in basic and advanced training.',
    qualificationsAr: ['طيار تجاري معتمد', 'مدرب طيران معتمد'],
    qualificationsEn: ['Certified Commercial Pilot', 'Certified Flight Instructor'],
    imageUrl: '',
    order: 2,
  },
  {
    id: '3',
    nameAr: 'عبدالله السقاف',
    nameEn: 'Abdullah Al-Saqqaf',
    positionAr: 'فريق التدريب',
    positionEn: 'Training Team',
    bioAr: 'خبرة واسعة في تدريب الطيارين الجدد.',
    bioEn: 'Extensive experience in training new pilots.',
    qualificationsAr: ['طيار تجاري معتمد', 'مدرب طيران معتمد'],
    qualificationsEn: ['Certified Commercial Pilot', 'Certified Flight Instructor'],
    imageUrl: '',
    order: 3,
  },
];

const TrainingTeam = () => {
  const { t, language } = useLanguage();
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const heroImage = useHeroImage('TrainingTeam');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const q = query(collection(db, 'training_team'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
          setTeam(fetched);
        }
      } catch (error) {
        console.error('Error fetching training team:', error);
      }
      setLoading(false);
    };
    fetchTeam();
  }, []);

  return (
    <Layout>
      <PageSeo
        pageKey="training-team"
        path="/training-team"
        defaultTitleAr={'فريق التدريب — أجنحة الطيران'}
        defaultTitleEn={'Training Team — Fly Wings'}
        defaultDescriptionAr={'تعرف على مدربي أكاديمية أجنحة الطيران وخبراتهم ومؤهلاتهم.'}
        defaultDescriptionEn={'Meet the Fly Wings Academy instructors, their experience and qualifications.'}
      />

      {/* Paper Airplane Header Strip */}
      <div className="bg-muted/50 py-2 overflow-hidden">
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
            <span className="text-foreground font-medium">{t('فريق التدريب', 'Training Team')}</span>
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
                <img src={logoImg} alt="Fly Wings" className="h-16 w-auto" loading="lazy" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-aviation-navy leading-tight">
                {t('فريق التدريب', 'Training Team')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('نخبة من الطيارين وخبراء الطيران لإثراء وتنمية مهارات الطيارين', 'Elite pilots and aviation experts to enrich and develop pilot skills')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                className="bg-card rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Image Section */}
                <div className="relative h-48 bg-aviation-navy/10">
                  {/* Decorative plane */}
                  <div className="absolute top-4 left-4">
                    <svg
                      viewBox="0 0 100 60"
                      className="w-24 h-16 text-aviation-navy/20"
                      fill="currentColor"
                    >
                      <polygon points="0,30 100,0 60,30 100,60" />
                    </svg>
                  </div>
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={t(member.nameAr, member.nameEn)}
                      className="absolute bottom-0 right-1/2 translate-x-1/2 w-32 h-40 object-cover object-top"
                    />
                  ) : (
                    <div className="absolute bottom-4 right-1/2 translate-x-1/2 w-24 h-32 rounded-xl bg-muted flex items-center justify-center">
                      <span className="text-4xl text-muted-foreground">👨‍✈️</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                  <p className="text-sm text-primary mb-2">{t(member.positionAr, member.positionEn)}</p>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {t(member.nameAr, member.nameEn)}
                  </h3>
                  <Button
                    onClick={() => setSelectedMember(member)}
                    className="w-full bg-aviation-teal hover:bg-aviation-teal/90 text-white"
                  >
                    {t('المزيد من المعلومات', 'More Information')} ↗
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl mt-20"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Header with image */}
                <div className="h-56 bg-aviation-navy/10 relative">
                  {selectedMember.imageUrl ? (
                    <img
                      src={selectedMember.imageUrl}
                      alt={t(selectedMember.nameAr, selectedMember.nameEn)}
                      className="absolute bottom-0 right-1/2 translate-x-1/2 w-36 h-44 object-cover object-top rounded-t-xl"
                    />
                  ) : (
                    <div className="absolute bottom-4 right-1/2 translate-x-1/2 w-32 h-40 rounded-xl bg-muted flex items-center justify-center">
                      <span className="text-5xl text-muted-foreground">👨‍✈️</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 text-right">
                  <p className="text-sm text-primary mb-2">{t(selectedMember.positionAr, selectedMember.positionEn)}</p>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {t(selectedMember.nameAr, selectedMember.nameEn)}
                  </h3>
                  <div className="w-16 h-0.5 bg-aviation-teal ml-auto mb-4" />
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t(selectedMember.bioAr, selectedMember.bioEn)}
                  </p>

                  {/* Qualifications */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('المؤهلات', 'Qualifications')}</h4>
                    <ul className="space-y-1">
                      {(language === 'ar' ? selectedMember.qualificationsAr : selectedMember.qualificationsEn).map((qual, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2 justify-end">
                          <span>{qual}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-aviation-teal" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default TrainingTeam;
