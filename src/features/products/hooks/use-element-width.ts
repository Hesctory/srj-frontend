import { useEffect, useState } from "react";

/**
 * The element's current width, or null until measured (and always null where
 * `ResizeObserver` does not exist, as in tests: callers treat null as "wide").
 */
const useElementWidth = (element: HTMLElement | null) => {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return width;
};

export default useElementWidth;
