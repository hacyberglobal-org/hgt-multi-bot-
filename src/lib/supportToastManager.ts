import { SupportToastData } from '../components/SupportSuccessToast';

type Listener = (toast: SupportToastData | null) => void;
const listeners = new Set<Listener>();

let currentToast: SupportToastData | null = null;

export const supportToastManager = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    fn(currentToast);
    return () => {
      listeners.delete(fn);
    };
  },
  show(data: Omit<SupportToastData, 'id'> & { id?: string }) {
    const fullToast: SupportToastData = {
      ...data,
      id: data.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    currentToast = fullToast;
    listeners.forEach((fn) => fn(currentToast));
  },
  dismiss() {
    currentToast = null;
    listeners.forEach((fn) => fn(null));
  }
};

export function triggerSupportSuccessToast(data: Omit<SupportToastData, 'id'> & { id?: string }) {
  supportToastManager.show(data);
}
