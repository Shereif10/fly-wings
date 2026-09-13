import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureHtml, stripHtml, localeUrl, SITE_URL } from '@/lib/content';

interface BlogPost {
  id: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  categoryAr: string;
  categoryEn: string;
  image: string;
  slug?: string;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  authorAr: string;
  authorEn: string;
  published: boolean;
  createdAt: string;
}

const BlogPost = () => {
  const { id } = useParams();
  const { t, language, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowRight : ArrowLeft;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        // Look up by slug first, fall back to the document id (old links)
        let found: BlogPost | null = null;
        const bySlug = await getDocs(query(collection(db, 'blog_posts'), where('slug', '==', id), limit(1)));
        if (!bySlug.empty) {
          found = { id: bySlug.docs[0].id, ...bySlug.docs[0].data() } as BlogPost;
        } else {
          const docSnap = await getDoc(doc(db, 'blog_posts', id));
          if (docSnap.exists()) found = { id: docSnap.id, ...docSnap.data() } as BlogPost;
        }

        if (found) {
          setPost(found);
          
          // Fetch related posts
          const q = query(
            collection(db, 'blog_posts'),
            where('published', '==', true),
            orderBy('createdAt', 'desc'),
            limit(4)
          );
          const snapshot = await getDocs(q);
          setRelatedPosts(
            snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
              .filter(p => p.id !== found!.id)
              .slice(0, 3)
          );
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('المقال غير موجود', 'Article not found')}</h1>
          <Link to="/blog">
            <Button>{t('العودة للمدونة', 'Back to Blog')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const metaTitle = t(post.metaTitleAr || '', post.metaTitleEn || '') || t(post.titleAr, post.titleEn);
  const metaDescription =
    t(post.metaDescriptionAr || '', post.metaDescriptionEn || '') ||
    t(post.excerptAr, post.excerptEn) ||
    stripHtml(t(post.contentAr, post.contentEn), 155);
  const canonical = localeUrl(`/blog/${post.slug || post.id}`, language);
  const arUrl = localeUrl(`/blog/${post.slug || post.id}`, 'ar');
  const enUrl = localeUrl(`/blog/${post.slug || post.id}`, 'en');

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
        <meta property="og:image" content={post.image || `${SITE_URL}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={post.image || `${SITE_URL}/logo.png`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: metaTitle,
            description: metaDescription,
            image: post.image || `${SITE_URL}/logo.png`,
            datePublished: post.createdAt,
            dateModified: post.createdAt,
            author: { '@type': 'Person', name: t(post.authorAr, post.authorEn) },
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
              { '@type': 'ListItem', position: 2, name: t('المدونة', 'Blog'), item: localeUrl('/blog', language) },
              { '@type': 'ListItem', position: 3, name: metaTitle, item: canonical },
            ],
          })}
        </script>
      </Helmet>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] pt-20">
        <div className="absolute inset-0">
          {post.image ? (
            <img
              src={post.image}
              alt={t(post.titleAr, post.titleEn)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        </div>
        
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link 
                to="/blog"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <Arrow className="w-4 h-4" />
                {t('العودة للمدونة', 'Back to Blog')}
              </Link>
              
              <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm mb-4">
                {t(post.categoryAr, post.categoryEn)}
              </span>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl">
                {t(post.titleAr, post.titleEn)}
              </h1>
              
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{t(post.authorAr, post.authorEn)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span dir="ltr">
                    {new Date(post.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.article
            dir={direction}
            className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:font-bold prose-img:rounded-xl prose-img:w-full text-start article-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            dangerouslySetInnerHTML={{ 
              __html: ensureHtml(t(post.contentAr, post.contentEn)) 
            }}
          />
        </div>
      </section>


      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">
              {t('مقالات ذات صلة', 'Related Articles')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  to={`/blog/${relatedPost.slug || relatedPost.id}`}
                  className="group"
                >
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden bg-muted">
                      {relatedPost.image ? (
                        <img
                          src={relatedPost.image}
                          alt={t(relatedPost.titleAr, relatedPost.titleEn)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {t(relatedPost.titleAr, relatedPost.titleEn)}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPost;
