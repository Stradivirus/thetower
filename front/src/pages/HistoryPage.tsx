/**
 * 파일명: thetower/front/src/pages/HistoryPage.tsx
 * 용도: 과거 전투 기록 관리 및 성과 분석 페이지
 * 기능: 일간/주간/월간 성장 차트 표시, 월별 기록 그룹화, 다양한 필터링(토너먼트, 메모, 티어) 기능
 */
import { Archive, Loader2, Filter } from 'lucide-react';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import HistoryFilters from '../components/History/HistoryFilters';
import HistoryGroupView from '../components/History/HistoryGroupView';
import { useHistoryData } from '../hooks/useHistoryData';
import { T } from '../locales'; 

export default function HistoryPage() {
  const Text = T.history; 
  
  // 모든 데이터 처리 로직을 커스텀 훅으로 위임
  const {
    isLoading,
    weeklyStats,
    viewMode, setViewMode,
    tournamentFilter, cycleTournamentFilter,
    onlyMemo, setOnlyMemo,
    tierFilter, searchParams, setSearchParams,
    expandedMonths, toggleMonth,
    handleSelectReport,
    filteredReports,
    recentGroup,
    monthlyGroups,
    totalCount,
    isFilterActive
  } = useHistoryData();

  return (
    <>
      {/* 페이지 헤더 및 필터 컨트롤 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> {Text.PAGE.TITLE}
          <span className="text-sm font-normal text-slate-500 ml-2">
            {Text.PAGE.TOTAL_COUNT.replace('{n}', String(totalCount))}
          </span>
        </h2>
        
        <HistoryFilters 
          tierFilter={tierFilter}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          viewMode={viewMode}
          setViewMode={setViewMode}
          tournamentFilter={tournamentFilter}
          cycleTournamentFilter={cycleTournamentFilter}
          onlyMemo={onlyMemo}
          setOnlyMemo={setOnlyMemo}
          Text={Text}
        />
      </div>

      {/* 성장 분석 차트 (필터 미적용 및 그룹 뷰일 때만 표시) */}
      {!isFilterActive && viewMode === 'group' && (
        <div className="mb-6">
           <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
        </div>
      )}

      {/* 데이터 표시 영역 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>{Text.PAGE.LOADING}</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 그룹 뷰 모드 */}
          {viewMode === 'group' && (
              <>
                {/* 최근 7일 기록 섹션 */}
                {recentGroup && !isFilterActive && (
                    <div className="animate-fade-in mb-8">
                        <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            {Text.SECTION.RECENT_7DAYS}
                        </div>
                        <HistoryGroupView 
                          isFilterActive={isFilterActive}
                          recentGroup={recentGroup}
                          monthlyGroups={[]} 
                          expandedMonths={expandedMonths}
                          onToggleMonth={toggleMonth}
                          onSelectReport={handleSelectReport}
                        />
                    </div>
                )}

                {/* 월별 기록 그룹 섹션 */}
                <div className="animate-fade-in">
                    {!isFilterActive && (
                        <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                            <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
                            {Text.SECTION.MONTHLY}
                        </div>
                    )}
                    
                    <HistoryGroupView 
                      isFilterActive={isFilterActive}
                      recentGroup={null}
                      monthlyGroups={monthlyGroups}
                      expandedMonths={expandedMonths}
                      onToggleMonth={toggleMonth}
                      onSelectReport={handleSelectReport}
                    />
                </div>
              </>
          )}

          {/* 전체 리스트 뷰 모드 */}
          {viewMode === 'list' && (
              <div className="animate-fade-in">
                  <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <Filter size={12} />
                        {Text.SECTION.ALL_LIST.replace('{n}', String(filteredReports.length))}
                  </div>
                  <ReportList 
                      reports={filteredReports} 
                      onSelectReport={handleSelectReport}
                      hideHeader={false}
                      collapseThresholdDays={Infinity} 
                  />
              </div>
          )}

          {/* 검색 결과 없음 안내 */}
          {!isLoading && totalCount === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
              <p>{Text.PAGE.EMPTY_RESULT}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}