import { useEffect, useState } from "react";
import { secondsUntil } from "@/features/cashier/tuition/utils/payments";

/**
 * Seconds left before an instant, ticking once a second.
 *
 * Returns 0 — never a negative — and stops the interval once it lands there,
 * so an abandoned drawer does not keep a timer alive. Pass `null` when there is
 * nothing to count down.
 */
const useCountdown = (expiresAt: string | null): number => {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    expiresAt ? secondsUntil(expiresAt) : 0,
  );

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(secondsUntil(expiresAt));
    const id = setInterval(() => {
      const left = secondsUntil(expiresAt);
      setSecondsLeft(left);
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
};

export default useCountdown;
