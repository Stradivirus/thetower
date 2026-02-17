/**
 * 파일명: thetower/front/src/api/auth.ts
 * 용도: 사용자 인증(로그인, 회원가입) 관련 API 호출 함수 정의
 * 기능: JWT 토큰 기반 인증 처리 및 OAuth2 표준 폼 데이터 전송
 */
import { API_BASE_URL } from '../utils/apiConfig';

const AUTH_URL = `${API_BASE_URL}/auth`;

/** 
 * 인증 헤더를 생성합니다. 
 * @param contentType JSON 여부 (기본 false)
 */
const getAuthHeaders = (contentType: boolean = false) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/** 
 * 사용자 로그인을 수행하고 토큰을 반환받습니다.
 * - OAuth2 Password Flow 표준에 맞춰 x-www-form-urlencoded 형식을 사용합니다.
 */
export const loginUser = async (username: string, password: string) => {
  const formBody = new URLSearchParams({
    username: username,
    password: password
  });
  
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formBody,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '로그인 실패');
  }

  return response.json();
};

/** 
 * 신규 사용자를 등록합니다.
 */
export const registerUser = async (username: string, password: string) => {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '회원가입 실패');
  }

  return response.json();
};