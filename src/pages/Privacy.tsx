import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, Plane, Lock, Eye, FileText } from 'lucide-react';
import { ensureHtml } from '@/lib/content';
import PageSeo from '@/components/seo/PageSeo';

interface LegalContent {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
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

const Privacy = () => {
  const { t } = useLanguage();
  const [content, setContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'legal_pages', 'privacy');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as LegalContent);
        }
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const features = [
    { icon: Lock, label: { ar: 'بيانات مشفرة', en: 'Encrypted Data' } },
    { icon: Eye, label: { ar: 'شفافية تامة', en: 'Full Transparency' } },
    { icon: Shield, label: { ar: 'حماية متقدمة', en: 'Advanced Protection' } },
  ];

  return (
    <Layout>
      <PageSeo
        pageKey="privacy"
        path="/privacy"
        defaultTitleAr={'سياسة الخصوصية — أجنحة الطيران'}
        defaultTitleEn={'Privacy Policy — Fly Wings'}
        defaultDescriptionAr={'سياسة الخصوصية وطريقة تعاملنا مع بياناتك في أجنحة الطيران.'}
        defaultDescriptionEn={'How Fly Wings Academy collects and handles your personal data.'}
      />

      {/* Hero */}
      <section className="pt-28 pb-24 bg-gradient-to-br from-aviation-navy via-aviation-navy to-primary relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <FloatingPlane delay={0} className="top-[30%]" />
          <FloatingPlane delay={7} className="top-[60%]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {content ? t(content.titleAr, content.titleEn) : t('سياسة الخصوصية', 'Privacy Policy')}
          </motion.h1>
          
          <motion.p
            className="text-white/70 text-lg max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t(
              'نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية',
              'We respect your privacy and are committed to protecting your personal data'
            )}
          </motion.p>

          {/* Feature badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/90">{t(feature.label.ar, feature.label.en)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
            <path 
              d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,60 L1440,120 L0,120 Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background relative">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</p>
            </div>
          ) : content ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                {/* Decorative elements */}
                <motion.div 
                  className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"
                  animate={{ scale: [1.2, 1, 1.2] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                
                <div className="relative bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-bold text-foreground">{t('سياسة الخصوصية', 'Privacy Policy')}</h2>
                        <p className="text-xs text-muted-foreground">{t('آخر تحديث', 'Last updated')}: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div 
                    className="p-8 md:p-12 article-content text-foreground leading-relaxed prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: ensureHtml(t(content.contentAr, content.contentEn)),
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                {t('لا يوجد محتوى حالياً', 'No content available')}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
