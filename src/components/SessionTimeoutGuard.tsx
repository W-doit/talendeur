import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/** Total idle time before forced logout */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
/** How long before logout to show the warning */
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

const SessionTimeoutGuard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(WARNING_BEFORE_MS / 1000));

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const forceLogout = useCallback(async () => {
    clearTimers();
    setWarningOpen(false);
    await logout();
    navigate('/login', { replace: true, state: { reason: 'session_timeout' } });
  }, [clearTimers, logout, navigate]);

  const startCountdown = useCallback(() => {
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    setWarningOpen(false);

    const warnIn = Math.max(IDLE_TIMEOUT_MS - WARNING_BEFORE_MS, 0);
    warningTimerRef.current = window.setTimeout(() => {
      setWarningOpen(true);
      startCountdown();
    }, warnIn);

    logoutTimerRef.current = window.setTimeout(() => {
      void forceLogout();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, forceLogout, startCountdown]);

  const registerActivity = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    lastActivityRef.current = now;

    // Extending session while warning is open happens via the button only,
    // so activity during warning does not silently dismiss it.
    if (!warningOpen) {
      scheduleTimers();
    }
  }, [user, warningOpen, scheduleTimers]);

  const staySignedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    setWarningOpen(false);
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      setWarningOpen(false);
      return;
    }

    scheduleTimers();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, registerActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, registerActivity);
      });
    };
  }, [user, scheduleTimers, registerActivity, clearTimers]);

  if (!user) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Dialog open={warningOpen} onOpenChange={(open) => !open && staySignedIn()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Session expiring soon</DialogTitle>
          <DialogDescription>
            You've been inactive. For security, you'll be signed out in{' '}
            <span className="font-semibold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => void forceLogout()}>
            Sign out now
          </Button>
          <Button
            type="button"
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
            onClick={staySignedIn}
          >
            Stay signed in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutGuard;
