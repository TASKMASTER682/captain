'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Share, Plus, X, CheckCircle2, Download } from 'lucide-react';

/**
 * Small animated floating install button (bottom corner) for the PWA.
 *
 * - Chromium (Android/desktop Chrome/Edge): tapping triggers the native
 *   install dialog.
 * - iOS Safari (no install API): tapping opens a tiny "Share → Add to Home
 *   Screen" hint bubble.
 * - Hidden when already installed, on browsers that cannot install, and while
 *   a student is taking an exam.
 * - Dismissing is remembered for 7 days so it never becomes nagware.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'examos-pwa-dismissed-at';
const INSTALLED_KEY = 'examos-pwa-installed';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;

// Routes where an install button would interrupt an exam in progress.
const EXAM_ROUTE_PREFIXES = ['/cbt/', '/custom-test/take'];

// Module-level capture so the event is not lost if the browser fires it
// before this component has hydrated. Chrome delivers it at most once per
// page load, so it must be caught as early as possible.
let capturedEvent: BeforeInstallPromptEvent | null = null;
type BipListener = (event: BeforeInstallPromptEvent) => void;
const bipListeners = new Set<BipListener>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (rawEvent) => {
    rawEvent.preventDefault();
    capturedEvent = rawEvent as BeforeInstallPromptEvent;
    bipListeners.forEach((listener) => listener(capturedEvent!));
  });
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
  );
}

function isOnExamRoute(pathname: string | null) {
  return !!pathname && EXAM_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Freshly evaluated on every show/hide decision — never cached in state. */
function mayShowButton(pathname: string | null, debug: boolean) {
  if (!debug) {
    try {
      if (localStorage.getItem(INSTALLED_KEY) === '1') return false;
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_MS) return false;
    } catch {
      /* storage unavailable (private mode) — treat as eligible */
    }
    if (isStandalone()) return false;
  }
  return !isOnExamRoute(pathname);
}

/**
 * Debug override: append ?pwa-debug=1 once (or set localStorage
 * 'examos-pwa-debug' = '1') to force the button to appear immediately,
 * ignoring dismissal/installed state. Handy while testing.
 */
function isDebugEnabled() {
  try {
    const param = new URLSearchParams(window.location.search).get('pwa-debug');
    if (param === '1') {
      localStorage.setItem('examos-pwa-debug', '1');
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(INSTALLED_KEY);
      return true;
    }
    if (param === '0') {
      localStorage.removeItem('examos-pwa-debug');
      return false;
    }
    return localStorage.getItem('examos-pwa-debug') === '1';
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const busyRef = useRef(false);

  // Subscribe to installation lifecycle events.
  useEffect(() => {
    const onBip: BipListener = (event) => setInstallEvent(event);
    bipListeners.add(onBip);

    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, '1');
      } catch {
        /* ignore */
      }
      busyRef.current = false;
      setShowButton(false);
      setHintOpen(false);
      setInstallEvent(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      bipListeners.delete(onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Decide whether the button may appear. All state updates happen inside
  // animation-frame / timer callbacks (never synchronously in the effect
  // body) and are re-evaluated whenever the route or capability changes —
  // e.g. navigating into /cbt hides the button immediately.
  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let logged = false;

    const raf = requestAnimationFrame(() => {
      // Catch up with an event that fired before hydration.
      if (capturedEvent && capturedEvent !== installEvent) {
        setInstallEvent(capturedEvent);
      }

      const source = capturedEvent ?? installEvent;
      const debug = isDebugEnabled();
      const ios = isIos();
      const capable = source !== null || ios;

      // One-line diagnostic so a missing button is never a mystery.
      if (!logged) {
        logged = true;
        const reason = !capable
          ? 'no install capability (no beforeinstallprompt, not iOS — needs SW + manifest + HTTPS/localhost)'
          : isOnExamRoute(pathname)
            ? 'exam route'
            : !debug
              ? (() => {
                  try {
                    if (localStorage.getItem(INSTALLED_KEY) === '1') return 'already installed';
                    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
                    if (dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_MS)
                      return 'dismissed recently';
                  } catch {
                    /* ignore */
                  }
                  if (isStandalone()) return 'running as installed app';
                  return null;
                })()
              : null;
        console.info(
          reason
            ? `[pwa] install button hidden: ${reason}. Tip: open /?pwa-debug=1 to force it.`
            : '[pwa] install button eligible'
        );
      }

      if (!capable || !mayShowButton(pathname, debug)) {
        setShowButton(false);
        return;
      }

      delayTimer = setTimeout(
        () => {
          if (!mayShowButton(pathname, debug)) {
            setShowButton(false);
            return;
          }
          setIsIosDevice(source === null);
          setShowButton(true);
        },
        debug ? 0 : SHOW_DELAY_MS
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [pathname, installEvent]);

  const dismissForDays = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode etc. — button just reappears next session */
    }
    setShowButton(false);
    setHintOpen(false);
  }, []);

  const handleClick = useCallback(async () => {
    const source = installEvent ?? capturedEvent;
    if (!source) {
      // iOS & friends: no install API — open the manual hint bubble.
      setHintOpen((open) => !open);
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await source.prompt();
      const { outcome } = await source.userChoice;
      if (outcome === 'accepted') {
        try {
          localStorage.setItem(INSTALLED_KEY, '1');
        } catch {
          /* ignore */
        }
        setShowButton(false);
      } else {
        dismissForDays();
      }
    } catch {
      /* prompt failed (rare) — leave the button for another session */
    } finally {
      busyRef.current = false;
      setInstallEvent(null);
    }
  }, [installEvent, dismissForDays]);

  return (
    <div className="fixed z-[60] bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2">
      {/* iOS / manual-install hint bubble */}
      <AnimatePresence>
        {hintOpen && (
          <motion.div
            key="install-hint"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="relative w-60 bg-card border border-border rounded-2xl shadow-2xl p-3.5"
            role="dialog"
            aria-label="How to install ExamOS"
          >
            <button
              onClick={() => setHintOpen(false)}
              aria-label="Close hint"
              className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <h3 className="text-xs font-bold font-outfit pr-5">Install ExamOS</h3>
            <ol className="mt-2 space-y-1.5 text-[11px] text-foreground/90">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center"><Share className="w-3 h-3 text-primary" /></span>
                Tap the <strong>Share</strong> button
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center"><Plus className="w-3 h-3 text-primary" /></span>
                Choose <strong>Add to Home Screen</strong>
              </li>
            </ol>
            <button
              onClick={dismissForDays}
              className="mt-2.5 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The floating install button */}
      <AnimatePresence>
        {showButton && !isOnExamRoute(pathname) && (
          <motion.div
            key="install-button"
            initial={{ opacity: 0, scale: 0, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="relative"
          >
            {/* Attention pulse ring */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/50"
              animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', repeatDelay: 2.5 }}
            />
            <motion.button
              onClick={handleClick}
              aria-label={isIosDevice ? 'How to install ExamOS' : 'Install ExamOS app'}
              title={isIosDevice ? 'Install ExamOS' : 'Install ExamOS app'}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="group relative w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/95 transition-colors"
            >
              <Download className="w-5 h-5" />
              {/* Hover tooltip (desktop) */}
              <span className="hidden sm:block absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-[11px] font-semibold opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
                {isIosDevice ? 'Install ExamOS' : 'Install app'}
              </span>
              {/* Dismiss badge */}
              <span
                role="button"
                tabIndex={-1}
                aria-label="Dismiss install button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissForDays();
                }}
                className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-card border border-border text-muted-foreground hover:text-foreground flex items-center justify-center shadow-sm cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visually-hidden context for screen readers on iOS */}
      <span className="sr-only" aria-live="polite">
        {showButton && isIosDevice ? 'ExamOS can be installed via the share menu' : ''}
      </span>
    </div>
  );
}
