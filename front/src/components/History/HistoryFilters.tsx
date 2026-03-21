/**
 * 파일명: front/src/components/History/HistoryFilters.tsx
 * 용도: 히스토리 페이지 상단 필터 및 뷰 모드 제어 컴포넌트
 * 기능: 티어 필터 배지 표시, 뷰 모드(그룹/리스트) 전환, 토너먼트 및 메모 필터링 버튼 제공
 */
import { Trophy, LayoutList, FolderOpen, StickyNote, X } from 'lucide-react';
import type { SetURLSearchParams } from 'react-router-dom';

interface Props {
  tierFilter: string | null;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  viewMode: 'group' | 'list';
  setViewMode: (mode: 'group' | 'list') => void;
  tournamentFilter: 'all' | 'include' | 'exclude';
  cycleTournamentFilter: () => void;
  onlyMemo: boolean;
  setOnlyMemo: (val: boolean) => void;
  Text: any; 
}

export default function HistoryFilters({
  tierFilter,
  searchParams,
  setSearchParams,
  viewMode,
  setViewMode,
  tournamentFilter,
  cycleTournamentFilter,
  onlyMemo,
  setOnlyMemo,
  Text
}: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar ml-auto">
        {tierFilter && (
          <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 rounded-lg px-3 py-1.5 mr-2">
            <span className="text-blue-400 text-xs font-bold">Tier {tierFilter}</span>
            <button
              onClick={() => {
                searchParams.delete('tier');
                setSearchParams(searchParams);
              }}
              className="text-blue-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('group')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'group' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            title={Text.PAGE.TOOLTIP_GROUP}
          >
            <FolderOpen size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            title={Text.PAGE.TOOLTIP_LIST}
          >
            <LayoutList size={16} />
          </button>
        </div>

        <div className="w-px h-8 bg-slate-800 mx-1"></div>

        <button
          onClick={cycleTournamentFilter}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs transition-all whitespace-nowrap shadow-sm min-w-[90px] justify-center ${
            tournamentFilter === 'include'
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              : tournamentFilter === 'exclude'
                ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy size={14} className={
            tournamentFilter === 'include' ? "text-yellow-400" :
              tournamentFilter === 'exclude' ? "text-rose-400" : "text-slate-500"
          } />
          <span className="font-medium">
            {tournamentFilter === 'include' ? Text.FILTER.TOURNAMENT_ONLY :
              tournamentFilter === 'exclude' ? Text.FILTER.TOURNAMENT_EXCLUDE : Text.FILTER.TOURNAMENT_ALL}
          </span>
        </button>

        <button
          onClick={() => {
            const nextOnlyMemo = !onlyMemo;
            setOnlyMemo(nextOnlyMemo);
            if (nextOnlyMemo) {
              setViewMode('list');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs transition-all whitespace-nowrap shadow-sm ${
            onlyMemo
              ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <StickyNote size={14} className={onlyMemo ? "text-blue-400" : "text-slate-500"} />
          <span>{Text.FILTER.MEMO_ONLY}</span>
        </button>
      </div>
    </div>
  );
}
