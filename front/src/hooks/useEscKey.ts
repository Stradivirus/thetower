import { useEffect } from 'react';

export default function useEscKey(handler: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 이벤트 버블링 방지 (중첩 모달 닫힘 방지용)
        e.stopPropagation(); 
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handler, enabled]);
}