export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export type DialogVariant = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'danger';

export type DialogButton = {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
};

export type DialogOptions = {
  title: string;
  message?: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
  dismissable?: boolean;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export type DialogApi = {
  show: (options: DialogOptions) => Promise<DialogButton | null>;
  alert: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
    options?: Pick<DialogOptions, 'variant' | 'dismissable'>
  ) => Promise<DialogButton | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};
