'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

type Segment =
  | { type: 'text'; value: string }
  | { type: 'block'; value: string }
  | { type: 'inline'; value: string };

// Split text into plain-text and math segments. Supports:
//   $$ ... $$  (block math)   and   \( ... \)  (inline math)
function splitSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  let i = 0;
  const text = input;

  while (i < text.length) {
    if (text.startsWith('$$', i)) {
      const end = text.indexOf('$$', i + 2);
      if (end !== -1) {
        if (i > cursor) segments.push({ type: 'text', value: text.slice(cursor, i) });
        segments.push({ type: 'block', value: text.slice(i + 2, end) });
        cursor = end + 2;
        i = end + 2;
        continue;
      }
    }
    if (text.startsWith('\\(', i)) {
      const end = text.indexOf('\\)', i + 2);
      if (end !== -1) {
        if (i > cursor) segments.push({ type: 'text', value: text.slice(cursor, i) });
        segments.push({ type: 'inline', value: text.slice(i + 2, end) });
        cursor = end + 2;
        i = end + 2;
        continue;
      }
    }
    i += 1;
  }
  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }
  return segments;
}

export function MathText({ text }: { text: string }) {
  const segments = useMemo(() => splitSegments(text), [text]);

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={idx} className="whitespace-pre-line">{seg.value}</span>;
        }
        try {
          const html = katex.renderToString(seg.value, {
            throwOnError: false,
            displayMode: seg.type === 'block',
            output: 'html',
          });
          if (seg.type === 'block') {
            return (
              <div
                key={idx}
                className="my-2 overflow-x-auto py-1 text-base"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return <span key={idx} className="px-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={idx} className="whitespace-pre-line">{seg.value}</span>;
        }
      })}
    </>
  );
}
