import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import { loadMathJax } from '../../lib/mathjax';

interface MathBlockProps {
  code: string;
}

export function MathBlock({ code }: MathBlockProps) {
  const { t } = useTranslation();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(null);
      setSvg(null);

      try {
        const mj = await loadMathJax();
        const result = mj.tex2svg(code, true);

        if (!cancelled) {
          setSvg(result);
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
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t('md.mathLoading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="not-prose">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-destructive bg-destructive/10 rounded-t-md border border-b-0 border-destructive/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{t('md.mathError')}</span>
        </div>
        <pre className="!mt-0 rounded-t-none overflow-x-auto bg-zinc-100 dark:bg-zinc-900 p-4 text-sm border border-t-0 border-destructive/20 rounded-b-md"><code>{code}</code></pre>
      </div>
    );
  }

  // MathJax tex2svg produces sanitized SVG — safe to insert
  return (
    <div
      className="math-display flex justify-center py-2 text-foreground overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
