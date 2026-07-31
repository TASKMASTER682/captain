'use client';

import React, { useMemo } from 'react';
import { Lightbulb, Quote } from 'lucide-react';

interface Option {
  key: string;
  text: string;
}

interface QuestionData {
  _id?: string;
  body?: string;
  context?: string;
  statements?: string[];
  matchPairs?: string[];
  subQ?: string;
  options?: Option[];
  correctAnswer?: string[];
  explanation?: string;
  type?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
  negativeMarks?: number;
}

interface Props {
  question: QuestionData;
  showExplanation?: boolean;
  showCorrectAnswer?: boolean;
  showMeta?: boolean;
  showOptions?: boolean;
  showHeader?: boolean;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'Numerical': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', label: 'Numerical' },
  'Data Sufficiency': { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', label: 'Data Sufficiency' },
  'Reasoning': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Reasoning' },
  'Conceptual': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Conceptual' },
  'Passage': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', label: 'Passage' },
  'Assertion Reason': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: 'Assertion-Reason' },
  'Match the Following': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Match' },
  'Multiple Correct': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', label: 'Multiple' },
  'Single Correct': { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400', label: 'Single' },
};

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const colors = TYPE_COLORS[type] || { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400', label: type };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
      {colors.label}
    </span>
  );
}

export default function QuestionRenderer({ question, showExplanation = false, showCorrectAnswer = false, showMeta = false, showOptions: displayOptions = true, showHeader = true }: Props) {
  const { body: rawBody, context, matchPairs, subQ, options, correctAnswer, explanation, type, subject, topic, difficulty, marks, negativeMarks } = question;
  const rawStatements = question.statements;

  const { displayBody, statements } = useMemo(() => {
    if (rawStatements && rawStatements.length > 0) {
      const lines = rawBody?.split('\n') || [];
      const stmtTexts = new Set(rawStatements.map(s => s.trim().toLowerCase()));
      const filtered = lines.filter(line => {
        const m = line.trim().match(/^\d+[.)]\s+(.+)/);
        return !(m && stmtTexts.has(m[1].trim().toLowerCase()));
      });
      return { statements: rawStatements, displayBody: filtered.join('\n').trim() };
    }
    if (rawBody) {
      const lines = rawBody.split('\n');
      const parsed: string[] = [];
      const remaining: string[] = [];
      for (const line of lines) {
        const m = line.trim().match(/^\d+[.)]\s+(.+)/);
        if (m) {
          parsed.push(m[1].trim());
        } else {
          remaining.push(line);
        }
      }
      if (parsed.length > 0) {
        return { statements: parsed, displayBody: remaining.join('\n').trim() };
      }
    }
    return { statements: undefined, displayBody: rawBody };
  }, [rawBody, rawStatements]);

  // Filter duplicated content out of displayBody (context, statements, matchPairs) so raw text doesn't duplicate the structured renderings
  const filteredBody = useMemo(() => {
    if (!displayBody) return displayBody;
    let body = displayBody;
    // Filter context if present
    if (context) {
      const ctxLines = context.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean);
      if (ctxLines.length > 0) {
        const lines = body.split('\n');
        const filtered = lines.filter(line => {
          const trimmed = line.trim().toLowerCase();
          return !ctxLines.some(ctx => trimmed === ctx || trimmed.startsWith(ctx));
        });
        body = filtered.join('\n').trim();
      }
    }
    if (!matchPairs || matchPairs.length === 0) return body;
    const pairTexts = new Set(matchPairs.map(p => {
      const parts = p.split(/:\s*/);
      return parts[0]?.trim().toLowerCase() || '';
    }));
    const lines = body.split('\n');
    const filtered = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Skip table header row
      if (/^#/.test(trimmed)) return false;
      const lower = trimmed.toLowerCase();
      // Check numbered lines like "1. Nagarahole National Park"
      const m = lower.match(/^\d+[.)]\s*(.+)$/);
      const content = m ? m[1].trim() : lower;
      // Check if this line matches any match pair left-side text
      if (pairTexts.has(content)) return false;
      // Also check lines with tab-separated content like "1\tNagarahole..."
      const tabParts = trimmed.split(/\t+/);
      if (tabParts.length >= 2) {
        const secondPart = tabParts[1]?.trim().toLowerCase();
        if (pairTexts.has(secondPart)) return false;
      }
      // Also check "left → right" or "left : right" format lines
      if (/→/.test(trimmed) || /:\s/.test(trimmed)) {
        const arrowParts = trimmed.split(/[→:]/);
        const leftSide = arrowParts[0]?.trim().toLowerCase();
        if (pairTexts.has(leftSide)) return false;
      }
      return true;
    });
    return filtered.join('\n').trim();
  }, [displayBody, matchPairs, context]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 space-y-5">
      {showHeader && <span className="sr-only">Question</span>}

      {/* Type badge + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <TypeBadge type={type} />
        {difficulty && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            {difficulty}
          </span>
        )}
      </div>

      {/* Context / Passage */}
      {context && (
        <div className="relative pl-5 border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-500/[0.04] to-transparent -mx-6 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Passage</span>
          </div>
          <div className="text-sm leading-[1.8] text-foreground/85 whitespace-pre-line">{context}</div>
        </div>
      )}

      {/* Question body */}
      {filteredBody && (
        <div className="text-base leading-[1.75] font-bold text-foreground whitespace-pre-line">
          {filteredBody}
        </div>
      )}

      {/* Statements */}
      {statements && statements.length > 0 && (
        <div className="relative pl-5 mx-8 py-4 space-y-3">
          <div className="absolute left-0 inset-y-0 w-[4px] rounded-full bg-gradient-to-b from-primary/70 via-primary/50 to-primary/30"></div>
          {statements.map((s, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
              <span className="text-sm leading-relaxed text-foreground/85 pt-0.5">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Match pairs */}
      {matchPairs && matchPairs.length > 0 && (
        <div className="overflow-hidden border-t border-border/40 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-amber-500/8 to-transparent border-b border-border/30">
                <th className="w-10 text-center py-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">#</th>
                <th className="text-left py-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">List I</th>
                <th className="w-10 text-center py-3"></th>
                <th className="text-left py-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">List II</th>
              </tr>
            </thead>
            <tbody>
              {matchPairs.map((pair, i) => {
                const parts = pair.split(/:(.+)/);
                const left = parts[0]?.trim() || '';
                const right = parts[1]?.trim() || '';
                return (
                  <tr key={i} className={`border-b border-border/10 last:border-b-0 transition-colors hover:bg-amber-500/[0.02] ${i % 2 === 0 ? 'bg-background/40' : 'bg-transparent'}`}>
                    <td className="text-center py-3 text-[11px] font-bold text-muted-foreground/30">{i + 1}</td>
                    <td className="py-3 pr-3 font-semibold text-foreground/90">{left}</td>
                    <td className="py-3 text-center text-muted-foreground/30 text-lg font-light">{right ? '→' : ''}</td>
                    <td className="py-3 pl-3 text-foreground/80">{right}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-question */}
      {statements && statements.length > 0 && subQ && (
        <div className="mx-8">
          <hr className="border-t border-primary/20" />
        </div>
      )}
      {subQ && (
        <div className="text-sm font-semibold italic text-foreground/80 leading-relaxed">
          {subQ}
        </div>
      )}

      {/* Options */}
      {displayOptions && options && options.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {options.map((opt) => {
            let showHighlight = false;
            if (showCorrectAnswer && correctAnswer) {
              showHighlight = correctAnswer.includes(opt.key);
            }
            return (
              <div
                key={opt.key}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                  showHighlight
                    ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.06] to-transparent shadow-sm shadow-emerald-500/5'
                    : 'border-border/60 bg-card hover:bg-card/80 hover:border-border'
                }`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                  showHighlight
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                    : 'bg-secondary text-secondary-foreground border-border/40'
                }`}>
                  {opt.key}
                </div>
                <span className={`text-sm leading-relaxed ${showHighlight ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-foreground/85'}`}>
                  {opt.text}
                </span>
                {showHighlight && (
                  <span className="ml-auto shrink-0 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Correct</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      {showExplanation && explanation && (
        <div className="pl-5 border-l-4 border-primary bg-gradient-to-r from-primary/[0.04] to-transparent -mx-6 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Explanation</span>
          </div>
          <p className="text-sm leading-[1.8] text-foreground/80 whitespace-pre-line">{explanation}</p>
        </div>
      )}

      {/* Meta */}
      {showMeta && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-4 border-t border-border/40">
          {subject && <span className="px-2.5 py-1 rounded-lg bg-secondary/80 font-semibold text-secondary-foreground/80">{subject}</span>}
          {topic && <span className="px-2.5 py-1 rounded-lg bg-secondary/50 text-secondary-foreground/70">{topic}</span>}
          {marks !== undefined && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 font-semibold">+{marks}</span>}
          {negativeMarks !== undefined && negativeMarks > 0 && <span className="px-2.5 py-1 rounded-lg bg-rose-500/8 text-rose-600 dark:text-rose-400 font-semibold">-{negativeMarks}</span>}
        </div>
      )}
    </div>
  );
}
