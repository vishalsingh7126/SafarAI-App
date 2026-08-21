import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useSyncedSearchParams — mirror local UI state into the URL without the
 * classic `setSearchParams` effect loop (its identity changes on every
 * navigation, so naive effects re-fire forever). We diff the serialised
 * params and only navigate when something actually changed.
 */
export default function useSyncedSearchParams(params) {
  const [searchParams, setSearchParams] = useSearchParams();
  const setRef = useRef(setSearchParams);
  setRef.current = setSearchParams;

  const serialised = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();

  const current = searchParams.toString();

  useEffect(() => {
    if (serialised === current) return;
    setRef.current(new URLSearchParams(serialised), { replace: true });
  }, [serialised, current]);

  return searchParams;
}
