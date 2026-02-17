/**
 * 파일명: thetower/front/src/utils/apiConfig.ts
 * 용도: API 통신을 위한 공통 설정 및 인증 처리 유틸리티
 * 기능: 베이스 URL 정의, JWT 토큰 자동 첨부, 401 에러(인증 만료) 통합 처리
 */

export const API_BASE_URL = '/api';

/** 
 * 인증 토큰을 자동으로 포함하여 fetch 요청을 수행하는 래퍼 함수입니다.
 * @param url 요청할 API 경로
 * @param options fetch 옵션
 * @returns fetch Response 객체
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  // 기존 헤더 가져오기
  const headers = new Headers(options.headers || {});
  
  // body가 FormData가 아닐 때만 'application/json'을 기본값으로 설정
  // FormData 사용 시 브라우저가 boundary를 자동 생성해야 하므로 Content-Type을 수동 지정하지 않음
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // 인증 토큰이 존재하면 Authorization 헤더 추가
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 Unauthorized 발생 시 로그아웃 처리 및 이벤트 전파
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('인증이 만료되었습니다.');
  }

  return response;
};