// front/src/utils/apiConfig.ts

// API 기본 주소 (/api로 설정하면 vite.config.ts의 프록시를 탑니다)
export const API_BASE_URL = '/api';

// [중요] 토큰을 실어 보내는 래퍼 함수 (axios 없이 순수 fetch 사용)
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  // 1. 헤더 설정: 기존 헤더 유지하면서 토큰 추가
  const headers = new Headers(options.headers || {});
  
  // Content-Type이 명시되지 않았다면 기본적으로 application/json 설정
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // 2. 토큰이 있으면 'Authorization: Bearer 토큰값' 형태로 붙임
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. 요청 전송
  const response = await fetch(url, {
    ...options,
    headers, // 완성된 헤더 사용
  });

  // 4. 401(인증 만료) 발생 시 처리
  if (response.status === 401) {
    console.warn("인증이 만료되었습니다. 로그아웃 처리합니다.");
    localStorage.removeItem('access_token'); // 만료된 토큰 삭제
    window.dispatchEvent(new Event('auth:expired')); // 로그인 모달 띄우기 신호
    throw new Error('인증이 만료되었습니다.');
  }

  return response;
};