"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useVersionCheck } from "@/hooks/use-version-check";

export function VersionChecker() {
  const { hasNewVersion } = useVersionCheck();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (!hasNewVersion || hasShownRef.current) {
      return;
    }

    hasShownRef.current = true;
    toast("Nueva versión disponible", {
      description: "Haz clic para actualizar el panel.",
      action: {
        label: "Actualizar",
        onClick: () => window.location.reload(),
      },
      duration: Infinity,
    });
  }, [hasNewVersion]);

  return null;
}
