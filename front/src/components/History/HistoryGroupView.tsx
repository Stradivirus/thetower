/**
 * 파일명: front/src/components/History/HistoryGroupView.tsx
 * 용도: 히스토리 페이지의 그룹 보기 모드 렌더링 담당
 * 기능: 최근 7일 기록 그룹 및 월별 기록 그룹 리스트 표시
 */
import HistoryMonthGroup from './HistoryMonthGroup';
import type { MonthlyGroup } from '../../types/history';

interface Props {
  isFilterActive: boolean;
  recentGroup: MonthlyGroup | null;
  monthlyGroups: MonthlyGroup[];
  expandedMonths: Set<string>;
  onToggleMonth: (monthKey: string) => void;
  onSelectReport: (date: string) => void;
}

export default function HistoryGroupView({
  isFilterActive,
  recentGroup,
  monthlyGroups,
  expandedMonths,
  onToggleMonth,
  onSelectReport
}: Props) {
  return (
    <div className="animate-fade-in">
      <div className="space-y-3">
        {/* 최근 7일 그룹 */}
        {recentGroup && !isFilterActive && (
          <HistoryMonthGroup
            group={recentGroup}
            isExpanded={expandedMonths.has('recent')}
            onToggle={onToggleMonth}
            onSelectReport={onSelectReport}
          />
        )}

        {/* 월별 그룹 리스트 */}
        {monthlyGroups.map((group) => (
          <HistoryMonthGroup
            key={group.monthKey}
            group={group}
            isExpanded={expandedMonths.has(group.monthKey) || isFilterActive}
            onToggle={onToggleMonth}
            onSelectReport={onSelectReport}
          />
        ))}
      </div>
    </div>
  );
}
