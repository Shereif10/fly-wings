import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link, Link2Off, Quote,
  Image as ImageIcon, Upload, Loader2, Code2, Eye, Pilcrow,
  Youtube, Palette, Highlighter, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '@/lib/imageOptimize';
import { storage } from '@/lib/firebase';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  dir?: 'rtl' | 'ltr';
}

// Allowed tags/attributes when pasting or switching from HTML source
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'DIV', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SUB', 'SUP', 'FONT',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
  'A', 'IMG', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
  'CAPTION', 'COLGROUP', 'COL', 'FIGURE', 'FIGCAPTION',
  'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE', 'NAV', 'MAIN',
  'BUTTON', 'LABEL', 'SMALL', 'MARK', 'CODE', 'PRE', 'DL', 'DT', 'DD',
  'VIDEO', 'SOURCE', 'AUDIO', 'TIME', 'ABBR', 'IFRAME',
]);

// Attributes allowed on every tag (design / layout)
const GLOBAL_ATTRS = ['style', 'class', 'id', 'dir', 'align', 'title', 'lang', 'role'];

const ALLOWED_ATTRS: Record<string, string[]> = {
  A: ['href', 'target', 'rel', 'download'],
  IMG: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes'],
  VIDEO: ['src', 'controls', 'poster', 'width', 'height', 'autoplay', 'muted', 'loop', 'playsinline'],
  AUDIO: ['src', 'controls', 'loop'],
  SOURCE: ['src', 'type', 'srcset', 'media'],
  IFRAME: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy'],
  TABLE: ['width', 'height', 'border', 'cellpadding', 'cellspacing'],
  TD: ['colspan', 'rowspan', 'width', 'height', 'valign'],
  TH: ['colspan', 'rowspan', 'width', 'height', 'valign', 'scope'],
  COL: ['span', 'width'],
  COLGROUP: ['span'],
  FONT: ['color', 'face', 'size'],
  OL: ['start', 'type', 'reversed'],
  TIME: ['datetime'],
  ABBR: ['title'],
};

// Only these hosts may be embedded through an iframe
const IFRAME_HOSTS = [
  'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com',
  'youtu.be', 'player.vimeo.com', 'vimeo.com',
  'www.google.com', 'maps.google.com', 'google.com',
  'drive.google.com', 'docs.google.com',
  'w.soundcloud.com', 'open.spotify.com',
];

const isAllowedIframe = (src: string) => {
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol !== 'https:') return false;
    return IFRAME_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

const isSafeUrl = (value: string) => {
  const v = value.trim().toLowerCase();
  if (v.startsWith('javascript:') || v.startsWith('vbscript:')) return false;
  if (v.startsWith('data:') && !v.startsWith('data:image/')) return false;
  return true;
};

const sanitizeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, object, embed, form, input, textarea, select, meta, link, base').forEach((el) => el.remove());

  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      walk(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Unwrap unknown tags, keep their content
        const parent = child.parentNode;
        if (parent) {
          while (child.firstChild) parent.insertBefore(child.firstChild, child);
          parent.removeChild(child);
        }
        return;
      }
      if (child.tagName === 'IFRAME' && !isAllowedIframe(child.getAttribute('src') || '')) {
        child.remove();
        return;
      }
      const allowed = [...(ALLOWED_ATTRS[child.tagName] || []), ...GLOBAL_ATTRS];
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || !allowed.includes(name)) {
          child.removeAttribute(attr.name);
          return;
        }
        if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
          child.removeAttribute(attr.name);
        }
        if (name === 'style' && /expression\s*\(|javascript:/i.test(attr.value)) {
          child.removeAttribute(attr.name);
        }
      });
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
};

// Convert a share link into an embeddable URL when possible
const toEmbedUrl = (raw: string): string | null => {
  const url = raw.trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/^https:\/\//i.test(url) && isAllowedIframe(url)) return url;
  return null;
};


const RichTextEditor = ({ value, onChange, placeholder, minHeight = '200px', dir = 'rtl' }: RichTextEditorProps) => {
  const { t } = useLanguage();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [htmlSnippet, setHtmlSnippet] = useState('');
  const isInternalChange = useRef(false);
  const lastValue = useRef(value);

  // Only update content from props when value changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current && value !== lastValue.current) {
      editorRef.current.innerHTML = value;
      lastValue.current = value;
    }
    isInternalChange.current = false;
  }, [value]);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      lastValue.current = value;
    }
  }, []);

  const emit = useCallback((html: string) => {
    isInternalChange.current = true;
    lastValue.current = html;
    onChange(html);
  }, [onChange]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    }
  };

  const execCommand = useCallback((command: string, cmdValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, cmdValue);
    if (editorRef.current) emit(editorRef.current.innerHTML);
  }, [emit]);

  const handleInput = () => {
    if (editorRef.current) emit(editorRef.current.innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      document.execCommand('insertHTML', false, sanitizeHtml(html));
      if (editorRef.current) emit(editorRef.current.innerHTML);
    }
    // plain text paste keeps default browser behaviour
  };

  const insertLink = () => {
    if (!linkUrl || !isSafeUrl(linkUrl)) return;
    restoreSelection();
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && sel.toString().trim().length > 0;
    const safeUrl = linkUrl.replace(/"/g, '&quot;');
    const attrs = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    if (hasSelection) {
      const text = sel!.toString();
      document.execCommand('insertHTML', false, `<a href="${safeUrl}"${attrs}>${text}</a>`);
    } else {
      document.execCommand('insertHTML', false, `<a href="${safeUrl}"${attrs}>${linkUrl}</a>&nbsp;`);
    }
    if (editorRef.current) emit(editorRef.current.innerHTML);
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const insertEmbed = () => {
    const src = toEmbedUrl(embedUrl);
    if (!src) {
      toast.error(t('رابط غير مدعوم (يوتيوب، فيميو، خرائط جوجل)', 'Unsupported link (YouTube, Vimeo, Google Maps)'));
      return;
    }
    restoreSelection();
    document.execCommand(
      'insertHTML',
      false,
      `<div class="embed-responsive"><iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p><br/></p>`
    );
    if (editorRef.current) emit(editorRef.current.innerHTML);
    setEmbedUrl('');
    setShowEmbedInput(false);
  };

  const insertHtmlSnippet = () => {
    if (!htmlSnippet.trim()) return;
    restoreSelection();
    document.execCommand('insertHTML', false, sanitizeHtml(htmlSnippet));
    if (editorRef.current) emit(editorRef.current.innerHTML);
    setHtmlSnippet('');
    setShowHtmlInput(false);
  };

  const applyColor = (command: 'foreColor' | 'hiliteColor', color: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, color);
    if (editorRef.current) emit(editorRef.current.innerHTML);
  };


  const insertImage = (url: string, alt: string) => {
    if (!url) return;
    restoreSelection();
    const safeAlt = alt.replace(/"/g, '&quot;');
    document.execCommand('insertHTML', false, `<p><img src="${url}" alt="${safeAlt}" /></p><p><br/></p>`);
    if (editorRef.current) emit(editorRef.current.innerHTML);
    setImageUrl('');
    setImageAlt('');
    setShowImageInput(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('الرجاء اختيار ملف صورة', 'Please select an image file'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'Image must be smaller than 5MB'));
      return;
    }
    setUploading(true);
    try {
      const fileName = `blog/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, await optimizeImage(file));
      const url = await getDownloadURL(storageRef);
      insertImage(url, imageAlt || file.name.replace(/\.[^.]+$/, ''));
      toast.success(t('تم رفع الصورة بنجاح', 'Image uploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('فشل في رفع الصورة', 'Upload failed'));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSourceMode = () => {
    if (!sourceMode && editorRef.current) {
      lastValue.current = editorRef.current.innerHTML;
    }
    setSourceMode((prev) => !prev);
  };

  const handleSourceChange = (html: string) => {
    emit(html);
  };

  useEffect(() => {
    // When leaving source mode, push the (sanitized) HTML back into the editor
    if (!sourceMode && editorRef.current) {
      const clean = sanitizeHtml(value || '');
      editorRef.current.innerHTML = clean;
      if (clean !== value) emit(clean);
      else lastValue.current = clean;
    }
  }, [sourceMode]);

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 px-2 min-w-8 ${active ? 'bg-primary/20 text-primary' : ''}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolbarButton onClick={() => execCommand('bold')} title={t('عريض', 'Bold')}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title={t('مائل', 'Italic')}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title={t('تحته خط', 'Underline')}>
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} title={t('عنوان رئيسي H2', 'Heading 2')}>
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} title={t('عنوان فرعي H3', 'Heading 3')}>
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h4')} title={t('عنوان صغير H4', 'Heading 4')}>
          <span className="text-xs font-bold">H4</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} title={t('نص عادي', 'Paragraph')}>
          <Pilcrow className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title={t('قائمة نقطية', 'Bullet List')}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title={t('قائمة مرقمة', 'Numbered List')}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} title={t('اقتباس', 'Quote')}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => execCommand('justifyRight')} title={t('محاذاة لليمين', 'Align Right')}>
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyCenter')} title={t('توسيط', 'Center')}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyLeft')} title={t('محاذاة لليسار', 'Align Left')}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => { saveSelection(); setShowLinkInput(!showLinkInput); setShowImageInput(false); setShowEmbedInput(false); setShowHtmlInput(false); }}
          active={showLinkInput}
          title={t('رابط', 'Link')}
        >
          <Link className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('unlink')} title={t('إزالة الرابط', 'Remove link')}>
          <Link2Off className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => { saveSelection(); setShowImageInput(!showImageInput); setShowLinkInput(false); setShowEmbedInput(false); setShowHtmlInput(false); }}
          active={showImageInput}
          title={t('إدراج صورة', 'Insert Image')}
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => { saveSelection(); setShowEmbedInput(!showEmbedInput); setShowLinkInput(false); setShowImageInput(false); setShowHtmlInput(false); }}
          active={showEmbedInput}
          title={t('تضمين فيديو / خريطة', 'Embed video / map')}
        >
          <Youtube className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <label className="h-8 px-1 flex items-center gap-1 cursor-pointer" title={t('لون النص', 'Text color')}>
          <Palette className="w-4 h-4" />
          <input
            type="color"
            className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
            onMouseDown={saveSelection}
            onChange={(e) => applyColor('foreColor', e.target.value)}
          />
        </label>
        <label className="h-8 px-1 flex items-center gap-1 cursor-pointer" title={t('لون التظليل', 'Highlight color')}>
          <Highlighter className="w-4 h-4" />
          <input
            type="color"
            className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
            onMouseDown={saveSelection}
            onChange={(e) => applyColor('hiliteColor', e.target.value)}
          />
        </label>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => { saveSelection(); setShowHtmlInput(!showHtmlInput); setShowLinkInput(false); setShowImageInput(false); setShowEmbedInput(false); }}
          active={showHtmlInput}
          title={t('إدراج كود HTML', 'Insert HTML block')}
        >
          <FileCode className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleSourceMode} active={sourceMode} title={t('كود HTML', 'HTML source')}>
          {sourceMode ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
        </ToolbarButton>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/10">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            dir="ltr"
            className="h-8 px-2 text-sm border rounded bg-background flex-1 min-w-[160px]"
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
            {t('فتح في نافذة جديدة', 'Open in new tab')}
          </label>
          <Button type="button" size="sm" onClick={insertLink} className="h-8">
            {t('إدراج', 'Insert')}

          </Button>
        </div>
      )}

      {/* Image input */}
      {showImageInput && (
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/10">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t('رابط الصورة', 'Image URL')}
            dir="ltr"
            className="h-8 px-2 text-sm border rounded bg-background flex-1 min-w-[160px]"
            onKeyDown={(e) => e.key === 'Enter' && insertImage(imageUrl, imageAlt)}
          />
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder={t('النص البديل (للسيو)', 'Alt text (SEO)')}
            className="h-8 px-2 text-sm border rounded bg-background flex-1 min-w-[160px]"
          />
          <Button type="button" size="sm" className="h-8" onClick={() => insertImage(imageUrl, imageAlt)} disabled={!imageUrl}>
            {t('إدراج', 'Insert')}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {t('رفع صورة', 'Upload')}
          </Button>
        </div>
      )}

      {/* Embed input */}
      {showEmbedInput && (
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/10">
          <input
            type="url"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder={t('رابط يوتيوب / فيميو / خرائط جوجل', 'YouTube / Vimeo / Google Maps link')}
            dir="ltr"
            className="h-8 px-2 text-sm border rounded bg-background flex-1 min-w-[200px]"
            onKeyDown={(e) => e.key === 'Enter' && insertEmbed()}
          />
          <Button type="button" size="sm" className="h-8" onClick={insertEmbed} disabled={!embedUrl}>
            {t('إدراج', 'Insert')}
          </Button>
        </div>
      )}

      {/* HTML snippet input */}
      {showHtmlInput && (
        <div className="p-2 border-b bg-muted/10 space-y-2">
          <textarea
            value={htmlSnippet}
            onChange={(e) => setHtmlSnippet(e.target.value)}
            placeholder='<div style="background:#0f172a;padding:16px;border-radius:12px">...</div>'
            dir="ltr"
            spellCheck={false}
            className="w-full min-h-[110px] p-2 text-xs font-mono border rounded bg-background resize-y outline-none"
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" className="h-8" onClick={insertHtmlSnippet} disabled={!htmlSnippet.trim()}>
              {t('إدراج الكود', 'Insert HTML')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('يدعم التنسيقات والألوان والجداول والروابط', 'Supports styles, colors, tables and links')}
            </span>
          </div>
        </div>
      )}

      {/* Editor / Source */}

      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => handleSourceChange(e.target.value)}
          dir="ltr"
          spellCheck={false}
          className="w-full p-4 outline-none bg-background font-mono text-xs leading-relaxed resize-y"
          style={{ minHeight }}
          placeholder="<h2>...</h2>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          dir={dir}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          className="p-4 outline-none max-w-none overflow-auto"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [contenteditable] h2 {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 1.25rem 0 0.5rem;
        }
        [contenteditable] h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        [contenteditable] h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 0.5rem auto;
        }
        [contenteditable] ul { list-style: disc; }
        [contenteditable] ol { list-style: decimal; }
        [contenteditable] ul, [contenteditable] ol {
          padding-inline-start: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] blockquote {
          border-inline-start: 4px solid hsl(var(--primary));
          padding-inline-start: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        [contenteditable] a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        [contenteditable] table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        [contenteditable] th, [contenteditable] td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
        }
        [contenteditable] .embed-responsive {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          margin: 1rem 0;
        }
        [contenteditable] .embed-responsive iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: 0.75rem;
        }
        [contenteditable] iframe, [contenteditable] video {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
