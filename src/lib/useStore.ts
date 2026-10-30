import { useCallback, useEffect, useState } from 'react';
import { loadState, onStateChange, saveBindings, saveSessions, type StoreState } from './storage';

export function useStore() {
  const [state, setState] = useState<StoreState | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      loadState().then((next) => {
        if (alive) setState(next);
      });
    };
    refresh();
    const unsubscribe = onStateChange(refresh);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const commit = useCallback((next: StoreState) => {
    setState(next);
    void saveSessions(next.sessions);
    void saveBindings(next.bindings);
  }, []);

  return { state, commit };
}
