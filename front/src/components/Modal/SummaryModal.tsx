import SummaryModules from './SummaryModules';
import { SummaryCards } from './SummaryCards';
import { SummaryWeapons } from './SummaryWeapons';
import useEscKey from '../../hooks/useEscKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<string, any>;
}

export default function UwSummaryModal({ isOpen, onClose, progress }: Props) {
  useEscKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* [Layout 변경 핵심]
         w-full -> w-fit : 모달이 강제로 늘어나지 않고 내용물 크기에 딱 맞게 줄어듦 (오른쪽 여백 제거)
         max-w-[1650px] -> max-w-[95vw] : 화면보다 커지는 것만 방지
      */}
      <div className={`relative w-fit max-w-[95vw] max-h-[90vh] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out pointer-events-auto flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          <div className="flex gap-6 items-start">
            
            {/* 왼쪽: 모듈 (고정 너비) */}
            <div className="w-[480px] shrink-0">
               <SummaryModules />
            </div>
            
            {/* 오른쪽: 카드 + 궁무 
                flex-1 대신 w-max나 기본 동작을 사용하여 
                카드가 배치된 만큼만 너비를 차지하게 함
            */}
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