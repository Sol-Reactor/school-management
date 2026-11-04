// Tiny external store so a detail page can name the last breadcrumb
// (e.g. "Amina Yusuf") without prop-drilling through the layout.
import { useEffect, useSyncExternalStore } from 'react';

let label = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useBreadcrumbLabel = () => useSyncExternalStore(subscribe, () => label);

/** Call from a detail page: useSetBreadcrumb(student?.user.fullName) */
export const useSetBreadcrumb = (value) => {
  useEffect(() => {
    label = value ?? null;
    emit();
    return () => {
      label = null;
      emit();
    };
  }, [value]);
};
