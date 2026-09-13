import { useState, useEffect, useRef } from 'react';
import { m as motion, useInView } from 'framer-motion';
import { Play, X, Image as ImageIcon, Video, Plane, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageSeo from '@/components/seo/PageSeo';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  titleAr: string;
  titleEn: string;
}

const Gallery = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const images = items.filter(i => i.type === 'image');
  const videos = items.filter(i => i.type === 'video');

  return (
    <Layout>
      <PageSeo
        pageKey="gallery"
        path="/gallery"
        defaultTitleAr={'المعرض — أجنحة الطيران'}
        defaultTitleEn={'Gallery — Fly Wings'}
        defaultDescriptionAr={'صور ولقطات من أكاديمية أجنحة الطيران.'}
        defaultDescriptionEn={'Photos and moments from Fly Wings Academy.'}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-aviation-navy overflow-hidden min-h-[50vh] pt-24">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Animated Floating Planes */}
        <motion.div
          className="absolute top-24 left-[10%]"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane className="w-12 h-12 text-white/20 rotate-45" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-[15%]"
          animate={{ 
            y: [0, 15, 0],
            x: [0, -15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Plane className="w-16 h-16 text-secondary/30 -rotate-12" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-32 left-[20%]"
          animate={{ 
            y: [0, 25, 0],
            x: [0, 20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Plane className="w-10 h-10 text-white/15 rotate-[30deg]" />
        </motion.div>

        <motion.div
          className="absolute top-[60%] right-[8%]"
          animate={{ 
            y: [0, -18, 0],
            x: [0, 12, 0],
            rotate: [0, -8, 0]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        >
          <Plane className="w-14 h-14 text-secondary/25 rotate-[60deg]" />
        </motion.div>

        {/* Glowing Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/20 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/20 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-white transition-colors">
                {t('الرئيسية', 'Home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-white/50" />
              <span className="font-medium text-white">{t('المعرض', 'Gallery')}</span>
            </div>
          </motion.div>

          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-4 h-4 text-secondary" />
              </motion.div>
              <span className="text-white/90 text-sm font-medium">{t('لحظات مميزة', 'Special Moments')}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ x: [0, -10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-8 h-8 text-secondary rotate-[225deg]" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {t('معرض الصور والفيديو', 'Photo & Video Gallery')}
              </h1>
              <motion.div
                animate={{ x: [0, 10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Plane className="w-8 h-8 text-secondary rotate-[-45deg]" />
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              {t('شاهد أجمل اللحظات من رحلات التدريب', 'Watch the best moments from our training journeys')}
            </motion.p>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plane className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plane className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              </motion.div>
              <p className="text-lg">{t('لا توجد صور أو فيديوهات حالياً', 'No images or videos available')}</p>
            </div>
          ) : (
            <Tabs defaultValue="images" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="images" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('الصور', 'Images')} ({images.length})
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                  <Video className="w-4 h-4" />
                  {t('الفيديوهات', 'Videos')} ({videos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images">
                {images.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('لا توجد صور', 'No images yet')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedImage(item.url)}
                      >
                        <img
                          src={item.url}
                          alt={t(item.titleAr, item.titleEn)}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="videos">
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('لا توجد فيديوهات', 'No videos yet')}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video, index) => (
                      <motion.div
                        key={video.id}
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-shadow"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <img
                          src={video.thumbnail || video.url}
                          alt={t(video.titleAr, video.titleEn)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-primary-foreground fill-current" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 start-4 end-4 text-white font-medium">
                          {t(video.titleAr, video.titleEn)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedImage && (
            <img src={selectedImage} alt="Gallery" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute -top-12 end-0 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedVideo && (
            <div className="aspect-video w-full">
              <video
                src={selectedVideo.url}
                className="w-full h-full"
                width={1280}
                height={720}
                controls
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Gallery;
