export const formatNumber = (num: number): string => {
  if (num === 0) return '0'; // 0일 경우 처리
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

// 상세 페이지용 (전체 날짜)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// [New] 리스트 그룹 헤더용 (예: 2024년 11월 30일)
export const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

// [New] 리스트 아이템용 (시간만 표시, 예: 14:30)
export const formatTimeOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};