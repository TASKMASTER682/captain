'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function RichText({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="rich-text prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5" {...props} />,
          li: ({ node, ...props }) => <li className="my-0.5 leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="my-1.5 leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-bold my-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-1.5" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
