import type { ConfirmOptions, DialogApi, DialogButton, DialogOptions, DialogVariant } from './types';

let host: DialogApi | null = null;

export function registerDialogHost(api: DialogApi | null) {
  host = api;
}

export const appDialog: DialogApi = {
  show(options: DialogOptions) {
    return host?.show(options) ?? Promise.resolve(null);
  },
  alert(title, message, buttons, options) {
    return host?.alert(title, message, buttons, options) ?? Promise.resolve(null);
  },
  confirm(options: ConfirmOptions) {
    return host?.confirm(options) ?? Promise.resolve(false);
  },
};

export function inferDialogVariant(
  title: string,
  message?: string,
  buttons?: DialogButton[]
): DialogVariant {
  if (!message && (buttons?.length ?? 0) > 2) return 'info';
  if (buttons?.some((button) => button.style === 'destructive')) return 'danger';
  const hasCancel = buttons?.some((button) => button.style === 'cancel');
  if (hasCancel && (buttons?.length ?? 0) >= 2) return 'confirm';

  const haystack = `${title} ${message || ''}`.toLowerCase();
  if (/error|failed|cannot|invalid|not registered/.test(haystack)) return 'error';
  if (/success|saved|started|ended|completed|uploaded|ready|submitted|dispatched/.test(haystack)) {
    return 'success';
  }
  if (/required|warning|photo needed/.test(haystack)) return 'warning';
  return 'info';
}
