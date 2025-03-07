'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

/*
ANAGRAM
MCQ
READ_ALONG
CONTENT_ONLY
CONVERSATION
*/

export const CATEGORY_OPTIONS = [
  { value: 'ANAGRAM', label: 'ANAGRAM' },
  { value: 'CONTENT_ONLY', label: 'CONTENT ONLY' },
  { value: 'CONVERSATION', label: 'CONVERSATION' },
  { value: 'MCQ', label: 'MCQ' },
  { value: 'READ_ALONG', label: 'READ ALONG' },
];
export function useProductTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [categoriesFilter, setCategoriesFilter] = useQueryState(
    'categories',
    searchParams.categories.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setCategoriesFilter(null);

    setPage(1);
  }, [setSearchQuery, setCategoriesFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!categoriesFilter;
  }, [searchQuery, categoriesFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    categoriesFilter,
    setCategoriesFilter
  };
}
