import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useState, lazy, Suspense } from "react";
import usePageTracking from "@/hooks/usePageTracking";
import { AnimatePresence, LazyMotion } from "framer-motion";

// Animation features are fetched only after the first render, keeping the
// main thread free during initial load.
const loadMotionFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);
import LoadingScreen from "@/components/LoadingScreen";
import { ROUTER_BASENAME } from "@/lib/content";

// Lazy load pages with retry + one-time reload for stale/failed chunks
const lazyWithRetry = <T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
  key: string
) =>
  lazy(async () => {
    const flag = `chunk-reload:${key}`;
    try {
      const mod = await factory();
      sessionStorage.removeItem(flag);
      return mod;
    } catch (err) {
      // Retry once (transient network)
      try {
        const mod = await factory();
        sessionStorage.removeItem(flag);
        return mod;
      } catch (err2) {
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, "1");
          window.location.reload();
          return new Promise<T>(() => {});
        }
        throw err2;
      }
    }
  });

const Index = lazyWithRetry(() => import("./pages/Index"), "Index");

const About = lazyWithRetry(() => import("./pages/About"), "About");
const OurJourney = lazyWithRetry(() => import("./pages/OurJourney"), "OurJourney");
const BoardMembers = lazyWithRetry(() => import("./pages/BoardMembers"), "BoardMembers");
const TrainingTeam = lazyWithRetry(() => import("./pages/TrainingTeam"), "TrainingTeam");
const TrainingPrograms = lazyWithRetry(() => import("./pages/TrainingPrograms"), "TrainingPrograms");
const TrainingProgramDetail = lazyWithRetry(() => import("./pages/TrainingProgramDetail"), "TrainingProgramDetail");
const Packages = lazyWithRetry(() => import("./pages/Packages"), "Packages");
const PackageDetail = lazyWithRetry(() => import("./pages/PackageDetail"), "PackageDetail");
const Blog = lazyWithRetry(() => import("./pages/Blog"), "Blog");
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"), "BlogPost");
const News = lazyWithRetry(() => import("./pages/News"), "News");
const NewsPost = lazyWithRetry(() => import("./pages/NewsPost"), "NewsPost");
const Graduates = lazyWithRetry(() => import("./pages/Graduates"), "Graduates");
const GraduateDetail = lazyWithRetry(() => import("./pages/GraduateDetail"), "GraduateDetail");
const Gallery = lazyWithRetry(() => import("./pages/Gallery"), "Gallery");
const FAQ = lazyWithRetry(() => import("./pages/FAQ"), "FAQ");
const Contact = lazyWithRetry(() => import("./pages/Contact"), "Contact");
const Activities = lazyWithRetry(() => import("./pages/Activities"), "Activities");
const ActivityDetail = lazyWithRetry(() => import("./pages/ActivityDetail"), "ActivityDetail");
const Auth = lazyWithRetry(() => import("./pages/Auth"), "Auth");
const Admin = lazyWithRetry(() => import("./pages/Admin"), "Admin");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");

// Toast layers are only needed after the user interacts, so they are loaded
// once the browser is idle instead of in the initial bundle.
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((m) => ({ default: m.Toaster }))
);
const Sonner = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster }))
);

const DeferredToasters = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => window.setTimeout(cb, 2000));
    const id = idle(() => setReady(true));
    return () => {
      const cancel = (window as any).cancelIdleCallback;
      if (cancel) cancel(id);
      else window.clearTimeout(id as number);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
  );
};

// Simple loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const PageTracker = () => {
  usePageTracking();
  return null;
};

const HashScroller = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const t = window.setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  return null;
};

const App = () => {
  // The intro overlay hides the real content, so it is shown only once per
  // session and for a short time — it directly delays LCP otherwise.
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return sessionStorage.getItem("fw-intro-seen") !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
      try {
        sessionStorage.setItem("fw-intro-seen", "1");
      } catch {
        /* ignore */
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <HashScroller />
      <PageTracker />
      <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <LazyMotion features={loadMotionFeatures}>
              <AnimatePresence mode="wait">
                {isLoading && <LoadingScreen key="loading" />}
              </AnimatePresence>
              <DeferredToasters />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/about/journey" element={<OurJourney />} />
                  <Route path="/about/board" element={<BoardMembers />} />
                  <Route path="/about/training-team" element={<TrainingTeam />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/packages/:id" element={<PackageDetail />} />
                  <Route path="/training-programs" element={<TrainingPrograms />} />
                  <Route path="/training-programs/:id" element={<TrainingProgramDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsPost />} />
                  <Route path="/graduates" element={<Graduates />} />
                  <Route path="/graduates/:id" element={<GraduateDetail />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/activities/:id" element={<ActivityDetail />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </LazyMotion>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
