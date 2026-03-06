import { useEffect, useState } from "react";
import { fetchPublic } from "./api";

let cachedStates: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

function loadStates(): Promise<string[]> {
  if (cachedStates) return Promise.resolve(cachedStates);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetchPublic("/common/brazilian-states")
    .then((data: unknown) => {
      const list =
        data && typeof data === "object"
          ? (data as { states?: string[] }).states
          : undefined;
      cachedStates = Array.isArray(list) ? list : [];
      return cachedStates;
    })
    .catch(() => {
      fetchPromise = null;
      return [] as string[];
    });

  return fetchPromise;
}

export function useBrazilianStates() {
  const [states, setStates] = useState<string[]>(cachedStates ?? []);

  useEffect(() => {
    let mounted = true;
    loadStates().then((s) => {
      if (mounted) setStates(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return states;
}
