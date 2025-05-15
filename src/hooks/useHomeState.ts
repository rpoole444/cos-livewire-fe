import { useRouter } from 'next/router';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import dayjs, { Dayjs } from 'dayjs';

/* ── calendar view options you already use ─────────────────────── */
export type FilterMode = 'day' | 'week' | 'all';

/* what the consumer gets back */
export interface HomeState {
  selectedDate: Dayjs;
  setSelectedDate: Dispatch<SetStateAction<Dayjs>>;
  filterMode: FilterMode;
  setFilterMode: Dispatch<SetStateAction<FilterMode>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

/* runtime guards (stop bad query strings breaking things) */
const isFilterMode = (v: unknown): v is FilterMode =>
  v === 'day' || v === 'week' || v === 'all';

const isISODate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Persist calendar date, view, and search string in URL + localStorage.
 * LocalStorage keys:  agg_date, agg_view, agg_search
 */
export function useHomeState(): HomeState {
  const router = useRouter();

  /* ── first render ▸ hydrate from URL ▸ localStorage ▸ defaults ── */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const qp = router.query.date;
    const d = Array.isArray(qp) ? qp[0] : qp;
    if (isISODate(d)) return dayjs(d);

    const ls = localStorage.getItem('agg_date');
    if (isISODate(ls)) return dayjs(ls);

    return dayjs(); // today
  });

  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    const qp = router.query.view;
    const v = Array.isArray(qp) ? qp[0] : qp;
    if (isFilterMode(v)) return v;

    const ls = localStorage.getItem('agg_view');
    if (isFilterMode(ls)) return ls;

    return 'day';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const qp = router.query.q;
    const q = Array.isArray(qp) ? qp[0] : qp;
    if (typeof q === 'string') return q;

    return localStorage.getItem('agg_search') ?? '';
  });

  /* ── whenever state changes ▸ persist to both places ──────────── */
  useEffect(() => {
    localStorage.setItem('agg_date', selectedDate.format('YYYY-MM-DD'));
    localStorage.setItem('agg_view', filterMode);
    localStorage.setItem('agg_search', searchQuery);

    router.replace(
      {
        query: {
          ...router.query,
          date: selectedDate.format('YYYY-MM-DD'),
          view: filterMode,
          q: searchQuery || undefined, // drop param if empty
        },
      },
      undefined,
      { shallow: true }
    );
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
