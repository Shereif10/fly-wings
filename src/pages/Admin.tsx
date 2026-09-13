import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Image,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  Home,
  ChevronRight,
  Bell,
  Search,
  Calendar,
  History,
  UserCheck,
  GraduationCap,
  ClipboardList,
  Plane,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.svg';

// Import admin components
import DashboardOverview from '@/components/admin/DashboardOverview';
import ApplicationsManager from '@/components/admin/ApplicationsManager';
import MessagesManager from '@/components/admin/MessagesManager';
import PackagesManager from '@/components/admin/PackagesManager';
import BlogManager from '@/components/admin/BlogManager';
import NewsManager from '@/components/admin/NewsManager';
import GraduatesManager from '@/components/admin/GraduatesManager';
import GalleryManager from '@/components/admin/GalleryManager';
import FAQManager from '@/components/admin/FAQManager';
import SettingsManager from '@/components/admin/SettingsManager';
import SeoManager from '@/components/admin/SeoManager';
import PagesManager from '@/components/admin/PagesManager';
import LegalPagesManager from '@/components/admin/LegalPagesManager';
import AboutPageManager from '@/components/admin/AboutPageManager';
import ActivitiesManager from '@/components/admin/ActivitiesManager';
import PartnersManager from '@/components/admin/PartnersManager';
import JourneyManager from '@/components/admin/JourneyManager';
import TrainingTeamManager from '@/components/admin/TrainingTeamManager';
import TrainingProgramsManager from '@/components/admin/TrainingProgramsManager';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import CrawlerView from '@/components/admin/CrawlerView';
import ImageOptimizerManager from '@/components/admin/ImageOptimizerManager';

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, direction } = useLanguage();

  useEffect(() => {
    if (loading || user) return;
    let cancelled = false;
    // Give Firebase a moment to restore/propagate the session before redirecting
    const timer = setTimeout(async () => {
      const { getAuthLazy } = await import('@/lib/firebase');
      const auth = await getAuthLazy();
      if (!cancelled && !auth.currentUser) {
        navigate('/auth');
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, loading, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: { ar: 'نظرة عامة', en: 'Overview' } },
    { path: '/admin/applications', icon: ClipboardList, label: { ar: 'طلبات التسجيل', en: 'Applications' } },
    { path: '/admin/messages', icon: MessageSquare, label: { ar: 'الرسائل', en: 'Messages' } },
    { path: '/admin/packages', icon: Package, label: { ar: 'الباقات التدريبية', en: 'Training Packages' } },
    { path: '/admin/training-programs', icon: Plane, label: { ar: 'مراحل التدريب', en: 'Training Stages' } },
    { path: '/admin/pages', icon: Home, label: { ar: 'الصفحات', en: 'Pages' } },
    { path: '/admin/about-page', icon: FileText, label: { ar: 'صفحة من نحن', en: 'About Page' } },
    { path: '/admin/journey', icon: History, label: { ar: 'انطلاقة الأكاديمية', en: 'Academy Launch' } },
    { path: '/admin/training-team', icon: GraduationCap, label: { ar: 'فريق التدريب', en: 'Training Team' } },
    { path: '/admin/news', icon: FileText, label: { ar: 'الأخبار', en: 'News' } },
    { path: '/admin/graduates', icon: GraduationCap, label: { ar: 'نجوم الطيران', en: 'Flying Stars' } },
    { path: '/admin/activities', icon: Calendar, label: { ar: 'الأنشطة', en: 'Activities' } },
    { path: '/admin/partners', icon: Users, label: { ar: 'شركاء النجاح', en: 'Partners' } },
    { path: '/admin/blog', icon: FileText, label: { ar: 'المدونة', en: 'Blog' } },
    { path: '/admin/gallery', icon: Image, label: { ar: 'المعرض', en: 'Gallery' } },
    { path: '/admin/faq', icon: HelpCircle, label: { ar: 'الأسئلة', en: 'FAQ' } },
    { path: '/admin/legal', icon: FileText, label: { ar: 'الصفحات القانونية', en: 'Legal Pages' } },
    { path: '/admin/seo', icon: Search, label: { ar: 'تحسين السيو', en: 'SEO' } },
    { path: '/admin/crawler', icon: Search, label: { ar: 'عرض البوتات', en: 'Crawler View' } },
    { path: '/admin/image-optimizer', icon: Image, label: { ar: 'تحسين الصور', en: 'Image Optimizer' } },
    { path: '/admin/settings', icon: Settings, label: { ar: 'الإعدادات', en: 'Settings' } },
    { path: '/admin/analytics', icon: BarChart3, label: { ar: 'التحليلات', en: 'Analytics' } },
  ];

  const currentPage = menuItems.find(item => 
    location.pathname === item.path || 
    (item.path !== '/admin' && location.pathname.startsWith(item.path))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30 flex" dir={direction}>
      {/* Sidebar */}
      <aside className={`
        fixed top-0 start-0 h-full bg-sidebar z-50 transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
            <img src={logo} alt="Fly Wings" className="h-12 w-auto" />
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="font-bold text-sidebar-foreground">{t('أجنحة الطيران', 'Fly Wings')}</h2>
                <p className="text-xs text-sidebar-foreground/60">{t('لوحة الإدارة', 'Admin Panel')}</p>
              </motion.div>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{t(item.label.ar, item.label.en)}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className={`w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              }`}
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ms-3 text-sm">{t('تسجيل الخروج', 'Logout')}</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ms-64' : 'ms-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b z-40">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                  {t('لوحة التحكم', 'Dashboard')}
                </Link>
                {currentPage && currentPage.path !== '/admin' && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {t(currentPage.label.ar, currentPage.label.en)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder={t('بحث...', 'Search...')} 
                  className="border-0 bg-transparent h-auto p-0 w-48 focus-visible:ring-0"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="rounded-xl relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 end-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              {/* Profile */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="applications" element={<ApplicationsManager />} />
            <Route path="messages" element={<MessagesManager />} />
            <Route path="packages" element={<PackagesManager />} />
            <Route path="training-programs" element={<TrainingProgramsManager />} />
            <Route path="pages" element={<PagesManager />} />
            <Route path="about-page" element={<AboutPageManager />} />
            <Route path="journey" element={<JourneyManager />} />
            <Route path="training-team" element={<TrainingTeamManager />} />
            <Route path="news" element={<NewsManager />} />
            <Route path="graduates" element={<GraduatesManager />} />
            <Route path="activities" element={<ActivitiesManager />} />
            <Route path="partners" element={<PartnersManager />} />
            <Route path="blog/*" element={<BlogManager />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="faq" element={<FAQManager />} />
            <Route path="legal" element={<LegalPagesManager />} />
            <Route path="seo" element={<SeoManager />} />
            <Route path="settings" element={<SettingsManager />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="crawler" element={<CrawlerView />} />
            <Route path="image-optimizer" element={<ImageOptimizerManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Admin;
