import {
  Receipt,
  CreditCard,
  ClipboardText,
  ShieldCheck,
  Microphone,
} from '@phosphor-icons/react/dist/ssr';

const items = [
  { label: 'GST invoices', icon: Receipt },
  { label: 'FASTag deductions', icon: CreditCard },
  { label: 'Duty logs', icon: ClipboardText },
  { label: 'RC and PUC alerts', icon: ShieldCheck },
  { label: 'Hindi voice input', icon: Microphone },
];

export function Capabilities() {
  return (
    <section className="pb-4 md:pb-6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 bg-surface px-4 py-3.5"
            >
              <item.icon size={18} weight="regular" className="text-accent shrink-0" />
              <span className="text-[13px] font-medium text-foreground">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
