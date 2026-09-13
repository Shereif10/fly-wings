import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, User, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { cachedDoc } from '@/lib/firestoreCache';

import { db } from '@/lib/firebase';
import logo from '@/assets/fly-wings-logo.png';

interface ActivityItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  date: string;
  published?: boolean;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showActivities, setShowActivities] = useState<boolean | null>(null);
  const [showGraduates, setShowGraduates] = useState(true);
  const { language, setLanguage, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Fetch section visibility settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await cachedDoc('site_settings', 'general');

        if (data) {
          setShowActivities(data.showActivitiesSection !== false);
          setShowGraduates(data.showGraduatesSection !== false);
        } else {
          // If settings doc doesn't exist, default to showing sections
          setShowActivities(true);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fail open to avoid nav flicker/hidden links due to transient errors
        setShowActivities(true);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const q = query(collection(db, 'activities'), orderBy('date', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as ActivityItem))
          .filter((a) => a.published !== false)
          .slice(0, 5);
        setActivities(fetched);
      } catch (error) {
        console.error('Error fetching activities for nav:', error);
      }
    };

    fetchActivities();
  }, []);

  const navLinks: { path: string; label: { ar: string; en: string }; hasDropdown?: 'activities' }[] = [
    { path: '/', label: { ar: 'الرئيسية', en: 'Home' } },
    { path: '/about', label: { ar: 'تعرف علينا', en: 'About Us' } },
    { path: '/packages', label: { ar: 'برامجنا', en: 'Our Programs' } },
    { path: '/training-programs', label: { ar: 'مراحل التدريب', en: 'Training Programs' } },
    ...(showGraduates ? [{ path: '/graduates', label: { ar: 'نجوم الطيران', en: 'Graduates' } }] : []),
    ...(showActivities ? [{ path: '/activities', label: { ar: 'الأنشطة', en: 'Activities' }, hasDropdown: 'activities' as const }] : []),
    { path: '/gallery', label: { ar: 'المعرض', en: 'Gallery' } },
    { path: '/blog', label: { ar: 'المدونة', en: 'Blog' } },
    { path: '/news', label: { ar: 'الأخبار', en: 'News' } },
    { path: '/faq', label: { ar: 'الأسئلة', en: 'FAQ' } },
    { path: '/contact', label: { ar: 'تواصل', en: 'Contact' } },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
      <div className="container mx-auto relative">
        {/* Floating Pill Navbar */}
        <div className="bg-white/95 backdrop-blur-lg rounded-full px-6 py-3 shadow-2xl border border-border/20">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                src={logo}
                alt="Fly Wings"
                width={400}
                height={259}
                fetchPriority="high"
                decoding="async"
                className="h-12 w-auto transition-transform group-hover:scale-105"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              {navLinks.map((link) => (
                link.hasDropdown === 'activities' ? (
                  <div
                    key={link.path}
                    className="relative"
                    onMouseEnter={() => setActivitiesDropdownOpen(true)}
                    onMouseLeave={() => setActivitiesDropdownOpen(false)}
                  >
                    <button
                      className={`relative px-2.5 py-1.5 text-xs font-medium transition-colors rounded-full flex items-center gap-1 ${
                        location.pathname.startsWith('/activities')
                          ? 'text-primary bg-primary/10' 
                          : 'text-aviation-navy hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      {t(link.label.ar, link.label.en)}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activitiesDropdownOpen ? 'rotate-180' : ''}`} />
                      {location.pathname.startsWith('/activities') && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                          layoutId="activeNav"
                        />
                      )}
                    </button>

                    {/* Activities Dropdown */}
                    {activitiesDropdownOpen && (
                      <div className="absolute top-full right-0 pt-3 z-[100]">
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="w-[520px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
                        >
                          <div className="bg-aviation-navy px-6 py-4 border-b border-border">
                            <h3 className="text-white font-bold text-lg">
                              {t('أنشطة أجنحة الطيران', 'Flight Wings Activities')}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {t('اكتشف أحدث الأنشطة والفعاليات', 'Discover the latest activities and events')}
                            </p>
                          </div>

                          <div className="p-4 grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto bg-background">
                            {activities.length === 0 ? (
                              <div className="py-8 text-center text-muted-foreground">
                                {t('جارٍ التحميل...', 'Loading...')}
                              </div>
                            ) : (
                              activities.map((activity) => (
                                <Link
                                  key={activity.id}
                                  to={`/activities/${activity.id}`}
                                  onClick={() => setActivitiesDropdownOpen(false)}
                                  className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                                >
                                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-aviation-navy/10 flex items-center justify-center overflow-hidden">
                                    {activity.imageUrl ? (
                                      <img src={activity.imageUrl} alt="" width={96} height={96} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                    ) : (
                                      <Calendar className="w-6 h-6 text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground group-hover/item:text-primary transition-colors line-clamp-1 text-sm">
                                      {t(activity.titleAr, activity.titleEn)}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                      {t(activity.descriptionAr, activity.descriptionEn)}
                                    </p>
                                    {activity.date && (
                                      <p className="text-xs text-primary mt-1">
                                        {new Date(activity.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              ))
                            )}
                          </div>

                          <div className="bg-muted/50 px-6 py-3 border-t border-border">
                            <Link
                              to="/activities"
                              onClick={() => setActivitiesDropdownOpen(false)}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {t('عرض جميع الأنشطة ←', 'View All Activities →')}
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-2.5 py-1.5 text-xs font-medium transition-colors rounded-full ${
                      location.pathname === link.path 
                        ? 'text-primary bg-primary/10' 
                        : 'text-aviation-navy hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {t(link.label.ar, link.label.en)}
                    {location.pathname === link.path && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                        layoutId="activeNav"
                      />
                    )}
                  </Link>
                )
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-aviation-navy hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Globe className="h-5 w-5" />
              </button>

              {/* Admin/Login Button */}
              {user && isAdmin ? (
                <Link to="/admin">
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-aviation-navy hover:bg-primary/20 transition-colors border border-primary/20">
                    <User className="h-5 w-5" />
                  </button>
                </Link>
              ) : (
                <Link to="/auth">
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-aviation-navy hover:bg-primary/20 transition-colors border border-primary/20">
                    <User className="h-5 w-5" />
                  </button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-aviation-navy hover:bg-primary/10 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden mt-2 bg-[#1a3a4a]/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden relative z-50"
            >
              <nav className="p-4 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        location.pathname === link.path
                          ? 'bg-accent text-accent-foreground'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {t(link.label.ar, link.label.en)}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="flex gap-2 pt-4 mt-2 border-t border-white/10">
                  <button 
                    onClick={toggleLanguage} 
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {language === 'ar' ? 'English' : 'العربية'}
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
