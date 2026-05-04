export function buildVideoUrl(url: string): string {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}enablejsapi=1`;
}
