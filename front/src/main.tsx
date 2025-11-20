import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // 확장자를 .tsx로 명시
// Tailwind CSS를 위한 기본 스타일 파일을 임포트해야 합니다. 
// 이 환경에서는 Tailwind 클래스가 기본적으로 사용 가능하다고 가정합니다.

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);