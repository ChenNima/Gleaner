import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface LightboxProps {
  children: ReactNode;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 0.002;

/**
 * Wraps children with a click-to-open full-screen lightbox overlay.
 * Supports wheel zoom, pointer drag, pinch-to-zoom, and double-click/tap reset.
 */
export function Lightbox({ children }: LightboxProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Drag/pinch state as refs to avoid stale closures in native event handlers
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const startPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerOnBackdropRef = useRef(false);
  const pinchDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      resetTransform();
      // Cleanup listeners if dialog closes
      cleanupRef.current?.();
      cleanupRef.current = null;
    }
  }, [open, resetTransform]);

  // Ref callback: attaches native event listeners when the zoomable container mounts
  const containerRefCallback = useCallback((el: HTMLDivElement | null) => {
    // Cleanup previous listeners
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!el) return;
    const node = el;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      e.stopPropagation();
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s - e.deltaY * ZOOM_SENSITIVITY * s)));
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      // Only close on click if pointerdown started on the backdrop (container itself), not on content
      pointerOnBackdropRef.current = e.target === node;
      node.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDraggingRef.current || !lastPointerRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }

    function onPointerUp(e: PointerEvent) {
      // If pointer barely moved AND started on backdrop (not on content), close
      if (startPointerRef.current && pointerOnBackdropRef.current) {
        const dx = Math.abs(e.clientX - startPointerRef.current.x);
        const dy = Math.abs(e.clientY - startPointerRef.current.y);
        if (dx < 5 && dy < 5) {
          setOpen(false);
        }
      }
      isDraggingRef.current = false;
      lastPointerRef.current = null;
      startPointerRef.current = null;
      try { node.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }

    function onDblClick() {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDistRef.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
        lastTapRef.current = now;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchDistRef.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = dist / pinchDistRef.current;
        pinchDistRef.current = dist;
        setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta)));
      }
    }

    function onTouchEnd() {
      pinchDistRef.current = null;
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('dblclick', onDblClick);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    cleanupRef.current = () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('dblclick', onDblClick);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <span
          className="cursor-zoom-in inline-block"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
        >
          {children}
        </span>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          onClick={(e) => e.stopPropagation()}
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">Lightbox</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Full-screen media viewer. Use scroll to zoom, drag to pan. Press Escape to close.
          </DialogPrimitive.Description>

          {/* Close button */}
          <DialogPrimitive.Close
            className="absolute top-4 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          {/* Zoomable container — native event listeners via ref callback */}
          <div
            ref={containerRefCallback}
            className="flex items-center justify-center w-full h-full select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <div
              className="will-change-transform"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              }}
            >
              <div className="max-w-[90vw] max-h-[90vh] [&_img]:max-w-[90vw] [&_img]:max-h-[90vh] [&_img]:object-contain [&_svg]:max-w-[90vw] [&_svg]:max-h-[90vh] [&_.mermaid-diagram]:bg-white [&_.mermaid-diagram]:dark:bg-zinc-900 [&_.mermaid-diagram]:rounded-lg [&_.mermaid-diagram]:p-4">
                {children}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
