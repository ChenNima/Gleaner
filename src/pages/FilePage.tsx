import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { MdFile } from '../db';
import { getFileContent } from '../lib/github';
import { resolveWikilink, extractWikilinks } from '../lib/wikilink-parser';
import { useAppStore } from '../stores/app';
import { MarkdownViewer } from '../components/MarkdownViewer';

export default function FilePage() {
  const { owner, name, '*': filePath } = useParams();
  const navigate = useNavigate();
  const setCurrentFileId = useAppStore((s) => s.setCurrentFileId);
  const [file, setFile] = useState<MdFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedLinks, setResolvedLinks] = useState<Map<string, boolean>>(new Map());

  const repoFullName = `${owner}/${name}`;
  const fileId = filePath ? `${repoFullName}::${filePath}` : null;

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    setCurrentFileId(fileId);
    setLoading(true);

    (async () => {
      let f = await db.files.get(fileId);

      // If file exists but content not cached, fetch it
      if (f && f.content === null && owner && name && filePath) {
        try {
          const content = await getFileContent(owner, name, filePath);
          await db.files.update(fileId, {
            content,
            backlinkContext: content.slice(0, 100),
          });
          f = await db.files.get(fileId);
        } catch {
          // Show file without content
        }
      }

      setFile(f ?? null);

      // Resolve wikilinks for styling
      if (f?.content) {
        const targets = extractWikilinks(f.content);
        const resolved = new Map<string, boolean>();
        for (const target of targets) {
          const result = await resolveWikilink(target, repoFullName);
          resolved.set(target.toLowerCase(), result !== null);
        }
        setResolvedLinks(resolved);
      }

      setLoading(false);
    })();

    return () => setCurrentFileId(null);
  }, [fileId, owner, name, filePath]);

  const handleWikilinkClick = async (target: string) => {
    const resolved = await resolveWikilink(target, repoFullName);
    if (resolved) {
      const [rOwner, rRepo] = resolved.repoFullName.split('/');
      navigate(`/repo/${rOwner}/${rRepo}/${resolved.path}`);
    }
  };

  return (
    <MarkdownViewer
      file={file}
      loading={loading}
      resolvedLinks={resolvedLinks}
      onWikilinkClick={handleWikilinkClick}
    />
  );
}
