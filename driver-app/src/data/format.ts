export function inr(value: number) {
  const abs = Math.abs(value).toLocaleString('en-IN');
  if (value > 0) return `+₹${abs}`;
  if (value < 0) return `-₹${abs}`;
  return `₹${abs}`;
}

export function inrPlain(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function km(value: number) {
  return `${value.toLocaleString('en-IN')} km`;
}

export function nowStamp() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
