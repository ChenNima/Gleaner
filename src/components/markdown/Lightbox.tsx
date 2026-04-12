import { useState, type ReactNode } from 'react';
import YARLightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

interface LightboxProps {
  children: ReactNode;
  /** Image source URL for YARL's native image slide with zoom + pan. */
  src?: string;
}

/**
 * Wraps children with a click-to-open full-screen lightbox overlay.
 * Pass `src` for native image zoom/pan support via YARL's Zoom plugin.
 */
export function Lightbox({ children, src }: LightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        className="cursor-zoom-in inline-block"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
      >
        {children}
      </span>

      <YARLightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: src ?? '' }]}
        plugins={[Zoom]}
        zoom={{
          scrollToZoom: true,
          maxZoomPixelRatio: 5,
        }}
        carousel={{ finite: true }}
        controller={{ closeOnBackdropClick: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />
    </>
  );
}
