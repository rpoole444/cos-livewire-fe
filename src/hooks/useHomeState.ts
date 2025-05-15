import { useRouter } from 'next/router';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import dayjs, { Dayjs } from 'dayjs';

/* ── calendar view options ─────────────────────────────────────── */
export type FilterMode = 'day' | 'week' | 'all';

/* what consumers receive */
export interface HomeState {
  selectedDate: Dayjs;
  setSelectedDate: Dispatch<SetStateAction<Dayjs>>;
  filterMode: FilterMode;
  setFilterMode: Dispatch<SetStateAction<FilterMode>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

/* ── runtime guards ────────────────────────────────────────────── */
const isFilterMode = (v: unknown): v is FilterMode =>
  v === 'day' || v === 'week' || v === 'all';

const isISODate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/* ── safe storage helpers (no-op on server) ────────────────────── */
const isBrowser = typeof window !== 'undefined';

const safeGet = (key: string): string | null =>
  isBrowser ? window.localStorage.getItem(key) : null;

const safeSet = (key: string, val: string) => {
  if (isBrowser) window.localStorage.setItem(key, val);
};

/**
 * Persist calendar date, view, and search in URL + localStorage.
 * LocalStorage keys: agg_date, agg_view, agg_search
 */
export function useHomeState(): HomeState {
  const router = useRouter();

  /* ── hydrate on first render ─────────────────────────────────── */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const qp = router.query.date;
    const qd = Array.isArray(qp) ? qp[0] : qp;
    if (isISODate(qd)) return dayjs(qd);

    const ls = safeGet('agg_date');
    if (isISODate(ls)) return dayjs(ls);

    return dayjs(); // today
  });

  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    const qp = router.query.view;
    const qv = Array.isArray(qp) ? qp[0] : qp;
    if (isFilterMode(qv)) return qv;

    const ls = safeGet('agg_view');
    if (isFilterMode(ls)) return ls;

    return 'day';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const qp = router.query.q;
    const qq = Array.isArray(qp) ? qp[0] : qp;
    if (typeof qq === 'string') return qq;

    return safeGet('agg_search') ?? '';
  });

  /* ── persist whenever state changes ──────────────────────────── */
  useEffect(() => {
    /* localStorage */
    safeSet('agg_date', selectedDate.format('YYYY-MM-DD'));
    safeSet('agg_view', filterMode);
    safeSet('agg_search', searchQuery);

    /* update URL only in browser (no SSR) */
    if (isBrowser) {
      router.replace(
        {
          query: {
            ...router.query,
            date: selectedDate.format('YYYY-MM-DD'),
            view: filterMode,
            q: searchQuery || undefined, // drop if empty
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [selectedDate, filterMode, searchQuery, router]);

  return {
    selectedDate,
    setSelectedDate,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
  };
}
