/**
 * 파일명: thetower/front/src/hooks/useEscKey.ts
 * 용도: ESC 키 입력을 감지하여 특정 동작을 수행하는 커스텀 훅
 * 기능: 모달 닫기 등 키보드 인터랙션 지원 및 이벤트 버블링 방지
 */
import { useEffect } from 'react';

/** 
 * ESC 키가 눌렸을 때 실행할 핸들러를 등록합니다.
 * @param handler 실행할 함수
 * @param enabled 활성화 여부 (기본 true)
 */
export default function useEscKey(handler: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 이벤트 버블링 방지 (중첩된 모달이 동시에 닫히는 것을 방지)
        e.stopPropagation(); 
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handler, enabled]);
}