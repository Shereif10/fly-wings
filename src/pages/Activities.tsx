import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/layout/Layout';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface Activity {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  images: string[];
  date: string;
  category: string;
  featured: boolean;
  published: boolean;
}

const Activities = () => {
  const { t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Avoid composite-index requirement by ordering only, then filtering client-side
        const activitiesQuery = query(collection(db, 'activities'), orderBy('date', 'desc'));
        const snapshot = await getDocs(activitiesQuery);
        const fetchedActivities = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((a: any) => a.published) as Activity[];
        setActivities(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
      setLoading(false);
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

  const featuredActivity = activities.find(a => a.featured);
  const regularActivities = activities.filter(a => !a.featured);

  return (
    <Layout>
      <PageSeo
        pageKey="activities"
        path="/activities"
        defaultTitleAr={'الأنشطة — أجنحة الطيران'}
        defaultTitleEn={'Activities — Fly Wings'}
        defaultDescriptionAr={'أنشطة وفعاليات أكاديمية أجنحة الطيران.'}
        defaultDescriptionEn={'Activities and events at Fly Wings Academy.'}
      />

      {/* Hero with Wave Pattern */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-aviation-navy">
        {/* Wave Pattern */}
        <div className="absolute inset-0">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" fill="hsl(var(--background))" />
          </svg>
        </div>

        {/* Animated plane pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 20, 0],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <svg width="40" height="24" viewBox="0 0 40 24" fill="currentColor" className="text-white">
                <path d="M38.5 12L30 4.5V9.5L10 9.5L0 12L10 14.5L30 14.5V19.5L38.5 12Z" />
              </svg>
            </motion.div>
          ))}
        </div>

        <div className="container mx-auto container-padding relative z-10 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-white/60 mb-6">
              <Link to="/" className="hover:text-white transition-colors">
                {t('الرئيسية', 'Home')}
              </Link>
              <span>{'>'}</span>
              <span className="text-white">{t('الأنشطة', 'Activities')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('الأنشطة', 'Activities')}
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              {t(
                'توفر أجنحة الطيران مجموعة من الأنشطة المتعلقة بالطيران والتي تهدف إلى تعزيز المعرفة والمهارات في هذا المجال',
                'Flight Wings offers a range of aviation-related activities aimed at enhancing knowledge and skills in this field'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Activities List */}
      <section className="section-padding bg-background">
        <div className="container mx-auto container-padding">
          {/* View Toggle */}
          <div className="flex justify-end mb-8">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid className="w-4 h-4" />
                {t('عناصر', 'Grid')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                {t('قائمة', 'List')}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {t('لا توجد أنشطة حالياً', 'No activities available')}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Activity */}
              {featuredActivity && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold mb-6 text-end">{t('الأنشطة القادمة', 'Upcoming Activities')}</h2>
                  <Link to={`/activities/${featuredActivity.id}`}>
                    <div className="grid md:grid-cols-2 gap-8 bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-lg transition-shadow">
                      <div className="order-2 md:order-1 p-8 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-2">
                          {t(featuredActivity.titleAr, featuredActivity.titleEn)}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {formatDate(featuredActivity.date)}
                        </p>
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {t(featuredActivity.excerptAr, featuredActivity.excerptEn)}
                        </p>
                        <Button className="w-fit gap-2">
                          <Arrow className="w-4 h-4" />
                          {t('قراءة المزيد', 'Read More')}
                        </Button>
                      </div>
                      <div className="order-1 md:order-2 aspect-video md:aspect-auto">
                        {featuredActivity.images && featuredActivity.images[0] ? (
                          <img
                            src={featuredActivity.images[0]}
                            alt={t(featuredActivity.titleAr, featuredActivity.titleEn)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Regular Activities */}
              {viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/activities/${activity.id}`}>
                        <div className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-lg transition-all">
                          <div className="relative aspect-video overflow-hidden">
                            {activity.images && activity.images[0] ? (
                              <img
                                src={activity.images[0]}
                                alt={t(activity.titleAr, activity.titleEn)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                            <div className="absolute top-3 end-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                              {formatDate(activity.date)}
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {t(activity.titleAr, activity.titleEn)}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                              {t(activity.excerptAr, activity.excerptEn)}
                            </p>
                            <div className="flex items-center gap-2 text-primary font-medium">
                              {t('قراءة المزيد', 'Read More')}
                              <Arrow className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {regularActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/activities/${activity.id}`}>
                        <div className="group flex gap-6 bg-card rounded-xl p-4 border shadow-soft hover:shadow-lg transition-all">
                          <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            {activity.images && activity.images[0] ? (
                              <img
                                src={activity.images[0]}
                                alt={t(activity.titleAr, activity.titleEn)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(activity.date)}
                              <span className="px-2 py-0.5 rounded bg-muted">{activity.category}</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                              {t(activity.titleAr, activity.titleEn)}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {t(activity.excerptAr, activity.excerptEn)}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Arrow className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Activities;
