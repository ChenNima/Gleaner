import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMathJax } from '../../lib/mathjax';

interface InlineMathProps {
  code: string;
}

export function InlineMath({ code }: InlineMathProps) {
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
        const result = mj.tex2svg(code, false);

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
    return <span className="text-muted-foreground text-xs">...</span>;
  }

  if (error) {
    return (
      <code className="text-destructive" title={t('md.mathError')}>
        {code}
      </code>
    );
  }

  // MathJax tex2svg produces sanitized SVG — safe to insert
  return (
    <span
      className="math-inline inline-flex items-baseline text-foreground max-w-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
