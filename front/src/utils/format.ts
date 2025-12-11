// src/utils/format.ts

export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  
  // [New] The Tower 고단위 추가 (aa ~ ac, D, N, O 등)
  if (num >= 1e42) return (num / 1e42).toFixed(2) + 'ac';
  if (num >= 1e39) return (num / 1e39).toFixed(2) + 'ab';
  if (num >= 1e36) return (num / 1e36).toFixed(2) + 'aa';
  if (num >= 1e33) return (num / 1e33).toFixed(2) + 'D';
  if (num >= 1e30) return (num / 1e30).toFixed(2) + 'N';
  if (num >= 1e27) return (num / 1e27).toFixed(2) + 'O';
  
  // 기존 단위
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

// [New] 게임 숫자 문자열 파싱 (정렬용)
export const parseGameNumber = (str: string | number): number => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  const clean = str.replace(/[$,x]/g, '').trim();
  const match = clean.match(/^([\d.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  
  const val = parseFloat(match[1]);
  const suffix = match[2]; // 대소문자 구분 있음 (s vs S 등)

  const powers: Record<string, number> = {
    // [New] 새로운 단위 추가
    'ac': 42, 'ab': 39, 'aa': 36,
    
    // 기존 단위
    'k': 3, 'K': 3, 'm': 6, 'M': 6, 'b': 9, 'B': 9, 't': 12, 'T': 12,
    'q': 15, 'Q': 18, 's': 21, 'S': 24, 'o': 27, 'O': 27, 'n': 30, 'N': 30, 'd': 33, 'D': 33,
    'U': 36 // 혹시 몰라 U도 포함
  };
  
  // suffix가 없으면 powers[suffix]는 undefined -> 0승(1배)
  return val * Math.pow(10, powers[suffix] || 0);
};