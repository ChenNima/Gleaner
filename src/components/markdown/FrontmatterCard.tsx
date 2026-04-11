import { useMemo } from 'react';
import { ExternalLink, Calendar, Tag, FileText } from 'lucide-react';

interface FrontmatterCardProps {
  meta: Record<string, unknown>;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

const TITLE_KEYS = new Set(['title', 'name']);
const DATE_KEYS = new Set(['created', 'date', 'modified', 'updated', 'published']);
const TAG_KEYS = new Set(['tags', 'categories', 'keywords']);
const URL_KEYS = new Set(['url', 'link', 'source_url', 'href']);
const HIDDEN_KEYS = new Set(['draft', 'layout', 'template', 'permalink', 'slug']);

function getKeyIcon(key: string) {
  const k = key.toLowerCase();
  if (DATE_KEYS.has(k)) return <Calendar className="h-3 w-3" />;
  if (TAG_KEYS.has(k)) return <Tag className="h-3 w-3" />;
  if (URL_KEYS.has(k)) return <ExternalLink className="h-3 w-3" />;
  return <FileText className="h-3 w-3" />;
}

export function FrontmatterCard({ meta }: FrontmatterCardProps) {
  const { title, fields } = useMemo(() => {
    let title: string | null = null;
    const fields: { key: string; value: unknown }[] = [];

    for (const [key, value] of Object.entries(meta)) {
      if (value === null || value === undefined) continue;
      const k = key.toLowerCase();
      if (HIDDEN_KEYS.has(k)) continue;
      if (TITLE_KEYS.has(k) && typeof value === 'string') {
        title = value;
        continue;
      }
      fields.push({ key, value });
    }

    return { title, fields };
  }, [meta]);

  if (fields.length === 0 && !title) return null;

  return (
    <div className="not-prose mb-6 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
      {title && (
        <div className="px-4 pt-3.5 pb-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground leading-snug">
            {title}
          </h1>
        </div>
      )}
      {fields.length > 0 && (
        <div className="px-4 py-2.5 space-y-1.5">
          {fields.map(({ key, value }) => {
            const k = key.toLowerCase();
            const isTags = TAG_KEYS.has(k);
            const isUrl = URL_KEYS.has(k);
            const tags = isTags
              ? (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((s: string) => s.trim()) : [value])
              : null;

            return (
              <div key={key} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className="flex items-center gap-1 text-muted-foreground shrink-0 min-w-[80px] pt-px">
                  {getKeyIcon(key)}
                  <span className="opacity-80">{key}</span>
                </span>
                <span className="text-foreground/85">
                  {tags ? (
                    <span className="flex flex-wrap gap-1">
                      {tags.map((tag: unknown, i: number) => (
                        <span
                          key={i}
                          className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium tracking-wide"
                        >
                          {String(tag)}
                        </span>
                      ))}
                    </span>
                  ) : isUrl && typeof value === 'string' ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    formatValue(value)
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
