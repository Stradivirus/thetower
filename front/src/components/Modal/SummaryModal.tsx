/**
 * 파일명: thetower/front/src/components/Modal/SummaryModal.tsx
 * 용도: 사용자의 전체 게임 상태(모듈, 카드, 궁무)를 한눈에 보여주는 요약 모달
 * 기능: 하위 요약 컴포넌트들을 통합 레이아웃으로 배치, ESC 키 닫기 및 배경 클릭 닫기 지원
 */
import SummaryModules from './SummaryModules';
import { SummaryCards } from './SummaryCards';
import { SummaryWeapons } from './SummaryWeapons';
import useEscKey from '../../hooks/useEscKey';

interface Props {
  isOpen: boolean;                  // 모달 오픈 여부
  onClose: () => void;              // 모달 닫기 핸들러
  progress: Record<string, any>;    // 사용자의 진행도 데이터
}

export default function UwSummaryModal({ isOpen, onClose, progress }: Props) {
  // ESC 키 입력 시 모달 닫기 훅 사용
  useEscKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* 배경 오버레이 (클릭 시 닫힘) */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너: 내용물 크기에 맞춰 너비가 자동 조절됨 (w-fit) */}
      <div className={`relative w-fit max-w-[95vw] max-h-[90vh] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out pointer-events-auto flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>

        {/* 메인 컨텐츠 영역: 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          <div className="flex gap-6 items-start">
            
            {/* 왼쪽 섹션: 장착 중인 모듈 정보 (고정 너비) */}
            <div className="w-[480px] shrink-0">
               <SummaryModules />
            </div>
            
            {/* 오른쪽 섹션: 마스터리 카드 및 궁극 무기 현황 */}
            <div className="flex flex-col gap-4 min-w-0">
              <SummaryCards progress={progress} />
              <SummaryWeapons progress={progress} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}