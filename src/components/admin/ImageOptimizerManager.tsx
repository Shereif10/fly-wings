import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { optimizeImage } from '@/lib/imageOptimize';
import { clearDocCache } from '@/lib/firestoreCache';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ImageDown, Loader2, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

/** Firestore collections and the fields that hold image URLs. */
const TARGETS: { collection: string; fields: string[]; arrayFields?: string[] }[] = [
  { collection: 'blog_posts', fields: ['image'] },
  { collection: 'news', fields: ['imageUrl'] },
  { collection: 'gallery', fields: ['url', 'thumbnail'] },
  { collection: 'partners', fields: ['logoUrl'] },
  { collection: 'graduates', fields: ['imageUrl'] },
  { collection: 'board_members', fields: ['imageUrl'] },
  { collection: 'training_team', fields: ['imageUrl'] },
  { collection: 'training_programs', fields: ['imageUrl'] },
  { collection: 'services', fields: ['imageUrl'] },
  { collection: 'packages', fields: ['imageUrl'] },
  { collection: 'activities', fields: ['imageUrl', 'coverUrl'], arrayFields: ['images'] },
  { collection: 'journey_milestones', fields: ['imageUrl'] },
];

type Status = 'optimized' | 'skipped' | 'failed';

interface ResultRow {
  collection: string;
  id: string;
  field: string;
  status: Status;
  before?: number;
  after?: number;
  note?: string;
}

const isHttpImage = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^https?:\/\//.test(value) &&
  !/\.(svg|mp4|webm|ogg|ogv|mov|m4v)(\?|$)/i.test(value);

const kb = (bytes = 0) => `${Math.round(bytes / 1024)} KB`;

const detectImageType = async (blob: Blob): Promise<string | null> => {
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
};

const ImageOptimizerManager = () => {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);

  const fetchImageBlob = async (url: string): Promise<Blob> => {
    let directError = '';
    try {
      const direct = await fetch(url, { mode: 'cors' });
      if (!direct.ok) throw new Error(`HTTP ${direct.status}`);
      return await direct.blob();
    } catch (error) {
      directError = error instanceof Error ? error.message : 'direct download failed';
    }

    // Use the configured Cloud client so the function request always carries the
    // correct project URL and access headers, including on the published domain.
    const { data, error } = await supabase.functions.invoke('image-proxy', {
      body: { url },
    });

    if (error) {
      throw new Error(`proxy failed (${error.message}); direct: ${directError}`);
    }
    if (!(data instanceof Blob)) {
      throw new Error(`proxy returned invalid image data; direct: ${directError}`);
    }
    const imageType = await detectImageType(data);
    if (!imageType) {
      throw new Error(`proxy did not return an image; direct: ${directError}`);
    }
    return new Blob([data], { type: imageType });
  };

  const processUrl = async (url: string, key: string) => {
    const blob = await fetchImageBlob(url);
    if (!blob.type.startsWith('image/')) throw new Error('not an image');

    const original = new File([blob], `${key}.img`, { type: blob.type });
    const optimized = await optimizeImage(original);
    if (optimized === original || optimized.size >= blob.size * 0.95) {
      return { url, before: blob.size, after: blob.size, changed: false };
    }

    const path = `optimized/${key}-${Date.now()}.webp`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, optimized, { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' });
    const newUrl = await getDownloadURL(storageRef);
    return { url: newUrl, before: blob.size, after: optimized.size, changed: true };
  };


  const run = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);
    const rows: ResultRow[] = [];

    try {
      for (let t = 0; t < TARGETS.length; t++) {
        const target = TARGETS[t];
        setCurrent(target.collection);
        let snapshot;
        try {
          snapshot = await getDocs(collection(db, target.collection));
        } catch {
          setProgress(Math.round(((t + 1) / TARGETS.length) * 100));
          continue;
        }

        for (const document of snapshot.docs) {
          const data = document.data() as Record<string, unknown>;
          const updates: Record<string, unknown> = {};

          for (const field of target.fields) {
            const value = data[field];
            if (!isHttpImage(value)) continue;
            try {
              const out = await processUrl(value, `${target.collection}-${document.id}-${field}`);
              if (out.changed) updates[field] = out.url;
              rows.push({
                collection: target.collection,
                id: document.id,
                field,
                status: out.changed ? 'optimized' : 'skipped',
                before: out.before,
                after: out.after,
                note: out.changed ? undefined : ar ? 'محسّنة بالفعل' : 'already optimized',
              });
            } catch (error) {
              rows.push({
                collection: target.collection,
                id: document.id,
                field,
                status: 'failed',
                note: error instanceof Error ? error.message : 'error',
              });
            }
          }

          for (const field of target.arrayFields ?? []) {
            const list = data[field];
            if (!Array.isArray(list)) continue;
            const next = [...list];
            let touched = false;
            for (let i = 0; i < next.length; i++) {
              const value = next[i];
              if (!isHttpImage(value)) continue;
              try {
                const out = await processUrl(value, `${target.collection}-${document.id}-${field}-${i}`);
                if (out.changed) {
                  next[i] = out.url;
                  touched = true;
                }
                rows.push({
                  collection: target.collection,
                  id: document.id,
                  field: `${field}[${i}]`,
                  status: out.changed ? 'optimized' : 'skipped',
                  before: out.before,
                  after: out.after,
                });
              } catch (error) {
                rows.push({
                  collection: target.collection,
                  id: document.id,
                  field: `${field}[${i}]`,
                  status: 'failed',
                  note: error instanceof Error ? error.message : 'error',
                });
              }
            }
            if (touched) updates[field] = next;
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, target.collection, document.id), updates);
          }
        }

        setResults([...rows]);
        setProgress(Math.round(((t + 1) / TARGETS.length) * 100));
      }

      clearDocCache();
      toast.success(ar ? 'تمت إعادة معالجة الصور' : 'Images reprocessed');
    } catch (error) {
      toast.error(ar ? 'حدث خطأ أثناء المعالجة' : 'Processing error');
      console.error(error);
    } finally {
      setCurrent('');
      setRunning(false);
      setResults([...rows]);
    }
  };

  const optimized = results.filter((r) => r.status === 'optimized');
  const saved = optimized.reduce((sum, r) => sum + ((r.before ?? 0) - (r.after ?? 0)), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageDown className="w-5 h-5" />
            {ar ? 'تحسين الصور القديمة' : 'Optimize existing images'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {ar
              ? 'تفحص هذه الأداة صور المدونة والأخبار والمعرض والشركاء وباقي الأقسام، وتضغطها وتحوّلها إلى WebP ثم تحدّث الروابط تلقائيًا. اترك الصفحة مفتوحة حتى تنتهي.'
              : 'Scans blog, news, gallery, partners and other sections, compresses each image to WebP and updates the stored links. Keep this page open until it finishes.'}
          </p>

          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ImageDown className="w-4 h-4 me-2" />}
            {running
              ? ar ? `جارٍ المعالجة… ${current}` : `Processing… ${current}`
              : ar ? 'ابدأ إعادة المعالجة' : 'Start reprocessing'}
          </Button>

          {(running || results.length > 0) && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  {ar ? 'محسّنة' : 'Optimized'}: {optimized.length}
                </Badge>
                <Badge variant="secondary">
                  {ar ? 'بدون تغيير' : 'Unchanged'}: {results.filter((r) => r.status === 'skipped').length}
                </Badge>
                <Badge variant="secondary">
                  {ar ? 'فشلت' : 'Failed'}: {results.filter((r) => r.status === 'failed').length}
                </Badge>
                <Badge>
                  {ar ? 'الحجم الموفَّر' : 'Saved'}: {kb(saved)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{ar ? 'التفاصيل' : 'Details'}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto space-y-2">
            {results.map((row, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {row.status === 'optimized' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                  {row.status === 'skipped' && <MinusCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  {row.status === 'failed' && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <span className="truncate">
                    {row.collection} · {row.field}
                  </span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {row.status === 'optimized'
                    ? `${kb(row.before)} → ${kb(row.after)}`
                    : row.note || '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageOptimizerManager;
