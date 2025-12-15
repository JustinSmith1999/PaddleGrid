import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GalleryImage {
  id: string;
  image_url: string;
  image_type: string;
  caption: string | null;
  display_order: number;
}

interface PhotoGalleryProps {
  facilityId: string;
}

export function PhotoGallery({ facilityId }: PhotoGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadGallery();
  }, [facilityId]);

  const loadGallery = async () => {
    const { data } = await supabase
      .from('facility_gallery')
      .select('*')
      .eq('facility_id', facilityId)
      .order('display_order');

    if (data) {
      setImages(data);
    }
  };

  if (images.length === 0) return null;

  const displayImages = showAll ? images : images.slice(0, 6);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Photo Gallery</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{images.length} photos</p>
            </div>
          </div>
          {images.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              {showAll ? 'Show Less' : `See All ${images.length}`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => openLightbox(index)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group bg-slate-200 dark:bg-slate-700"
            >
              <img
                src={image.image_url}
                alt={image.caption || 'Gallery image'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {image.caption && (
                    <p className="text-white text-sm font-medium line-clamp-2">{image.caption}</p>
                  )}
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md text-white text-xs font-medium">
                {image.image_type}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedImage !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-6xl max-h-[90vh] mx-4">
            <img
              src={images[selectedImage].image_url}
              alt={images[selectedImage].caption || 'Gallery image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {images[selectedImage].caption && (
              <p className="text-white text-center mt-4 text-lg font-medium">
                {images[selectedImage].caption}
              </p>
            )}
            <p className="text-white/60 text-center mt-2 text-sm">
              {selectedImage + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
