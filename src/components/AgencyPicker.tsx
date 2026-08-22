'use client';

import React, { useEffect, useState } from 'react';
import { Building2, ChevronDown, X, Check } from 'lucide-react';
import { useExploreAgency } from '@/components/AgencyContext';

export default function AgencyPicker() {
  const { agencies, selectedId, select } = useExploreAgency();
  const [open, setOpen] = useState(false);
  const selected = agencies.find((a: any) => a._id === selectedId) || null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Choose an agency to explore its exams"
        aria-haspopup="dialog"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-colors max-w-[180px] sm:max-w-[240px]"
      >
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </span>
        <span className="flex flex-col items-start leading-tight min-w-0 text-left">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Agency</span>
          <span className="text-sm font-bold font-outfit truncate w-full">
            {selected ? (selected.code || selected.name) : 'Select Agency'}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose an agency">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold font-outfit flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Choose an Agency
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Explore exams from any agency — your saved preferences stay unchanged.</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {agencies.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No agencies available yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {agencies.map((a: any) => {
                    const isSelected = a._id === selectedId;
                    return (
                      <button
                        key={a._id}
                        onClick={() => {
                          select(a._id);
                          setOpen(false);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:border-primary/50 hover:bg-muted/30 ${
                          isSelected ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <Building2 className="w-4 h-4" />
                        </span>
                        <span className="flex flex-col min-w-0 leading-tight">
                          <span className="font-bold text-sm truncate">{a.code || a.name}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
