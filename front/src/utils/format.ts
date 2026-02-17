/**
 * 파일명: thetower/front/src/utils/format.ts
 * 용도: 데이터 표시 및 파싱을 위한 포맷팅 유틸리티
 * 기능: 큰 숫자 단위 변환(The Tower 전용), 날짜/시간 포맷팅, 게임 수치 문자열 파싱
 */

/** 
 * 숫자를 게임 내 단위(K, M, B, T, ..., ac)가 포함된 문자열로 변환합니다.
 */
export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  
  // The Tower 고단위 지원
  if (num >= 1e42) return (num / 1e42).toFixed(2) + 'ac';
  if (num >= 1e39) return (num / 1e39).toFixed(2) + 'ab';
  if (num >= 1e36) return (num / 1e36).toFixed(2) + 'aa';
  if (num >= 1e33) return (num / 1e33).toFixed(2) + 'D';
  if (num >= 1e30) return (num / 1e30).toFixed(2) + 'N';
  if (num >= 1e27) return (num / 1e27).toFixed(2) + 'O';
  
  // 기본 단위 지원
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

/** 
 * 날짜 문자열을 읽기 쉬운 한글 형식으로 변환합니다 (예: 2월 10일 14:08).
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** 
 * 날짜 문자열을 헤더용 전체 형식으로 변환합니다 (예: 2026년 2월 10일 화요일).
 */
export const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

/** 
 * 시간 부분만 추출하여 변환합니다 (24시간제).
 */
export const formatTimeOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** 
 * 게임 플레이 시간 문자열(예: "2h 30m 10s")을 시간 단위 숫자(2.502...)로 변환합니다.
 */
export const parseDurationToHours = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const hMatch = timeStr.match(/(\d+)\s*h/i);
  const mMatch = timeStr.match(/(\d+)\s*m/i);
  const sMatch = timeStr.match(/(\d+)\s*s/i);

  if (hMatch) hours = parseInt(hMatch[1], 10);
  if (mMatch) minutes = parseInt(mMatch[1], 10);
  if (sMatch) seconds = parseInt(sMatch[1], 10);

  return hours + (minutes / 60) + (seconds / 3600);
};

/** 
 * 게임 단위 문자열(1.5M, 2.3B 등)을 실제 숫자(float)로 파싱합니다.
 */
export const parseGameNumber = (str: string | number): number => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  const clean = str.replace(/[$,x]/g, '').trim();
  const match = clean.match(/^([\d.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  
  const val = parseFloat(match[1]);
  const suffix = match[2];

  const powers: Record<string, number> = {
    'ac': 42, 'ab': 39, 'aa': 36,
    'k': 3, 'K': 3, 'm': 6, 'M': 6, 'b': 9, 'B': 9, 't': 12, 'T': 12,
    'q': 15, 'Q': 18, 's': 21, 'S': 24, 'o': 27, 'O': 27, 'n': 30, 'N': 30, 'd': 33, 'D': 33,
    'U': 36
  };
  
  return val * Math.pow(10, powers[suffix] || 0);
};