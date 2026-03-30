"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownAnswerCitation = {
  title: string;
  url?: string;
};

export type MarkdownAnswerProps = {
  answer: string;
  citations: MarkdownAnswerCitation[];
};

type MermaidBlockProps = {
  code: string;
};

function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const renderResult = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(renderResult.svg);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) {
          setSvg("");
          setError(cause instanceof Error ? cause.message : "Không thể render Mermaid.");
        }
      }
    }

    void renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        Lỗi Mermaid: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
        Đang dựng sơ đồ Mermaid...
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function normalizeAnswer(answer: string): string {
  return answer.replace(/\r\n/g, "\n").trim();
}

export default function MarkdownAnswer({ answer, citations }: MarkdownAnswerProps) {
  const normalized = useMemo(() => normalizeAnswer(answer), [answer]);
  const citationMap = useMemo(
    () =>
      citations.reduce<Record<string, MarkdownAnswerCitation>>((acc, item, index) => {
        acc[String(index + 1)] = item;
        return acc;
      }, {}),
    [citations]
  );

  if (!normalized) {
    return null;
  }

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-p:leading-7 prose-li:leading-7 prose-headings:tracking-tight">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const text =
              Array.isArray(children) && typeof children[0] === "string" ? children[0] : "";
            const citationMatch = text.match(/^\[(\d+)\]$/);
            const citation = citationMatch ? citationMap[citationMatch[1]] : undefined;
            const resolvedHref = href || citation?.url || "#";
            const external = resolvedHref.startsWith("http://") || resolvedHref.startsWith("https://");
            return (
              <a
                {...props}
                href={resolvedHref}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                title={citation?.title}
              >
                {children}
              </a>
            );
          },
          code: ({ className, children, ...props }) => {
            const code = String(children).replace(/\n$/, "");
            const language = className?.replace("language-", "").trim().toLowerCase();
            const inline = !className;

            if (!inline && language === "mermaid") {
              return <MermaidBlock code={code} />;
            }

            if (inline) {
              return (
                <code
                  {...props}
                  className="rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-100"
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3 text-slate-100 dark:border-slate-700">
                <code {...props} className={className}>
                  {code}
                </code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold dark:border-slate-600 dark:bg-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-300 px-2 py-1 align-top dark:border-slate-700">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky-400 bg-sky-50/60 px-3 py-2 text-slate-700 dark:bg-sky-950/20 dark:text-slate-200">
              {children}
            </blockquote>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
