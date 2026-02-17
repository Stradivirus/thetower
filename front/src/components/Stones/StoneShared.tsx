/**
 * 파일명: thetower/front/src/components/Stones/StoneShared.tsx
 * 용도: 스톤 계산기 탭들에서 공통으로 사용하는 스타일, 포맷터, 컴포넌트 정의
 * 기능: 일관된 테이블/카드 디자인 테마 제공, 숫자 포맷팅 유틸리티, 공통 초기화(Reset) 버튼 제공
 */
import { RotateCcw } from 'lucide-react';

/** 
 * 스톤 계산기 테마를 위한 공통 Tailwind CSS 클래스 모음
 */
export const stoneStyles = {
  th: "bg-slate-950/50 text-slate-400 font-medium px-2 py-1.5 border-b border-slate-800 whitespace-nowrap text-left text-sm",
  td: "px-2 py-1.5 text-slate-300 border-b border-slate-800/50 whitespace-nowrap font-mono cursor-pointer hover:text-white text-sm",
  tr: "hover:bg-blue-500/10 transition-colors last:border-0 cursor-pointer group",
  tableContainer: "w-full overflow-x-auto", 
  card: "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8 h-fit",
  uwHeader: "bg-slate-800/80 px-4 py-2 text-white font-bold text-sm border-b border-slate-700 flex justify-between items-center",
  descBox: "px-4 py-3 text-sm text-white font-medium bg-slate-950/50 border-b border-slate-800 leading-relaxed",
  tfootTd: "px-2 py-1.5 text-white font-bold bg-slate-800/50 border-t-2 border-slate-700 whitespace-nowrap text-sm"
};

/** 
 * 숫자를 1,000 단위 구분 기호가 포함된 문자열로 변환합니다.
 */
export const formatNum = (num: number) => num.toLocaleString();

interface ResetBtnProps {
  onClick: (e: React.MouseEvent) => void; // 클릭 핸들러
}

/** 
 * 개별 항목이나 섹션을 초기화할 때 사용하는 공통 리셋 버튼 컴포넌트
 */
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