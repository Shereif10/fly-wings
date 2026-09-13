import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Plane, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface SiteSettings {
  phone: string;
  email: string;
  whatsapp: string;
  addressAr: string;
  addressEn: string;
}

const defaultSettings: SiteSettings = {
  phone: '920002936',
  email: 'info@bflywings.com',
  whatsapp: '920002936',
  addressAr: 'المملكة العربية السعودية',
  addressEn: 'Saudi Arabia',
};

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'contact_messages'), data);
      toast({
        title: t('تم إرسال رسالتك بنجاح', 'Message sent successfully'),
        description: t('سنتواصل معك قريباً', 'We will contact you soon'),
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: t('حدث خطأ', 'Error occurred'),
        description: t('يرجى المحاولة مرة أخرى', 'Please try again'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: { ar: 'اتصل بنا', en: 'Call Us' },
      value: settings.phone,
      href: `tel:${settings.phone}`,
    },
    {
      icon: Mail,
      label: { ar: 'راسلنا', en: 'Email Us' },
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    {
      icon: MapPin,
      label: { ar: 'موقعنا', en: 'Our Location' },
      value: { ar: settings.addressAr, en: settings.addressEn },
      href: 'https://www.google.com/maps/place/24%C2%B039\'58.3%22N+46%C2%B037\'17.4%22E/@24.6662949,46.6214277,21z/data=!4m4!3m3!8m2!3d24.666181!4d46.621487?entry=ttu',
    },
  ];

  return (
    <Layout>
      <PageSeo
        pageKey="contact"
        path="/contact"
        defaultTitleAr={'تواصل معنا — أجنحة الطيران'}
        defaultTitleEn={'Contact Us — Fly Wings'}
        defaultDescriptionAr={'تواصل مع أكاديمية أجنحة الطيران عبر الهاتف أو البريد أو نموذج التواصل.'}
        defaultDescriptionEn={'Get in touch with Fly Wings Academy by phone, email or the contact form.'}
      />

      {/* Hero with animated background */}
      <section className="relative pt-28 pb-24 bg-gradient-to-br from-aviation-navy via-[hsl(200,50%,15%)] to-aviation-navy text-white overflow-hidden">
        {/* Animated floating planes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Plane 1 - top right */}
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

          {/* Plane 2 - left side */}
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
                <pattern id="contactGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#contactGrid)" />
            </svg>
          </div>

          {/* Flying plane trail */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ x: '-100px', opacity: 0 }}
            animate={{ x: 'calc(100vw + 100px)', opacity: [0, 0.3, 0.3, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatDelay: 8 }}
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
              <MessageCircle className="w-5 h-5 text-accent" />
            </motion.div>
            <span>{t('نحن هنا لمساعدتك', 'We Are Here to Help')}</span>
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
            {t('تواصل معنا', 'Contact Us')}
          </motion.h1>

          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {t(
              'نحن هنا للإجابة على جميع استفساراتك',
              'We are here to answer all your inquiries'
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

      {/* Contact Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl" />
          
          {/* Floating plane decorations */}
          <motion.div
            className="absolute top-40 right-10 opacity-5"
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-32 h-32 text-primary" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-10 opacity-5"
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-24 h-24 text-secondary rotate-180" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Plane className="w-6 h-6 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t('معلومات التواصل', 'Contact Information')}
                </h2>
              </div>
              
              <div className="space-y-4 mb-8">
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={index}
                    href={info.href}
                    className="flex items-center gap-4 p-5 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors"
                      whileHover={{ rotate: 10 }}
                    >
                      <info.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t(info.label.ar, info.label.en)}
                      </p>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors" dir={index === 0 ? 'ltr' : undefined}>
                        {typeof info.value === 'object' ? t(info.value.ar, info.value.en) : info.value}
                      </p>
                    </div>
                    <motion.div
                      className="ms-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Plane className="w-5 h-5 text-primary -rotate-45" />
                    </motion.div>
                  </motion.a>
                ))}
              </div>

              {/* Map with styled container */}
              <motion.div 
                className="aspect-video rounded-2xl overflow-hidden bg-card/50 border border-border/50 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d500!2d46.621487!3d24.666181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDM5JzU4LjMiTiA0NsKwMzcnMTcuNCJF!5e0!3m2!1sen!2ssa!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 shadow-xl relative overflow-hidden">
                {/* Card decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                <motion.div
                  className="absolute top-4 right-4 opacity-10"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Plane className="w-16 h-16 text-primary" />
                </motion.div>

                <div className="flex items-center gap-3 mb-8 relative">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Send className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {t('أرسل لنا رسالة', 'Send Us a Message')}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="name" className="text-foreground font-medium">{t('الاسم', 'Name')}</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      className="mt-2 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                      placeholder={t('أدخل اسمك الكامل', 'Enter your full name')}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                  >
                    <Label htmlFor="email" className="text-foreground font-medium">{t('البريد الإلكتروني', 'Email')}</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      className="mt-2 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                      placeholder={t('أدخل بريدك الإلكتروني', 'Enter your email address')}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="phone" className="text-foreground font-medium">{t('رقم الجوال', 'Phone')}</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      className="mt-2 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                      placeholder={t('أدخل رقم جوالك', 'Enter your phone number')}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                  >
                    <Label htmlFor="message" className="text-foreground font-medium">{t('الرسالة', 'Message')}</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      rows={5} 
                      required 
                      className="mt-2 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl resize-none"
                      placeholder={t('اكتب رسالتك هنا...', 'Write your message here...')}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full gap-3 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg font-semibold" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Plane className="w-5 h-5" />
                          </motion.div>
                          {t('جاري الإرسال...', 'Sending...')}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {t('إرسال الرسالة', 'Send Message')}
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Plane className="w-5 h-5 -rotate-45" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
