// [New] src/utils/format.ts

export const formatNumber = (num: number): string => {
  if (num >= 1e24) return (num / 1e24).toFixed(2) + 'S';
  if (num >= 1e21) return (num / 1e21).toFixed(2) + 's';
  if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Q';
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'q';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (seconds: number): string => {
   // 필요시 구현 (현재 백엔드에서 문자열로 줌)
   return "";
}