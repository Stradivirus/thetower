/**
 * 파일명: thetower/front/src/main.tsx
 * 용도: 프론트엔드 애플리케이션의 진입점(Entry Point)
 * 기능: React 루트 요소 생성, StrictMode 적용 및 전역 CSS 로드
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // 전역 Tailwind CSS 스타일 로드

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)