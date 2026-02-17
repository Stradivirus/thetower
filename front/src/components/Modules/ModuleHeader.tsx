/**
 * 파일명: thetower/front/src/components/Modules/ModuleHeader.tsx
 * 용도: 모듈 관리 페이지 상단 컨트롤 바
 * 기능: 장착/인벤토리/리롤 탭 전환, 변경 사항 저장 및 요약 버튼 제공, 스티키 헤더 적용
 */
import { List, Layers, Box, Dices } from 'lucide-react';

interface Props {
  handleSave: () => void;                                // 저장 버튼 클릭 핸들러
  isChanged: boolean;                                    // 변경 사항 존재 여부
  token: string | null;                                  // 로그인 토큰 (버튼 활성화 여부 결정)
  viewMode: 'equipped' | 'inventory' | 'reroll';         // 현재 선택된 뷰 모드
  setViewMode: (mode: 'equipped' | 'inventory' | 'reroll') => void; // 모드 변경 함수
}

export default function ModuleHeader({ 
  handleSave, isChanged, token,
  viewMode, setViewMode 
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-950/95 backdrop-blur z-50 shadow-md">
      
      {/* 탭 전환 버튼 그룹 */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        {/* 장착 정보 탭 */}
        <button
          onClick={() => setViewMode('equipped')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'equipped' 
              ? 'bg-slate-700 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers size={16} /> Equipped
        </button>
        {/* 인벤토리 탭 */}
        <button
          onClick={() => setViewMode('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'inventory' 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Box size={16} /> Inventory
        </button>
        {/* 리롤 시뮬레이션 탭 */}
        <button
          onClick={() => setViewMode('reroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'reroll' 
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Dices size={16} /> Reroll Sim
        </button>
      </div>

      {/* 액션 버튼 그룹 (리롤 모드가 아닐 때만 노출) */}
      {viewMode !== 'reroll' && (
        <button 
          onClick={handleSave}
          disabled={!token}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border text-sm
            ${token
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' 
              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
          `}
        >
          <List size={16} /> {isChanged ? 'Save & Summary*' : 'Save & Summary'}
        </button>
      )}
    </div>
  );
}