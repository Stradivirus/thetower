// front/src/utils/apiConfig.ts

export const API_BASE_URL = '/api';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  // 기존 헤더 가져오기
  const headers = new Headers(options.headers || {});
  
  // [수정] body가 FormData가 아닐 때만 'application/json'을 강제로 붙입니다.
  // FormData는 브라우저가 알아서 boundary를 붙여줘야 하므로 Content-Type을 설정하면 안 됩니다!
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // 토큰 있으면 붙이기
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 토큰 만료 처리
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('인증이 만료되었습니다.');
  }

  return response;
};