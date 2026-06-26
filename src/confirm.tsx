import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

/* Imperative confirm: `if (await confirm({...})) doIt()`. One native <dialog>
   renders all confirmations — accessible, Escape-to-cancel, no z-index games. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      requestAnimationFrame(() => dialogRef.current?.showModal());
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    dialogRef.current?.close();
    setOpts(null);
  }, []);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className="confirm"
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) settle(false); // backdrop click
        }}
      >
        {opts && (
          <div className="confirm-body">
            <button
              className="confirm-close"
              onClick={() => settle(false)}
              autoFocus
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <h3>{opts.title}</h3>
            {opts.message && <p>{opts.message}</p>}
            <div className="confirm-actions">
              <button
                className={opts.tone === "danger" ? "danger-btn" : "primary-btn"}
                onClick={() => settle(true)}
              >
                {opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConfirm must be used within ConfirmProvider");
  return c;
}
