import { useState, useEffect } from 'react';
import { cachedDoc } from '@/lib/firestoreCache';

const defaultImage = "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1974";

export const useHeroImage = (pageKey: string) => {
  const [heroImage, setHeroImage] = useState(defaultImage);

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const data = await cachedDoc('site_settings', 'general');
        if (data) {
          const fieldKey = `heroImage${pageKey}`;
          if (data[fieldKey]) {
            setHeroImage(data[fieldKey]);
          } else if (data.planeImageUrl) {
            setHeroImage(data.planeImageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching hero image:', error);
      }
    };
    fetchHeroImage();
  }, [pageKey]);

  return heroImage;
};
