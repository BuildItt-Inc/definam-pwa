import { toast as sonnerToast } from 'sonner';

/**
 * Corner-toast helper — small, auto-dismissing, non-blocking.
 * Use for: topic/reading completion, recall session completed, and errors
 * (failed chat send, rate limit hit, network/API failures, failed payment).
 * For login/streak/payment SUCCESS moments, use the CelebrationOverlay
 * (see components/ui/celebration) instead — those are bigger, rarer, and
 * more emotionally weighted than a corner toast fits.
 */
export const toast = {
  success(message: string, description?: string) {
    sonnerToast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string) {
    sonnerToast.error(message, description ? { description } : undefined);
  },
  info(message: string, description?: string) {
    sonnerToast(message, description ? { description } : undefined);
  },
};
