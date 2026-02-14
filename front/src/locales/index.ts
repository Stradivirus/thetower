// src/locales/index.ts
import { KR } from './kr';
import { EN } from './en';

export type LangType = 'KR' | 'EN';

// 1. 초기 언어 설정 (저장된 값이 없으면 'KR'을 기본값으로 사용)
const savedLang = localStorage.getItem('site_lang') as LangType;
export const CURRENT_LANG: LangType = savedLang || 'KR';

// 2. 현재 언어팩 내보내기
export const T = CURRENT_LANG === 'KR' ? KR : EN;

// 3. 언어 전환 함수 (전환 후 페이지를 새로고침하여 전체 반영)
export const toggleLanguage = () => {
  const nextLang = CURRENT_LANG === 'KR' ? 'EN' : 'KR';
  localStorage.setItem('site_lang', nextLang);
  window.location.reload(); 
};