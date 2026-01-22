"use client";

import { useEffect, useRef, useState } from "react";

const CHECK_INTERVAL_MS = 60000;

type VersionResponse = {
  buildId: string;
  timestamp: number;
};

async function fetchBuildId(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/version", {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as VersionResponse;
    return data.buildId || null;
  } catch (error) {
    // Ignorar errores de abort - son esperados al desmontar el componente
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

export function useVersionCheck() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const currentBuildIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (hasNewVersion) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const init = async () => {
      const initialBuildId = await fetchBuildId(controller.signal);
      if (!isActive) {
        return;
      }
      currentBuildIdRef.current = initialBuildId;
    };

    const interval = setInterval(async () => {
      const latestBuildId = await fetchBuildId(controller.signal);
      if (!isActive || hasNewVersion) {
        return;
      }

      if (!currentBuildIdRef.current && latestBuildId) {
        currentBuildIdRef.current = latestBuildId;
        return;
      }

      if (
        currentBuildIdRef.current &&
        latestBuildId &&
        currentBuildIdRef.current !== latestBuildId
      ) {
        setHasNewVersion(true);
        clearInterval(interval);
      }
    }, CHECK_INTERVAL_MS);

    init();

    return () => {
      isActive = false;
      controller.abort("Component unmounted");
      clearInterval(interval);
    };
  }, [hasNewVersion]);

  return { hasNewVersion };
}
