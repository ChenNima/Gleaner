import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useThemeStore } from '../../stores/theme';
import { Lightbox } from './Lightbox';

interface MermaidBlockProps {
  code: string;
}

let mermaidPromise: Promise<typeof import('mermaid')> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid');
  }
  return mermaidPromise;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerId = useId().replace(/:/g, '_');
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const { t } = useTranslation();

  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pngUrl, setPngUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(null);
      setSvg(null);
      setPngUrl('');

      try {
        const mermaid = (await loadMermaid()).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          // Override dark theme pie colors to avoid near-black slices blending with background
          ...(theme === 'dark' && {
            themeVariables: {
              pie1: '#6366f1',
              pie2: '#a78bfa',
              pie3: '#f472b6',
              pie4: '#fb923c',
              pie5: '#34d399',
              pie6: '#38bdf8',
              pie7: '#facc15',
              pie8: '#f87171',
            },
          }),
          suppressErrorRendering: true,
        });

        const { svg: rendered } = await mermaid.render(
          `mermaid-${containerId}`,
          code,
        );

        if (!cancelled) {
          setSvg(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code, theme, containerId]);

  // Convert rendered Mermaid SVG DOM to PNG for lightbox (YARL Zoom needs <img>).
  // Mermaid SVGs contain <foreignObject> which browsers block in <img> tags,
  // so we rasterize via html-to-image which reads the rendered DOM directly.
  const generatePng = useCallback(() => {
    const el = containerRef.current;
    if (!el || pngUrl) return;

    import('html-to-image').then(({ toPng }) => {
      const bgColor = theme === 'dark' ? '#18181b' : '#ffffff';
      toPng(el, { backgroundColor: bgColor, pixelRatio: 3 })
        .then((dataUrl) => setPngUrl(dataUrl))
        .catch(() => { /* fallback: lightbox opens with empty src */ });
    });
  }, [theme, pngUrl]);

  // Generate PNG once after SVG renders into the DOM
  useEffect(() => {
    if (svg && containerRef.current) {
      // Small delay to ensure Mermaid SVG is fully painted
      const timer = setTimeout(generatePng, 100);
      return () => clearTimeout(timer);
    }
  }, [svg, generatePng]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t('md.mermaidLoading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="not-prose">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-destructive bg-destructive/10 rounded-t-md border border-b-0 border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{t('md.mermaidError')}</span>
        </div>
        <pre className="!mt-0 rounded-t-none overflow-x-auto bg-zinc-100 dark:bg-zinc-900 p-4 text-sm border border-t-0 border-destructive/20 rounded-b-md"><code>{code}</code></pre>
      </div>
    );
  }

  // mermaid.render() produces sanitized SVG — safe to insert
  return (
    <Lightbox src={pngUrl}>
      <div
        ref={containerRef}
        className="mermaid-diagram flex justify-center py-2"
        dangerouslySetInnerHTML={{ __html: svg! }}
      />
    </Lightbox>
  );
}
