// my-app/components/SwipeableGallery.tsx
import { useSwipeable } from "react-swipeable";

interface SwipeableGalleryProps {
  images: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  closeGallery: () => void; // close when clicking outside
}

export default function SwipeableGallery({
  images,
  activeIndex,
  setActiveIndex,
  closeGallery,
}: SwipeableGalleryProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () =>
      setActiveIndex(Math.min(activeIndex + 1, images.length - 1)),
    onSwipedRight: () =>
      setActiveIndex(Math.max(activeIndex - 1, 0)),
    trackMouse: true, // allow swiping with mouse too
  });

return (
  <div
    {...handlers}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4"
    onClick={closeGallery}
  >
    {/* Close Button */}
    <button
      onClick={closeGallery}
      className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    {/* Navigation Arrows */}
    {images.length > 1 && (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((activeIndex - 1 + images.length) % images.length);
          }}
          className="absolute left-4 z-50 lg:left-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((activeIndex + 1) % images.length);
          }}
          className="absolute right-4 z-50 lg:right-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </>
    )}

    {/* Image Counter */}
    <div className="absolute top-6 left-6 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium">
      {activeIndex + 1} / {images.length}
    </div>

    {/* Main Image Container */}
    <div 
      className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={images[activeIndex]}
        alt={`Gallery image ${activeIndex + 1}`}
        className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transform transition-transform duration-500"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      />
    </div>

    {/* Thumbnail Strip - Desktop */}
    {images.length > 1 && (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hidden lg:flex gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(i);
            }}
            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer transform hover:scale-110 ${
              i === activeIndex 
                ? "border-[#d4b996] scale-110 shadow-lg" 
                : "border-white/30 hover:border-white/50"
            }`}
          >
            <img
              src={img}
              alt={`Thumbnail ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    )}

    {/* Dots Indicator - Mobile */}
    {images.length > 1 && (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 lg:hidden">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(i);
            }}
            className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex 
                ? "bg-[#d4b996] w-8 shadow-lg" 
                : "bg-white/50 w-3 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    )}

    {/* Keyboard Navigation Hints */}
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-sm hidden lg:block">
      ← → to navigate • Esc to close
    </div>
  </div>
);

}