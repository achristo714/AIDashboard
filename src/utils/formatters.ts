export function formatCredits(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function truncateEmail(email: string, maxLen = 25): string {
  if (email.length <= maxLen) return email;
  const [user, domain] = email.split('@');
  if (!domain) return email.slice(0, maxLen) + '...';
  const available = maxLen - domain.length - 4; // 4 = "...@"
  if (available < 3) return email.slice(0, maxLen) + '...';
  return `${user.slice(0, available)}...@${domain}`;
}
