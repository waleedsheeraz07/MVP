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
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-lg p-4"
      onClick={closeGallery} // close if clicked outside image
    >
      {/* Main Image */}
      <img
        src={images[activeIndex]}
        alt={`Gallery ${activeIndex}`}
        className="max-h-full max-w-full object-contain rounded-lg border-4 border-[#5a4436] shadow-2xl"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking image
      />

      {/* Dots */}
      <div className="absolute bottom-8 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation(); // don’t close gallery when clicking dots
              setActiveIndex(i);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-[#5a4436] w-4" : "bg-gray-400 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}