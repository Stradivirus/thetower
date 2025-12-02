// src/utils/format.ts

export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
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

export const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

export const formatTimeOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// [New] 시간 문자열("2h 30m 10s")을 시간 단위 숫자(2.502...)로 변환
export const parseDurationToHours = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // 정규식으로 h, m, s 추출 (대소문자 무시)
  const hMatch = timeStr.match(/(\d+)\s*h/i);
  const mMatch = timeStr.match(/(\d+)\s*m/i);
  const sMatch = timeStr.match(/(\d+)\s*s/i);

  if (hMatch) hours = parseInt(hMatch[1], 10);
  if (mMatch) minutes = parseInt(mMatch[1], 10);
  if (sMatch) seconds = parseInt(sMatch[1], 10);

  return hours + (minutes / 60) + (seconds / 3600);
};