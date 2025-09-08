import { useSwipeable } from "react-swipeable";

interface SwipeableGalleryProps {
  images: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}

export default function SwipeableGallery({ images, activeIndex, setActiveIndex }: SwipeableGalleryProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveIndex(Math.min(activeIndex + 1, images.length - 1)),
    onSwipedRight: () => setActiveIndex(Math.max(activeIndex - 1, 0)),
    trackMouse: true, // allows swiping with mouse too
  });

  return (
    <div {...handlers} className="w-full h-full flex items-center justify-center relative">
      <img
        src={images[activeIndex]}
        alt={`Gallery ${activeIndex}`}
        className="max-h-full max-w-full object-contain rounded-lg"
      />
    </div>
  );
}