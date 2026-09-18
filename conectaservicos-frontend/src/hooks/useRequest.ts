import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, isMissingEndpoint } from "@/utils/errors";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** true quando a rota chamada ainda não existe no backend. */
  missingEndpoint: boolean;
}

/**
 * Busca dados de um endpoint com estados de loading/erro e função de retry.
 * Mantém um único ponto para skeleton, empty state e "Tentar novamente".
 */
export function useRequest<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null, missingEndpoint: false });
  const alive = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null, missingEndpoint: false }));
    try {
      const data = await fetcherRef.current();
      if (alive.current) setState({ data, loading: false, error: null, missingEndpoint: false });
    } catch (error) {
      if (alive.current) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error, "Não foi possível carregar os dados."),
          missingEndpoint: isMissingEndpoint(error),
        });
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void run();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater: (current: T | null) => T | null) => {
    setState((current) => ({ ...current, data: updater(current.data) }));
  }, []);

  return { ...state, reload: run, setData };
}
