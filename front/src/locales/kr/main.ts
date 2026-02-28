export const MAIN = {
  // 메인 페이지 (MainPage.tsx)
  PAGE: {
    SEARCH_PLACEHOLDER: "기록 검색... (메모, 티어, 처치자)",
    BTN_TOURNAMENT: "토너",
    BTN_SUMMARY: "궁무 및 모듈",
    BTN_SUMMARY_TOOLTIP: "내 궁극 무기 및 모듈 세팅 보기",
    NO_RESULT: "검색 결과가 없습니다.",
    LOAD_MORE: "이전 기록 더 보기 ({n}개)",
  },

  // 대시보드 위젯 (Dashboard.tsx)
  DASHBOARD: {
    // 기존
    RECENT_TITLE: "최근 전투 요약 (Last 3)",
    AVG_COIN: "평균 코인",
    AVG_CELL: "평균 셀",
    AVG_TIME: "평균 시간",
    // [New] 추가된 텍스트
    COIN_FLOW: "최근 코인 획득",
    TODAY: "Today",
    YESTERDAY: "어제",
    DAYS_AGO: "2일 전",
    RESOURCE_TODAY: "오늘 주요 자원",
    REROLL: "리롤",
    DEATH_REASON: "죽은 이유",
    RECENT_WEEK: "(최근 1주일)",
    DAMAGE_RANK: "딜 순위",
    DAMAGE_FREQ: "(많이 등장한 순)",
    NO_DATA: "데이터 없음",
  },

  // 티어 기록 위젯 (TierRecordWidget.tsx)
  WIDGET: {
    TITLE: "최고 웨이브", // 기존
    NO_RECORD: "기록 없음",     // 기존
    LAB_LINK: "연구실 (Laboratory)",
    // [New]
    TOGGLE_ON: "최고 기록 위젯 켜기",
    TOGGLE_OFF: "위젯 끄기",
    SETTINGS: "설정",
    MIN_TIER: "최소 티어:",
    MAX_TIER: "최대 티어:",
    COL_TIER: "티어",
    COL_MY: "내 기록",
    COL_MAX: "최고 기록",
    CLICK_INFO: "티어 클릭 시 해당 티어 기록으로 이동",
  },

  // 리스트 섹션 (ReportList.tsx)
  LIST: {
    TITLE: "전투 기록",
    // [New] PC 버전 헤더
    COL_TIME: "Time / Wave",
    COL_COINS: "Coins",
    COL_COIN_H: "Coin/h",
    COL_CELL_H: "Cell/h",
    COL_RES: "Res.",
    COL_RATIO: "Ratio",
    COL_DMG: "Damage & Killer",
    COL_MEMO: "Memo",
  },

  // 리스트 아이템 (ReportListItem.tsx)
  ITEM: {
    GAME_TIME: "게임 시간",
    REAL_TIME: "실시간",
    COINS: "코인",
    CELLS: "셀",
    WAVE: "Wave",
    TIER: "Tier",
    // [New]
    SHARDS: "Shards",
    LABEL_DW: "죽파",
    LABEL_SL: "스포트",
    LABEL_GB: "골봇",
    NO_DATA: "No Data",
    TOOLTIP_DW: "전체 적 중 죽음의 파동의 영향을 받은 적",
    TOOLTIP_SL: "전체 적 중 스포트라이트에서 죽은 적",
    TOOLTIP_GB: "전체 적 중 황금 봇에서 파괴된 적",
    TOOLTIP_KILLER: "Killed by",
  }
};