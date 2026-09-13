import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m as motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ServiceItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;
  published?: boolean;
}

const Services = () => {
  const { t, direction } = useLanguage();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as ServiceItem))
          .filter((s) => s.published !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setServices(fetched);
      } catch (e) {
        console.error('Error fetching services:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    const timeout = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section ref={heroRef} className="relative bg-aviation-navy overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="servicesHeroPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50 0L0 30L10 35L50 10L90 35L100 30L50 0Z" fill="currentColor" className="text-white/30" />
                <path d="M50 20L20 40L30 45L50 30L70 45L80 40L50 20Z" fill="currentColor" className="text-white/20" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#servicesHeroPattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{t('الخدمات', 'Services')}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-right"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('خدمات أجنحة الطيران', 'Flight Wings Services')}
            </h1>
            <p className="text-white/70 max-w-2xl ms-auto">
              {t(
                'استعرض جميع الخدمات المتاحة، واضغط على أي خدمة لمعرفة التفاصيل.',
                'Browse all available services and click any service to view details.'
              )}
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Grid */}
      <main className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {t('لا توجد خدمات منشورة حالياً', 'No published services yet')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-card border shadow-soft"
                >
                  {/* Make the whole card clickable */}
                  <Link
                    to={`/services/${service.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={t(
                      `عرض تفاصيل خدمة ${service.titleAr}`,
                      `View details for ${service.titleEn}`
                    )}
                  />

                  <div className="absolute inset-0">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={t(service.titleAr, service.titleEn)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                  <div className="absolute bottom-0 start-0 end-0 p-6 text-right">
                    <h2 className="text-xl font-bold text-white mb-2">
                      {t(service.titleAr, service.titleEn)}
                    </h2>
                    {(service.descriptionAr || service.descriptionEn) && (
                      <p className="text-white/70 text-sm line-clamp-2">
                        {t(service.descriptionAr, service.descriptionEn)}
                      </p>
                    )}

                    <div className="mt-4 flex justify-end relative z-20">
                      <Button asChild variant="secondary" className="rounded-full gap-2">
                        <Link to={`/services/${service.id}`}>
                          {t('عرض', 'View')}
                          <Arrow className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Services;
