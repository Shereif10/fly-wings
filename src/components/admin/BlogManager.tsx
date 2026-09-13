import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';
import RichTextEditor from './RichTextEditor';
import SeoFields from './SeoFields';
import { slugify } from '@/lib/content';

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
  imagePath?: string;
  authorAr: string;
  authorEn: string;
  published: boolean;
  slug?: string;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  createdAt: string;
  updatedAt: string;
}

const BlogList = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(t('هل أنت متأكد؟', 'Are you sure?'))) return;
    try {
      if (post.imagePath) {
        try {
          await deleteObject(ref(storage, post.imagePath));
        } catch (e) {
          console.log('Image not found or already deleted');
        }
      }
      await deleteDoc(doc(db, 'blog_posts', post.id));
      toast({ title: t('تم الحذف', 'Deleted') });
      fetchPosts();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const togglePublished = async (post: BlogPost) => {
    await setDoc(doc(db, 'blog_posts', post.id), { published: !post.published, updatedAt: new Date().toISOString() }, { merge: true });
    fetchPosts();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('المدونة', 'Blog')}</h1>
          <p className="text-muted-foreground">{t('إدارة المقالات والأخبار', 'Manage articles and news')}</p>
        </div>
        <Button onClick={() => navigate('/admin/blog/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('مقال جديد', 'New Post')}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            className={`bg-card rounded-xl border shadow-soft overflow-hidden ${!post.published ? 'opacity-60' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {post.image ? (
                <img src={post.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white/50" />
                </div>
              )}
            </div>
            
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{post.categoryAr}</span>
                {!post.published && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t('مسودة', 'Draft')}</span>}
              </div>
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">{post.titleAr}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.excerptAr}</p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(post.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
              
              <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePublished(post)}>
                  {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(post)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="col-span-full bg-card rounded-xl p-8 text-center text-muted-foreground border">
            {t('لا توجد مقالات', 'No posts yet')}
          </div>
        )}
      </div>
    </div>
  );
};

const BlogEditor = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    titleAr: '', titleEn: '', excerptAr: '', excerptEn: '',
    contentAr: '', contentEn: '', categoryAr: 'نصائح', categoryEn: 'Tips',
    image: '', imagePath: '', authorAr: 'فريق أجنحة الطيران', authorEn: 'Fly Wings Team', published: false,
    slug: '', metaTitleAr: '', metaTitleEn: '', metaDescriptionAr: '', metaDescriptionEn: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      const fetchPost = async () => {
        try {
          const docRef = doc(db, 'blog_posts', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              titleAr: data.titleAr || '',
              titleEn: data.titleEn || '',
              excerptAr: data.excerptAr || '',
              excerptEn: data.excerptEn || '',
              contentAr: data.contentAr || '',
              contentEn: data.contentEn || '',
              categoryAr: data.categoryAr || 'نصائح',
              categoryEn: data.categoryEn || 'Tips',
              image: data.image || '',
              imagePath: data.imagePath || '',
              authorAr: data.authorAr || 'فريق أجنحة الطيران',
              authorEn: data.authorEn || 'Fly Wings Team',
              published: data.published || false,
              slug: data.slug || '',
              metaTitleAr: data.metaTitleAr || '',
              metaTitleEn: data.metaTitleEn || '',
              metaDescriptionAr: data.metaDescriptionAr || '',
              metaDescriptionEn: data.metaDescriptionEn || '',
            });
            if (data.image) {
              setPreviewUrl(data.image);
            }
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, isEditing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = formData.image;
      let imagePath = formData.imagePath;

      // Upload new image if selected
      if (selectedFile) {
        setUploading(true);
        const timestamp = Date.now();
        const path = `blog/${timestamp}_${selectedFile.name}`;
        const imageRef = ref(storage, path);
        await uploadBytes(imageRef, await optimizeImage(selectedFile));
        imageUrl = await getDownloadURL(imageRef);
        imagePath = path;
        setUploading(false);
      }

      const slug = formData.slug || slugify(formData.titleEn || formData.titleAr) || `post-${Date.now()}`;

      const data = {
        ...formData,
        slug,
        image: imageUrl,
        imagePath: imagePath,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && id) {
        await setDoc(doc(db, 'blog_posts', id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'blog_posts'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      
      toast({ title: t('تم الحفظ', 'Saved successfully') });
      navigate('/admin/blog');
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? t('تعديل المقال', 'Edit Post') : t('مقال جديد', 'New Post')}
          </h1>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border shadow-soft space-y-6">
        {/* Image Upload */}
        <div>
          <Label className="mb-2 block">{t('صورة المقال', 'Post Image')}</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {previewUrl ? (
            <div className="relative aspect-video max-w-md rounded-xl overflow-hidden bg-muted">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFormData({...formData, image: '', imagePath: ''}); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors max-w-md"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('اضغط لاختيار صورة', 'Click to select image')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
            <Input value={formData.titleAr} onChange={e => setFormData({...formData, titleAr: e.target.value})} />
          </div>
          <div>
            <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
            <Input value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{t('المقتطف (عربي)', 'Excerpt (Arabic)')}</Label>
            <Textarea rows={2} value={formData.excerptAr} onChange={e => setFormData({...formData, excerptAr: e.target.value})} />
          </div>
          <div>
            <Label>{t('المقتطف (إنجليزي)', 'Excerpt (English)')}</Label>
            <Textarea rows={2} value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">{t('المحتوى (عربي)', 'Content (Arabic)')}</Label>
            <RichTextEditor
              value={formData.contentAr}
              onChange={(val) => setFormData({...formData, contentAr: val})}
              placeholder={t('اكتب محتوى المقال هنا...', 'Write your content here...')}
              dir="rtl"
              minHeight="250px"
            />
          </div>
          <div>
            <Label className="mb-2 block">{t('المحتوى (إنجليزي)', 'Content (English)')}</Label>
            <RichTextEditor
              value={formData.contentEn}
              onChange={(val) => setFormData({...formData, contentEn: val})}
              placeholder={t('اكتب محتوى المقال هنا...', 'Write your content here...')}
              dir="ltr"
              minHeight="250px"
            />
          </div>
        </div>

        <SeoFields
          basePath="blog"
          titleForSlug={formData.titleEn || formData.titleAr}
          fallbackTitle={formData.titleAr || formData.titleEn}
          values={{
            slug: formData.slug,
            metaTitleAr: formData.metaTitleAr,
            metaTitleEn: formData.metaTitleEn,
            metaDescriptionAr: formData.metaDescriptionAr,
            metaDescriptionEn: formData.metaDescriptionEn,
          }}
          onChange={(patch) => setFormData({ ...formData, ...patch })}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{t('التصنيف (عربي)', 'Category (Arabic)')}</Label>
            <Select value={formData.categoryAr} onValueChange={v => setFormData({...formData, categoryAr: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="نصائح">نصائح</SelectItem>
                <SelectItem value="أخبار">أخبار</SelectItem>
                <SelectItem value="تعليم">تعليم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('التصنيف (إنجليزي)', 'Category (English)')}</Label>
            <Select value={formData.categoryEn} onValueChange={v => setFormData({...formData, categoryEn: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Tips">Tips</SelectItem>
                <SelectItem value="News">News</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{t('الكاتب (عربي)', 'Author (Arabic)')}</Label>
            <Input value={formData.authorAr} onChange={e => setFormData({...formData, authorAr: e.target.value})} />
          </div>
          <div>
            <Label>{t('الكاتب (إنجليزي)', 'Author (English)')}</Label>
            <Input value={formData.authorEn} onChange={e => setFormData({...formData, authorEn: e.target.value})} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={formData.published} onCheckedChange={v => setFormData({...formData, published: v})} />
          <Label>{t('نشر المقال', 'Publish Post')}</Label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/blog')}>{t('إلغاء', 'Cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving || uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {uploading ? t('جاري الرفع...', 'Uploading...') : t('جاري الحفظ...', 'Saving...')}
              </>
            ) : (
              t('حفظ', 'Save')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const BlogManager = () => {
  return (
    <Routes>
      <Route index element={<BlogList />} />
      <Route path="new" element={<BlogEditor />} />
      <Route path="edit/:id" element={<BlogEditor />} />
    </Routes>
  );
};

export default BlogManager;
