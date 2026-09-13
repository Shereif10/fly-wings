import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Partner {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  websiteUrl: string;
  order: number;
  published: boolean;
}

const PartnersSection = () => {
  const { t, direction } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        // Fetch without orderBy to avoid index requirement, then sort client-side
        const snapshot = await getDocs(collection(db, 'partners'));
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Partner))
          .filter(p => p.published !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setPartners(data);
        console.log('Partners fetched:', data.length);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (partners.length <= 4) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [partners.length]);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <section data-reveal className="py-16 bg-background relative overflow-hidden is-visible">
      {/* Decorative paper planes pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-10">
        <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
          {[...Array(8)].map((_, i) => (
            <g key={i} transform={`translate(${i * 180}, ${(i % 2) * 20})`}>
              <path
                d="M0 60L30 45L60 60L30 50Z"
                fill="hsl(var(--primary))"
                opacity="0.3"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {t('شركاء النجاح', 'Success Partners')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('نعمل سويًا ويجمعنا الشغف تجاه الطيران', 'We work together, united by our passion for aviation')}
          </p>
        </div>

        {/* Partners Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {partners.length > 4 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute start-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full hover:bg-background"
                onClick={() => scroll(direction === 'rtl' ? 'right' : 'left')}
              >
                {direction === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute end-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg rounded-full hover:bg-background"
                onClick={() => scroll(direction === 'rtl' ? 'left' : 'right')}
              >
                {direction === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </Button>
            </>
          )}

          {/* Partners Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-8 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {partners.map((partner, index) => (
              <div
                key={partner.id}
                className="flex-shrink-0 snap-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <PartnerCard partner={partner} t={t} />
                  </a>
                ) : (
                  <PartnerCard partner={partner} t={t} />
                )}
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          {partners.length > 4 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(Math.ceil(partners.length / 4))].map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === 0 ? 'bg-foreground w-4' : 'bg-muted-foreground/30'
                  }`}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({
                        left: i * scrollContainerRef.current.clientWidth,
                        behavior: 'smooth',
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const PartnerCard = ({ partner, t }: { partner: Partner; t: (ar: string, en: string) => string }) => (
  <div className="w-48 md:w-56 h-48 md:h-56 bg-aviation-navy rounded-2xl flex flex-col items-center justify-center p-6 transition-all hover:scale-105 hover:shadow-lg group cursor-pointer">
    {partner.logoUrl ? (
      <img
        src={partner.logoUrl}
        alt={partner.nameEn}
        className="max-w-full max-h-24 object-contain filter brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all"
      />
    ) : (
      <span className="text-4xl font-bold text-white">{partner.nameEn.charAt(0)}</span>
    )}
    <p className="mt-3 text-xs text-white/70 text-center line-clamp-2">
      {t(partner.nameAr, partner.nameEn)}
    </p>
  </div>
);

export default PartnersSection;
