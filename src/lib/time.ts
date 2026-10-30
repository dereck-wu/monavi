export function formatRelative(timestamp: number, now = Date.now()): string {
  const minutes = Math.floor((now - timestamp) / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  if (Math.floor(hours / 24) === 1) return '昨天';
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}
