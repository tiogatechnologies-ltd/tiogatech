import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  alt?: string;
}

const ImageLightbox = ({ images, startIndex = 0, onClose, alt = "" }: Props) => {
  const [idx, setIdx] = useState(startIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [images.length, onClose]);

  if (!images.length) return null;

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart == null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setIdx((i) => (i + 1) % images.length);
      else setIdx((i) => (i - 1 + images.length) % images.length);
    }
    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in p-4"
      onClick={onClose}
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        aria-label="Close image preview"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform active:scale-95"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        className="max-w-[92vw] max-h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[idx]}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-lg z-20">
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/90 font-mono font-semibold ml-1">{idx + 1}/{images.length}</span>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
