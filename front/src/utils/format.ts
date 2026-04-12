/**
 * 파일명: thetower/front/src/utils/format.ts
 * 용도: 데이터 표시 및 파싱을 위한 포맷팅 유틸리티
 * 기능: 큰 숫자 단위 변환(The Tower 전용), 날짜/시간 포맷팅, 게임 수치 문자열 파싱
 */

/** 
 * 숫자를 게임 내 단위(K, M, B, T, ..., az)가 포함된 문자열로 변환합니다.
 */
export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  if (num < 1000) return num.toString();

  const units = [
    { s: 'az', p: 111 }, { s: 'ay', p: 108 }, { s: 'ax', p: 105 }, { s: 'aw', p: 102 }, { s: 'av', p: 99 },
    { s: 'au', p: 96 }, { s: 'at', p: 93 }, { s: 'as', p: 90 }, { s: 'ar', p: 87 }, { s: 'aq', p: 84 },
    { s: 'ap', p: 81 }, { s: 'ao', p: 78 }, { s: 'an', p: 75 }, { s: 'am', p: 72 }, { s: 'al', p: 69 },
    { s: 'ak', p: 66 }, { s: 'aj', p: 63 }, { s: 'ai', p: 60 }, { s: 'ah', p: 57 }, { s: 'ag', p: 54 },
    { s: 'af', p: 51 }, { s: 'ae', p: 48 }, { s: 'ad', p: 45 }, { s: 'ac', p: 42 }, { s: 'ab', p: 39 },
    { s: 'aa', p: 36 }, { s: 'D', p: 33 }, { s: 'N', p: 30 }, { s: 'O', p: 27 }, { s: 'S', p: 24 },
    { s: 's', p: 21 }, { s: 'Q', p: 18 }, { s: 'q', p: 15 }, { s: 'T', p: 12 }, { s: 'B', p: 9 },
    { s: 'M', p: 6 }, { s: 'K', p: 3 }
  ];

  for (const unit of units) {
    const val = Math.pow(10, unit.p);
    if (num >= val) {
      return (num / val).toFixed(2) + unit.s;
    }
  }

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
    'az': 111, 'ay': 108, 'ax': 105, 'aw': 102, 'av': 99, 'au': 96, 'at': 93, 'as': 90, 'ar': 87, 'aq': 84, 'ap': 81, 'ao': 78, 'an': 75, 'am': 72, 'al': 69, 'ak': 66, 'aj': 63, 'ai': 60, 'ah': 57, 'ag': 54, 'af': 51, 'ae': 48, 'ad': 45,
    'ac': 42, 'ab': 39, 'aa': 36,
    'k': 3, 'K': 3, 'm': 6, 'M': 6, 'b': 9, 'B': 9, 't': 12, 'T': 12,
    'q': 15, 'Q': 18, 's': 21, 'S': 24, 'o': 27, 'O': 27, 'n': 30, 'N': 30, 'd': 33, 'D': 33,
  };

  return val * Math.pow(10, powers[suffix] || 0);
};