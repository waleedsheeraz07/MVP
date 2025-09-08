// my-app/components/SwipeableGallery.tsx:
import { useSwipeable } from "react-swipeable";

interface SwipeableGalleryProps {
  images: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  closeGallery: () => void; // function to close gallery
}

export default function SwipeableGallery({
  images,
  activeIndex,
  setActiveIndex,
  closeGallery,
}: SwipeableGalleryProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveIndex(Math.min(activeIndex + 1, images.length - 1)),
    onSwipedRight: () => setActiveIndex(Math.max(activeIndex - 1, 0)),
    trackMouse: true, // allows swiping with mouse
  });

  return (
    <div
      {...handlers}
      className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-md z-50 p-4"
      onClick={closeGallery} // click anywhere outside image closes
    >
      <img
        src={images[activeIndex]}
        alt={`Gallery ${activeIndex}`}
        className="max-h-full max-w-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image
      />

      {/* Carousel Dots */}
      <div className="absolute bottom-8 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation(); // prevent closing
              setActiveIndex(i);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-white w-4" : "bg-gray-400 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}