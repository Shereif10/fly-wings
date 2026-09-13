import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cachedDoc } from '@/lib/firestoreCache';

const FloatingButtons = () => {
  const { direction } = useLanguage();
  const [settings, setSettings] = useState({ phone: '920002936', whatsapp: '920002936' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await cachedDoc('site_settings', 'general');
        if (data) {
          setSettings({
            phone: data.phone || '920002936',
            whatsapp: data.whatsapp || data.phone || '920002936',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);


  // Format WhatsApp number (remove spaces, dashes, etc.)
  const formatWhatsApp = (num: string) => num.replace(/\D/g, '');

  return (
    <div className={`fixed bottom-6 ${direction === 'rtl' ? 'left-6' : 'right-6'} z-40 flex flex-col gap-3`}>
      {/* WhatsApp */}
      <motion.a
        href={`https://wa.me/${formatWhatsApp(settings.whatsapp)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <MessageCircle className="h-7 w-7" />
      </motion.a>

      {/* Call */}
      <motion.a
        href={`tel:${settings.phone}`}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Phone className="h-7 w-7" />
      </motion.a>
    </div>
  );
};

export default FloatingButtons;
