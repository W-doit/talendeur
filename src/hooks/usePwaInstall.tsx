import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallContextValue {
  canInstall: boolean;
  iosHint: boolean;
  installed: boolean;
  /** True when we should show install UI (not already installed as PWA) */
  showInstallUi: boolean;
  install: () => Promise<boolean>;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  iosHint: false,
  installed: false,
  showInstallUi: false,
  install: async () => false,
});

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export const PwaInstallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
      setIosHint(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    if (isIos() && !isStandalone()) {
      setIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === 'accepted';
  }, [deferred]);

  const value = useMemo(() => {
    const canInstall = !!deferred && !installed;
    return {
      canInstall,
      iosHint,
      installed,
      // Always offer install UI in browser tabs; hide only when already running as installed app
      showInstallUi: !installed,
      install,
    };
  }, [deferred, installed, iosHint, install]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
};

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}
