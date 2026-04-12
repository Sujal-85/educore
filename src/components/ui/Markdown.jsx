import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { useAppStore } from '../../store/useAppStore';

export default function Markdown({ children, className }) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      "prose prose-sm max-w-none leading-relaxed",
      theme !== 'light' && "prose-invert",
      className
    )}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-border shadow-sm">
              <table className="w-full border-collapse text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-elevated/50 border-b border-border">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-primary/5 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-text-secondary border-t border-border/50">
              {children}
            </td>
          ),
          // Style other elements if needed
          h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-4 text-text-primary">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3 text-text-primary">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2 text-text-primary">{children}</h3>,
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
