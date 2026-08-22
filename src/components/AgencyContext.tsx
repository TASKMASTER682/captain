'use client';

// Explore-only agency selection. Deliberately separate from the user's saved
// preferences (/auth/preferences) — picking an agency here just switches what
// the UI shows so users can browse other exams without mutating their profile.
//
// Readers that live OUTSIDE this provider's tree (e.g. pages rendered before
// the layout mounts, or across bundle boundaries) must NOT rely on React
// context — they subscribe to the window event + localStorage instead, which
// are true singletons regardless of how many module instances exist.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export const EXPLORE_AGENCY_STORAGE_KEY = 'examos-explore-agency-id';
export const EXPLORE_AGENCY_CHANGED_EVENT = 'examos:explore-agency-changed';

interface AgencyCtxValue {
  agencies: any[];
  selectedId: string | null;
  select: (id: string | null) => void;
}

const AgencyCtx = createContext<AgencyCtxValue>({
  agencies: [],
  selectedId: null,
  select: () => {},
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const asId = (v: any): string | null => {
  if (!v) return null;
  return typeof v === 'string' ? v : v._id || null;
};

// Safe singleton read — works from any module instance.
export function getStoredExploreAgencyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(EXPLORE_AGENCY_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function persistExploreAgencyId(id: string | null) {
  try {
    if (id) localStorage.setItem(EXPLORE_AGENCY_STORAGE_KEY, id);
    else localStorage.removeItem(EXPLORE_AGENCY_STORAGE_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EXPLORE_AGENCY_CHANGED_EVENT, { detail: id }));
  }
}

export function AgencyProvider({ user, children }: { user?: any; children: React.ReactNode }) {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [storedId, setStoredId] = useState<string | null>(() => getStoredExploreAgencyId());

  useEffect(() => {
    let cancelled = false;
    api.get('/agencies')
      .then((res: any) => {
        if (!cancelled) setAgencies(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const select = useCallback((id: string | null) => {
    setStoredId(id);
    persistExploreAgencyId(id);
  }, []);

  // Explicitly explored agency wins; otherwise fall back to the user's
  // preference (primary agency, then first saved agency).
  const selectedId = useMemo(
    () => storedId || asId(user?.primaryAgency) || asId(Array.isArray(user?.agencies) ? user.agencies[0] : null),
    [storedId, user]
  );

  const value = useMemo(() => ({ agencies, selectedId, select }), [agencies, selectedId, select]);
  return <AgencyCtx.Provider value={value}>{children}</AgencyCtx.Provider>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const useExploreAgency = () => useContext(AgencyCtx);

// Context-free subscription for consumers outside the provider subtree.
export function useExploreAgencyId(): string | null {
  const [id, setId] = useState<string | null>(() => getStoredExploreAgencyId());

  useEffect(() => {
    const sync = () => setId(getStoredExploreAgencyId());
    const onStorage = (e: StorageEvent) => {
      if (e.key === EXPLORE_AGENCY_STORAGE_KEY) sync();
    };
    window.addEventListener(EXPLORE_AGENCY_CHANGED_EVENT, sync);
    // Cross-tab support comes free with the storage event.
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EXPLORE_AGENCY_CHANGED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return id;
}
