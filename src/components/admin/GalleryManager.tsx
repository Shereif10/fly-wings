import { useState, useEffect, useRef } from 'react';
import { m as motion } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon, Video, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, doc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { db, storage } from '@/lib/firebase';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  titleAr: string;
  titleEn: string;
  createdAt: string;
  storagePath?: string;
  thumbnailPath?: string;
}

const GalleryManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [formData, setFormData] = useState({ titleAr: '', titleEn: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (type === 'main') {
      setSelectedFile(file);
      setPreviewUrl(url);
    } else {
      setSelectedThumbnail(file);
      setThumbnailPreviewUrl(url);
    }
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      toast({ title: t('يرجى اختيار ملف', 'Please select a file'), variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const mainPath = `gallery/${activeTab}s/${timestamp}_${selectedFile.name}`;
      const mainRef = ref(storage, mainPath);
      
      await uploadBytes(mainRef, await optimizeImage(selectedFile));
      const mainUrl = await getDownloadURL(mainRef);

      let thumbnailUrl = mainUrl;
      let thumbnailPath = '';
      
      if (activeTab === 'video' && selectedThumbnail) {
        thumbnailPath = `gallery/thumbnails/${timestamp}_${selectedThumbnail.name}`;
        const thumbnailRef = ref(storage, thumbnailPath);
        await uploadBytes(thumbnailRef, await optimizeImage(selectedThumbnail));
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      await addDoc(collection(db, 'gallery'), {
        type: activeTab,
        url: mainUrl,
        thumbnail: thumbnailUrl,
        titleAr: formData.titleAr,
        titleEn: formData.titleEn,
        createdAt: new Date().toISOString(),
        storagePath: mainPath,
        thumbnailPath: thumbnailPath,
      });

      toast({ title: t('تمت الإضافة بنجاح', 'Added successfully') });
      resetForm();
      fetchGallery();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: t('خطأ في الرفع', 'Upload error'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setFormData({ titleAr: '', titleEn: '' });
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    
    try {
      // Delete from storage if path exists
      if (item.storagePath) {
        try {
          await deleteObject(ref(storage, item.storagePath));
        } catch (e) {
          console.log('Storage file not found or already deleted');
        }
      }
      if (item.thumbnailPath) {
        try {
          await deleteObject(ref(storage, item.thumbnailPath));
        } catch (e) {
          console.log('Thumbnail not found or already deleted');
        }
      }
      
      await deleteDoc(doc(db, 'gallery', item.id));
      toast({ title: t('تم الحذف', 'Deleted') });
      fetchGallery();
    } catch (error) {
      toast({ title: t('خطأ', 'Error'), variant: 'destructive' });
    }
  };

  const images = items.filter(i => i.type === 'image');
  const videos = items.filter(i => i.type === 'video');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('المعرض', 'Gallery')}</h1>
          <p className="text-muted-foreground">{t('إدارة الصور والفيديوهات', 'Manage images and videos')}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('إضافة', 'Add New')}
        </Button>
      </div>

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="mb-6">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="group relative aspect-video rounded-2xl overflow-hidden bg-muted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <img src={item.url} alt={item.titleAr} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm truncate">{item.titleAr}</p>
                  </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="group relative aspect-video rounded-2xl overflow-hidden bg-muted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <img src={item.thumbnail || item.url} alt={item.titleAr} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm truncate">{item.titleAr}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('إضافة إلى المعرض', 'Add to Gallery')}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video')}>
            <TabsList className="w-full">
              <TabsTrigger value="image" className="flex-1 gap-2">
                <ImageIcon className="w-4 h-4" />
                {t('صورة', 'Image')}
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1 gap-2">
                <Video className="w-4 h-4" />
                {t('فيديو', 'Video')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 py-4">
            {/* Main File Upload */}
            <div>
              <Label className="mb-2 block">
                {activeTab === 'image' ? t('اختر صورة', 'Select Image') : t('اختر فيديو', 'Select Video')}
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                onChange={(e) => handleFileSelect(e, 'main')}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  {activeTab === 'image' ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={previewUrl} className="w-full h-full object-cover" controls />
                  )}
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t('اضغط لاختيار ملف', 'Click to select file')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeTab === 'image' ? 'JPG, PNG, GIF' : 'MP4, WebM, MOV'}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail for Videos */}
            {activeTab === 'video' && (
              <div>
                <Label className="mb-2 block">{t('صورة مصغرة للفيديو', 'Video Thumbnail')}</Label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'thumbnail')}
                  className="hidden"
                />
                
                {thumbnailPreviewUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img src={thumbnailPreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setSelectedThumbnail(null); setThumbnailPreviewUrl(null); if(thumbnailInputRef.current) thumbnailInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('اختر صورة مصغرة', 'Select thumbnail image')}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                <Input value={formData.titleAr} onChange={e => setFormData({...formData, titleAr: e.target.value})} />
              </div>
              <div>
                <Label>{t('العنوان (إنجليزي)', 'Title (English)')}</Label>
                <Input value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('جاري الرفع...', 'Uploading...')}
                </>
              ) : (
                t('إضافة', 'Add')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManager;
