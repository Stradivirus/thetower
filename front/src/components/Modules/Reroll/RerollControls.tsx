/**
 * 파일명: thetower/front/src/components/Modules/Reroll/RerollControls.tsx
 * 용도: 리롤 시뮬레이터 상단의 실행 및 옵션 설정 컨트롤러
 * 기능: 타겟 등급(Min Target Rarity) 설정, 시뮬레이션 시작/정지/초기화, 연구(Lab) 밴 기능 설정
 */
import { Play, Pause, RotateCcw, FlaskConical } from 'lucide-react';
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';

interface Props {
  minTargetRarity: number;               // 최소 타겟 등급
  setMinTargetRarity: (r: number) => void; // 타겟 등급 변경 핸들러
  isSimulating: boolean;                 // 실행 중 여부
  toggleSimulation: () => void;          // 실행 토글 핸들러
  canRoll: boolean;                      // 리롤 가능 여부 (타겟 설정 확인)
  onReset: () => void;                   // 초기화 핸들러
  banCount: number;                      // 현재 설정된 밴 개수
  setBanCount: (n: number) => void;      // 밴 개수 변경 핸들러
  maxBans: number;                       // 최대 허용 밴 개수
}

export default function RerollControls({ 
  minTargetRarity, 
  setMinTargetRarity, 
  isSimulating, 
  toggleSimulation,
  canRoll,
  onReset,
  banCount,
  setBanCount,
  maxBans
}: Props) {
  
  const targetRarities = [RARITY.EPIC, RARITY.LEGENDARY, RARITY.MYTHIC, RARITY.ANCESTRAL];

  /** 등급 버튼의 시각적 스타일을 반환합니다. */
  const getRarityBtnStyle = (targetRarity: number) => {
    const isSelected = minTargetRarity === targetRarity;
    let baseStyle = "border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800";
    if (isSelected) {
      switch(targetRarity) {
        case RARITY.EPIC: return "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
        case RARITY.LEGENDARY: return "border-yellow-500 bg-yellow-500/20 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
        case RARITY.MYTHIC: return "border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
        case RARITY.ANCESTRAL: return "border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
      }
    }
    return baseStyle;
  };

  return (
    <div className="w-full flex flex-col gap-3 mb-3 shrink-0">
      
      {/* 1. 등급 선택 및 실행/초기화 버튼 영역 */}
      <div className="w-full grid grid-cols-6 gap-2 h-10">
        {targetRarities.map((r) => (
          <button
            key={r}
            onClick={() => setMinTargetRarity(r)}
            disabled={isSimulating}
            className={`rounded flex items-center justify-center text-[10px] font-bold uppercase transition-all border ${getRarityBtnStyle(r)} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {RARITY_LABELS[r]}
          </button>
        ))}

        {/* 실행/정지 버튼 */}
        <button
          onClick={toggleSimulation}
          disabled={!canRoll && !isSimulating}
          className={`rounded flex items-center justify-center font-bold text-xs transition-all border ${isSimulating ? 'bg-rose-500 border-rose-600 text-white' : 'bg-green-500 border-green-600 text-slate-900'} disabled:opacity-30`}
        >
          {isSimulating ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5"/>}
        </button>

        {/* 초기화 버튼 */}
        <button
          onClick={onReset}
          disabled={isSimulating}
          className="rounded flex items-center justify-center font-bold text-xs transition-all border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 2. 연구실 효과: 밴(Ban) 개수 선택 영역 */}
      <div className="flex items-center gap-2 bg-slate-950/30 border border-slate-800/50 rounded-lg p-2">
        <div className="flex items-center gap-1.5 text-slate-500 mr-2 shrink-0">
          <FlaskConical size={14} className="text-cyan-400" />
          <span className="text-[10px] font-bold uppercase">Lab: Ban</span>
        </div>
        
        <div className="flex-1 flex gap-1">
          {Array.from({ length: maxBans + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setBanCount(i)}
              disabled={isSimulating}
              className={`
                flex-1 h-6 rounded text-[10px] font-bold transition-all border
                ${banCount === i
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }
                disabled:opacity-30
              `}
            >
              {i === 0 ? '-' : i}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}