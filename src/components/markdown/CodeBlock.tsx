import { useState, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}

/** Wraps <pre> elements with a copy button and language label. */
export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const { t } = useTranslation();

  // Extract language from child <code> className like "hljs language-ts"
  let language = '';
  if (children && typeof children === 'object' && 'props' in (children as any)) {
    const codeProps = (children as any).props;
    const codeClass: string = codeProps?.className ?? '';
    const match = codeClass.match(/language-(\S+)/);
    if (match) language = match[1];
  }

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: noop
    }
  };

  return (
    <div className="relative group max-w-full">
      <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {language && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground backdrop-blur-sm">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-background/60 text-muted-foreground hover:text-foreground backdrop-blur-sm"
          title={t('md.copyCode')}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre ref={preRef} className={className} {...rest}>
        {children}
      </pre>
    </div>
  );
}
