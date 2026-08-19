"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const LightboxContext = createContext<((src: string) => void) | null>(null);

export function useLightbox(): (src: string) => void {
  const open = useContext(LightboxContext);
  if (!open) {
    throw new Error("useLightbox must be used within LightboxProvider");
  }
  return open;
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(null);

  const open = useCallback((next: string) => setSrc(next), []);
  const close = useCallback(() => setSrc(null), []);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      <div id="lightbox" className={src ? "on" : ""} onClick={close}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- full-viewport zoom of an already-fetched photo; no responsive sizing needed
          <img id="lightbox-img" src={src} alt="" />
        ) : null}
      </div>
    </LightboxContext.Provider>
  );
}
