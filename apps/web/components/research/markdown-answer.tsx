import type { ReactNode } from "react";

export type MarkdownAnswerCitation = {
  title: string;
  url?: string;
};

export type MarkdownAnswerProps = {
  answer: string;
  citations: MarkdownAnswerCitation[];
};

type MarkdownBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseMarkdownBlocks(answer: string): MarkdownBlock[] {
  const lines = answer.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    const merged = paragraphBuffer.join(" ").trim();
    if (merged) {
      blocks.push({ type: "paragraph", text: merged });
    }
    paragraphBuffer = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,2})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: headingMatch[1] === "#" ? "h1" : "h2",
        text: headingMatch[2].trim()
      });
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();

      const items = [listMatch[1].trim()];
      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();
        const nextListMatch = nextLine.match(/^[-*]\s+(.+)$/);
        if (!nextListMatch) {
          break;
        }

        items.push(nextListMatch[1].trim());
        index += 1;
      }

      blocks.push({ type: "list", items });
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

function renderInlineMarkdown(text: string, citations: MarkdownAnswerCitation[], keyPrefix: string): ReactNode[] {
  const tokenRegex = /(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\[(\d+)\])|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const start = match.index;
    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    const tokenKey = `${keyPrefix}-${tokenIndex}`;

    if (match[1]) {
      nodes.push(
        <code
          key={tokenKey}
          className="rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-100"
        >
          {match[2]}
        </code>
      );
    } else if (match[3]) {
      nodes.push(
        <a
          key={tokenKey}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
        >
          {match[4]}
        </a>
      );
    } else if (match[6]) {
      const citationNumber = Number(match[7]);
      const citation = citations[citationNumber - 1];
      const href = citation?.url ?? `#citation-${citationNumber}`;
      const isExternal = Boolean(citation?.url);

      nodes.push(
        <a
          key={tokenKey}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          title={citation?.title ?? `Citation ${citationNumber}`}
          className="ml-0.5 inline-flex items-center rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[0.82em] font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-100"
        >
          [{citationNumber}]
        </a>
      );
    } else if (match[8]) {
      nodes.push(
        <strong key={tokenKey} className="font-semibold text-[var(--text-primary)]">
          {renderInlineMarkdown(match[9], citations, `${tokenKey}-strong`)}
        </strong>
      );
    } else if (match[10]) {
      nodes.push(
        <em key={tokenKey} className="italic">
          {renderInlineMarkdown(match[11], citations, `${tokenKey}-italic`)}
        </em>
      );
    }

    cursor = tokenRegex.lastIndex;
    tokenIndex += 1;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

export default function MarkdownAnswer({ answer, citations }: MarkdownAnswerProps) {
  const blocks = parseMarkdownBlocks(answer);

  if (!answer.trim()) {
    return null;
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
      {blocks.map((block, blockIndex) => {
        if (block.type === "h1") {
          return (
            <h1 key={`block-${blockIndex}`} className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {renderInlineMarkdown(block.text, citations, `h1-${blockIndex}`)}
            </h1>
          );
        }

        if (block.type === "h2") {
          return (
            <h2 key={`block-${blockIndex}`} className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {renderInlineMarkdown(block.text, citations, `h2-${blockIndex}`)}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={`block-${blockIndex}`} className="list-disc space-y-1 pl-5 marker:text-[var(--text-muted)]">
              {block.items.map((item, itemIndex) => (
                <li key={`block-${blockIndex}-item-${itemIndex}`}>
                  {renderInlineMarkdown(item, citations, `li-${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`}>
            {renderInlineMarkdown(block.text, citations, `p-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}
