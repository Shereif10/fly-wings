import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, Plane, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cachedDoc } from '@/lib/firestoreCache';

import logo from '@/assets/fly-wings-logo-color.png';

interface OtherSocialLink {
  platform: string;
  url: string;
}

interface SiteSettings {
  phone: string;
  email: string;
  addressAr: string;
  addressEn: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  snapchat: string;
  otherSocialLinks: OtherSocialLink[];
}

const defaultSettings: SiteSettings = {
  phone: '920002936',
  email: 'info@bflywings.com',
  addressAr: 'المملكة العربية السعودية',
  addressEn: 'Saudi Arabia',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  tiktok: '',
  snapchat: '',
  otherSocialLinks: [],
};

// Social platform icons mapping
const platformIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  discord: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>, color: '#5865F2' },
  telegram: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>, color: '#0088cc' },
  whatsapp_channel: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>, color: '#25D366' },
  pinterest: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>, color: '#E60023' },
  reddit: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>, color: '#FF4500' },
  threads: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.097-1.135 3.432-1.14 1.005-.004 1.927.156 2.756.467.034-.758.018-1.48-.047-2.161l2.083-.185c.096 1.034.098 2.127.003 3.262 1.38.749 2.383 1.792 2.91 3.044.752 1.787.697 4.404-1.453 6.503-1.867 1.824-4.159 2.618-7.468 2.642zm.582-7.083c.008 0 .015 0 .023 0 1.105-.058 1.946-.469 2.497-1.21.453-.607.743-1.438.867-2.466-.88-.378-1.883-.577-2.986-.572-.957.003-1.784.245-2.351.687-.503.39-.753.895-.72 1.46.046.76.473 1.378 1.202 1.746.536.27 1.193.387 1.903.36l-.435-.005z"/></svg>, color: '#000000' },
  bluesky: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/></svg>, color: '#0085FF' },
  twitch: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>, color: '#9146FF' },
  spotify: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>, color: '#1DB954' },
  github: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>, color: '#333333' },
  medium: { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>, color: '#000000' },
};

// TikTok icon component
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Snapchat icon component
const SnapchatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03a1.67 1.67 0 0 1-.449-.075c-.449-.12-1.003-.27-1.784-.27-.39 0-.779.029-1.17.09-1.049.15-1.633.81-2.311 1.589-.479.555-1.019 1.154-1.694 1.544-.18.105-.39.162-.599.162-.224 0-.435-.06-.614-.165-.674-.39-1.214-.988-1.693-1.543-.679-.779-1.263-1.439-2.312-1.589-.39-.06-.779-.09-1.168-.09-.766 0-1.319.15-1.769.27-.12.029-.254.06-.389.075h-.045c-.285 0-.479-.135-.555-.405a3.02 3.02 0 0 1-.135-.555c-.044-.195-.104-.479-.164-.57-1.873-.283-2.906-.702-3.146-1.271a.524.524 0 0 1-.045-.225c-.015-.239.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.015-.014c.181-.345.21-.645.12-.87-.194-.449-.883-.674-1.333-.809-.135-.045-.255-.09-.344-.12-.824-.328-1.228-.719-1.213-1.168 0-.359.284-.689.734-.838.149-.06.329-.09.508-.09.12 0 .299.015.465.104.374.18.733.285 1.034.3.197 0 .325-.045.4-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.849 1.069 11.206.793 12.196.793z"/>
  </svg>
);

// Floating airplane animation component
const FloatingPlane = ({ delay = 0, className = "" }: { delay?: number; className?: string }) => (
  <motion.div
    className={`absolute text-primary/20 ${className}`}
    initial={{ x: "-100%", y: 0 }}
    animate={{ 
      x: "200%",
      y: [0, -20, 0, 20, 0],
    }}
    transition={{
      x: { duration: 15, repeat: Infinity, delay, ease: "linear" },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }}
  >
    <Plane className="w-8 h-8 rotate-[-35deg]" />
  </motion.div>
);

const Footer = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await cachedDoc('site_settings', 'general');
        if (data) {
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);


  const quickLinks = [
    { path: '/about', label: { ar: 'من نحن', en: 'About Us' } },
    { path: '/training-programs', label: { ar: 'مراحل التدريب', en: 'Training Stages' } },
    { path: '/packages', label: { ar: 'برامجنا', en: 'Our Programs' } },
    { path: '/blog', label: { ar: 'المدونة', en: 'Blog' } },
    { path: '/faq', label: { ar: 'الأسئلة الشائعة', en: 'FAQ' } },
    { path: '/contact', label: { ar: 'تواصل معنا', en: 'Contact Us' } },
  ];

  // Build social links array including new platforms
  const socialLinks = [
    { icon: <Facebook className="h-4 w-4" />, href: settings.facebook, label: 'Facebook' },
    { icon: <Twitter className="h-4 w-4" />, href: settings.twitter, label: 'Twitter' },
    { icon: <Instagram className="h-4 w-4" />, href: settings.instagram, label: 'Instagram' },
    { icon: <Linkedin className="h-4 w-4" />, href: settings.linkedin, label: 'LinkedIn' },
    { icon: <Youtube className="h-4 w-4" />, href: settings.youtube, label: 'YouTube' },
    { icon: <TikTokIcon />, href: settings.tiktok, label: 'TikTok' },
    { icon: <SnapchatIcon />, href: settings.snapchat, label: 'Snapchat' },
    // Add other social links from the array
    ...settings.otherSocialLinks
      .filter(link => link.platform && link.url)
      .map(link => ({
        icon: platformIcons[link.platform]?.icon || <Send className="h-4 w-4" />,
        href: link.url,
        label: link.platform,
      })),
  ].filter(s => s.href);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="bg-gradient-to-b from-aviation-navy via-aviation-navy to-[#0a1628] text-white relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs */}
        <motion.div 
          className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating airplanes */}
        <FloatingPlane delay={0} className="top-[20%]" />
        <FloatingPlane delay={5} className="top-[50%]" />
        <FloatingPlane delay={10} className="top-[80%]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Animated runway lines */}
        <motion.div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-full"
          style={{
            background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)'
          }}
          animate={{ y: [0, 40] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="container mx-auto container-padding py-12 md:py-20 relative z-10">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Logo & About - Full width on mobile */}
          <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <img src={logo} alt="Fly Wings" width={500} height={500} loading="lazy" decoding="async" className="h-20 md:h-28 w-auto" />
              </motion.div>
              <div>
                <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">{t('أجنحة الطيران', 'Fly Wings')}</h3>
                <p className="text-xs md:text-sm text-white/60">{t('للتدريب على الطيران', 'Aviation Training')}</p>
              </div>
            </Link>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed mb-4 hidden md:block">
              {t(
                'شركة رائدة في مجال التدريب على الطيران في المملكة العربية السعودية، نسعى لتحقيق رؤية 2030.',
                'A leading aviation training company in Saudi Arabia, striving to achieve Vision 2030.'
              )}
            </p>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={`${social.label}-${index}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 group"
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm md:text-lg font-bold mb-3 md:mb-6 flex items-center gap-2">
              <motion.div
                className="p-1.5 md:p-2 rounded-lg bg-primary/20"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Plane className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              </motion.div>
              {t('روابط سريعة', 'Quick Links')}
            </h4>
            <ul className="space-y-1.5 md:space-y-3">
              {quickLinks.map((link, index) => (
                <motion.li 
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className="text-white/70 hover:text-primary transition-all duration-300 text-xs md:text-sm flex items-center gap-2 group py-0.5"
                  >
                    <Plane className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary/50 group-hover:text-primary transition-colors rotate-[-35deg]" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {t(link.label.ar, link.label.en)}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm md:text-lg font-bold mb-3 md:mb-6 flex items-center gap-2">
              <motion.div
                className="p-1.5 md:p-2 rounded-lg bg-primary/20"
                whileHover={{ scale: 1.1 }}
              >
                <Send className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              </motion.div>
              {t('تواصل معنا', 'Contact Us')}
            </h4>
            <ul className="space-y-2 md:space-y-4">
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2 md:gap-4 text-white/70 hover:text-primary transition-colors group">
                  <motion.div 
                    className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <Phone className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                  </motion.div>
                  <div>
                    <span className="text-[10px] md:text-xs text-white/40 block">{t('اتصل بنا', 'Call Us')}</span>
                    <span className="text-xs md:text-sm font-medium" dir="ltr">{settings.phone}</span>
                  </div>
                </a>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 md:gap-4 text-white/70 hover:text-primary transition-colors group">
                  <motion.div 
                    className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <Mail className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                  </motion.div>
                  <div>
                    <span className="text-[10px] md:text-xs text-white/40 block">{t('راسلنا', 'Email Us')}</span>
                    <span className="text-xs md:text-sm font-medium break-all">{settings.email}</span>
                  </div>
                </a>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                <a 
                  href="https://www.google.com/maps/place/24%C2%B039'58.3%22N+46%C2%B037'17.4%22E/@24.6662949,46.6214277,21z/data=!4m4!3m3!8m2!3d24.666181!4d46.621487?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 md:gap-4 text-white/70 hover:text-primary transition-colors group"
                >
                  <motion.div 
                    className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <MapPin className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary" />
                  </motion.div>
                  <div>
                    <span className="text-[10px] md:text-xs text-white/40 block">{t('موقعنا', 'Location')}</span>
                    <span className="text-xs md:text-sm font-medium">{t(settings.addressAr, settings.addressEn)}</span>
                  </div>
                </a>
              </motion.li>
            </ul>
          </motion.div>

          {/* Vision 2030 - Hidden on mobile */}
          <motion.div variants={itemVariants} className="hidden lg:block">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
              <motion.div
                className="p-2 rounded-lg bg-primary/20"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </motion.div>
              {t('رؤية 2030', 'Vision 2030')}
            </h4>
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-colors">
              <motion.div 
                className="absolute top-2 right-2 text-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-16 h-16" />
              </motion.div>
              <p className="text-white/70 text-sm leading-relaxed relative z-10">
                {t(
                  'نساهم في تحقيق رؤية المملكة 2030 بتأهيل كوادر سعودية في مجال الطيران.',
                  'Contributing to Vision 2030 by qualifying Saudi cadres in aviation.'
                )}
              </p>
              <motion.div 
                className="mt-4 flex items-center gap-2 text-primary text-xs font-medium"
                whileHover={{ x: 5 }}
              >
                <Plane className="w-3 h-3 rotate-[-35deg]" />
                <span>{t('انطلق نحو المستقبل', 'Fly to the Future')}</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Divider with plane */}
        <motion.div 
          className="relative my-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-aviation-navy px-4"
            animate={{ x: [-50, 50, -50] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="w-5 h-5 text-primary rotate-[-35deg]" />
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Plane className="w-4 h-4 text-primary/50 rotate-[-35deg]" />
            </motion.div>
            <p>
              © {new Date().getFullYear()} {t('أجنحة الطيران. جميع الحقوق محفوظة', 'Fly Wings. All rights reserved')}
            </p>
          </div>
          <div className="flex gap-6 text-sm text-white/50">
            <Link to="/privacy" className="hover:text-primary transition-colors flex items-center gap-2 group">
              <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
              {t('سياسة الخصوصية', 'Privacy Policy')}
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors flex items-center gap-2 group">
              <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
              {t('الشروط والأحكام', 'Terms & Conditions')}
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
