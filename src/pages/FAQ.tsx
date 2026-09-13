import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Plane, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';
import { Helmet } from 'react-helmet-async';

interface FAQ {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  order: number;
}

const FAQ = () => {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ)));
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  return (
    <Layout>
      <PageSeo
        pageKey="faq"
        path="/faq"
        defaultTitleAr={'الأسئلة الشائعة — أجنحة الطيران'}
        defaultTitleEn={'FAQ — Fly Wings'}
        defaultDescriptionAr={'إجابات عن أكثر الأسئلة شيوعاً حول التدريب والتسجيل في أجنحة الطيران.'}
        defaultDescriptionEn={'Answers to common questions about training and enrollment at Fly Wings.'}
      />
      {faqs.length > 0 && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: t(f.questionAr, f.questionEn),
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: t(f.answerAr, f.answerEn),
                },
              })),
            })}
          </script>
        </Helmet>
      )}


      {/* Hero with animated background */}
      <section className="relative pt-28 pb-24 bg-gradient-to-br from-aviation-navy via-[hsl(200,50%,15%)] to-aviation-navy text-white overflow-hidden">
        {/* Animated floating planes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Plane 1 - top right, slow drift */}
          <motion.div
            className="absolute top-16 right-[10%] opacity-20"
            animate={{ 
              x: [0, 30, 0], 
              y: [0, -15, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-16 h-16 text-primary" />
          </motion.div>

          {/* Plane 2 - left side, floating */}
          <motion.div
            className="absolute top-32 left-[5%] opacity-15"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, 20, 0],
              rotate: [0, -8, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-12 h-12 text-secondary rotate-45" />
          </motion.div>

          {/* Plane 3 - bottom right */}
          <motion.div
            className="absolute bottom-20 right-[15%] opacity-10"
            animate={{ 
              x: [0, 40, 0], 
              y: [0, -10, 0],
              rotate: [-15, -10, -15]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-20 h-20 text-accent" />
          </motion.div>

          {/* Glowing orbs */}
          <motion.div
            className="absolute w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            style={{ top: '10%', right: '20%' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
            style={{ bottom: '20%', left: '10%' }}
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity }}
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="faqGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#faqGrid)" />
            </svg>
          </div>

          {/* Flying plane trail */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ x: '-100px', opacity: 0 }}
            animate={{ x: 'calc(100vw + 100px)', opacity: [0, 0.3, 0.3, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
          >
            <Plane className="w-8 h-8 text-white -rotate-12" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Animated badge */}
          <motion.div
            className="inline-flex items-center gap-3 bg-card/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-white/10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircleQuestion className="w-5 h-5 text-accent" />
            </motion.div>
            <span>{t('نجيب على استفساراتك', 'We Answer Your Questions')}</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✈️
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-white via-primary-foreground to-white bg-clip-text">
              {t('الأسئلة الشائعة', 'Frequently Asked Questions')}
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {t(
              'إجابات على أكثر الأسئلة شيوعاً حول برامجنا التدريبية',
              'Answers to the most common questions about our training programs'
            )}
          </motion.p>

          {/* Decorative planes row */}
          <motion.div 
            className="flex justify-center items-center gap-8 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              >
                <Plane className="w-6 h-6 text-primary/60" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 100L48 91.7C96 83.3 192 66.7 288 58.3C384 50 480 50 576 54.2C672 58.3 768 66.7 864 70.8C960 75 1056 75 1152 70.8C1248 66.7 1344 58.3 1392 54.2L1440 50V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl" />
          
          {/* Floating plane decorations */}
          <motion.div
            className="absolute top-40 right-10 opacity-10"
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-24 h-24 text-primary" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-10 opacity-10"
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-16 h-16 text-secondary rotate-180" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          {/* Section header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring" }}
            >
              <HelpCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('كيف يمكننا مساعدتك؟', 'How Can We Help You?')}
            </h2>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-12 h-12 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">{t('جارٍ التحميل...', 'Loading...')}</p>
            </div>
          ) : faqs.length === 0 ? (
            <motion.div 
              className="text-center py-16 bg-card/50 rounded-3xl border border-border/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Plane className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('لا توجد أسئلة حالياً', 'No questions available')}
              </p>
            </motion.div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <AccordionItem 
                    value={`item-${faq.id}`} 
                    className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 px-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                  >
                    <AccordionTrigger className="text-start hover:no-underline py-6 gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div 
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors"
                          whileHover={{ rotate: 10 }}
                        >
                          <Plane className="w-5 h-5 text-primary" />
                        </motion.div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {t(faq.questionAr, faq.questionEn)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 ps-14 text-muted-foreground leading-relaxed">
                      {t(faq.answerAr, faq.answerEn)}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}

          {/* Bottom CTA */}
          {faqs.length > 0 && (
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-muted-foreground mb-4">
                {t('لم تجد إجابة على سؤالك؟', "Didn't find the answer you need?")}
              </p>
              <motion.a
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{t('تواصل معنا', 'Contact Us')}</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Plane className="w-5 h-5 -rotate-45" />
                </motion.div>
              </motion.a>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
