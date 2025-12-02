import { RotateCcw } from 'lucide-react';

// 1. 공통 스타일 정의
export const stoneStyles = {
  // [수정] text-sm 추가
  th: "bg-slate-950/50 text-slate-400 font-medium px-2 py-1.5 border-b border-slate-800 whitespace-nowrap text-left text-sm",
  
  // [수정] text-sm 추가
  td: "px-2 py-1.5 text-slate-300 border-b border-slate-800/50 whitespace-nowrap font-mono cursor-pointer hover:text-white text-sm",
  
  tr: "hover:bg-blue-500/10 transition-colors last:border-0 cursor-pointer group",
  tableContainer: "w-full overflow-x-auto", 
  card: "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8 h-fit",
  
  // uwHeader는 이미 text-sm이 들어있음
  uwHeader: "bg-slate-800/80 px-4 py-2 text-white font-bold text-sm border-b border-slate-700 flex justify-between items-center",
  
  // descBox도 text-sm 유지
  descBox: "px-4 py-3 text-sm text-white font-medium bg-slate-950/50 border-b border-slate-800 leading-relaxed",
  
  // [수정] text-sm 추가
  tfootTd: "px-2 py-1.5 text-white font-bold bg-slate-800/50 border-t-2 border-slate-700 whitespace-nowrap text-sm"
};

// 2. 공통 포맷 함수
export const formatNum = (num: number) => num.toLocaleString();

// 3. 공통 리셋 버튼 컴포넌트
interface ResetBtnProps {
  onClick: (e: React.MouseEvent) => void;
}

export function ResetButton({ onClick }: ResetBtnProps) {
  return (
    <button 
      onClick={onClick}
      className="text-[10px] flex items-center gap-1 text-rose-500 hover:text-rose-400 transition-colors ml-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500/50 font-bold"
    >
      <RotateCcw size={10} /> Reset
    </button>
  );
}