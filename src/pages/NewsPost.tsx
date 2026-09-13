import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureHtml, stripHtml, localeUrl, SITE_URL } from '@/lib/content';

interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  imageUrl: string;
  date: string;
  category: string;
  featured: boolean;
  published: boolean;
  slug?: string;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
}

const NewsPost = () => {
  const { id } = useParams<{ id: string }>();
  const { t, direction, language } = useLanguage();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) return;
      
      try {
        let found: NewsItem | null = null;
        const bySlug = await getDocs(query(collection(db, 'news'), where('slug', '==', id), limit(1)));
        if (!bySlug.empty) {
          found = { id: bySlug.docs[0].id, ...bySlug.docs[0].data() } as NewsItem;
        } else {
          const docSnap = await getDoc(doc(db, 'news', id));
          if (docSnap.exists()) found = { id: docSnap.id, ...docSnap.data() } as NewsItem;
        }
        if (found) setNews(found);

        // Fetch related news
        const relatedQuery = query(
          collection(db, 'news'),
          where('published', '==', true),
          orderBy('date', 'desc'),
          limit(3)
        );
        const relatedSnap = await getDocs(relatedQuery);
        const related = relatedSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as NewsItem))
          .filter(n => n.id !== id && n.slug !== id);
        setRelatedNews(related.slice(0, 2));
      } catch (error) {
        console.error('Error fetching news:', error);
      }
      setLoading(false);
    };

    fetchNews();

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!news) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('الخبر غير موجود', 'News not found')}</h1>
          <Link to="/news">
            <Button>{t('العودة للأخبار', 'Back to News')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const metaTitle = t(news.metaTitleAr || '', news.metaTitleEn || '') || t(news.titleAr, news.titleEn);
  const metaDescription =
    t(news.metaDescriptionAr || '', news.metaDescriptionEn || '') ||
    t(news.excerptAr, news.excerptEn) ||
    stripHtml(t(news.contentAr, news.contentEn), 155);
  const canonical = localeUrl(`/news/${news.slug || news.id}`, language);
  const arUrl = localeUrl(`/news/${news.slug || news.id}`, 'ar');
  const enUrl = localeUrl(`/news/${news.slug || news.id}`, 'en');

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="ar" href={arUrl} />
        <link rel="alternate" hrefLang="en" href={enUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={news.imageUrl || `${SITE_URL}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={news.imageUrl || `${SITE_URL}/logo.png`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: metaTitle,
            description: metaDescription,
            image: news.imageUrl || `${SITE_URL}/logo.png`,
            datePublished: news.date,
            dateModified: news.date,
            publisher: {
              '@type': 'Organization',
              name: t('أجنحة الطيران', 'Fly Wings'),
              logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
            inLanguage: language,
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t('الرئيسية', 'Home'), item: localeUrl('/', language) },
              { '@type': 'ListItem', position: 2, name: t('الأخبار', 'News'), item: localeUrl('/news', language) },
              { '@type': 'ListItem', position: 3, name: metaTitle, item: canonical },
            ],
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative bg-aviation-navy overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={news.imageUrl}
            alt={t(news.titleAr, news.titleEn)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aviation-navy via-aviation-navy/70 to-aviation-navy/40" />
        </div>

        <div className="container mx-auto px-4 py-24 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-end gap-2 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white">
              <Link to="/" className="hover:text-white/80">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/news" className="hover:text-white/80">{t('الأخبار', 'News')}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium">{t('تفاصيل الخبر', 'News Details')}</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium mb-6">
              {news.category || t('الأخبار', 'News')}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t(news.titleAr, news.titleEn)}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(news.date)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => {
                  navigator.share?.({
                    title: t(news.titleAr, news.titleEn),
                    url: window.location.href,
                  });
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('مشاركة', 'Share')}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[80px]" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Excerpt */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xl text-muted-foreground mb-8 text-right leading-relaxed"
            >
              {t(news.excerptAr, news.excerptEn)}
            </motion.p>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-xl prose-img:w-full text-start article-content"
              dir={direction}
              dangerouslySetInnerHTML={{ __html: ensureHtml(t(news.contentAr, news.contentEn)) }}
            />


            {/* Share Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 pt-8 border-t border-border"
            >
              <div className="flex items-center justify-between">
                <Link to="/news">
                  <Button variant="outline" className="gap-2 rounded-full">
                    {direction === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    {t('العودة للأخبار', 'Back to News')}
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    navigator.share?.({
                      title: t(news.titleAr, news.titleEn),
                      url: window.location.href,
                    });
                  }}
                  className="gap-2 rounded-full"
                >
                  <Share2 className="w-4 h-4" />
                  {t('مشاركة الخبر', 'Share News')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-right">
              {t('أخبار ذات صلة', 'Related News')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/news/${item.slug || item.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all group">
                      <div className="relative overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={t(item.titleAr, item.titleEn)}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-4 end-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div className="p-6 text-right">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {t(item.titleAr, item.titleEn)}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default NewsPost;
