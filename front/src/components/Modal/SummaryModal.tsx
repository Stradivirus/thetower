import { X, Trophy } from 'lucide-react';
import { SummaryModules } from './SummaryModules';
import { SummaryCards } from './SummaryCards';
import { SummaryWeapons } from './SummaryWeapons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<string, any>;
  modulesState?: Record<string, any>;
}

export default function UwSummaryModal({ isOpen, onClose, progress, modulesState = {} }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너 - 중앙 배치 */}
      <div className={`relative w-full max-w-[1550px] h-[90vh] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out pointer-events-auto flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>

        {/* 메인 컨텐츠 - 3단 레이아웃 */}
        <div className="flex-1 overflow-hidden flex gap-4 p-6">
          {/* 왼쪽: 장착된 모듈 */}
          <SummaryModules modulesState={modulesState} progress={progress} />
          
          {/* 오른쪽: 카드 + 궁무 */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <SummaryCards progress={progress} />
            <SummaryWeapons progress={progress} />
          </div>
        </div>
      </div>
    </div>
  );
}