export const API_BASURL = '/api';
// export const API_BASE_URL = 'http://localhost:8000/api';

// [New] 401(토큰 만료) 감지용 래퍼 함수
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);

  // 토큰 만료 (401) 감지 시 -> 비상벨 울림 (이벤트 발생)
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
    // 에러를 던져서 이후 로직이 실행되지 않게 함
    throw new Error('인증이 만료되었습니다.');
  }

  return response;
};