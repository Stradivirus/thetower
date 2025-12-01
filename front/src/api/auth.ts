import { API_BASE_URL } from '../utils/apiConfig';

const AUTH_URL = `${API_BASE_URL}/auth`; // 인증 엔드포인트

const getAuthHeaders = (contentType: boolean = false) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const loginUser = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '로그인 실패');
  }

  return response.json();
};

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