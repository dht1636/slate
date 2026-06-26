import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

const KEY = "slate-theme";

function read(): Theme {
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

/** Dark-default theme, persisted across launches and applied to <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggle };
}
