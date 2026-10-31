"""
파일명: thetower/back/crud/utils.py
용도: CRUD 로직 보조를 위한 공통 유틸리티 함수
기능: 게임 숫자 단위 변환 및 안전한 파싱
"""

def parse_game_number_safe(value_str: str) -> float:
    """
    게임 내 단위(K, M, B, T 등)가 포함된 문자열을 안전하게 실수형(float)으로 변환합니다.
    변환 실패 시 0.0을 반환합니다.
    """
    if not value_str: return 0.0
    clean_str = str(value_str).strip().replace(',', '')
    
    # 지원하는 접미사 및 배수 매핑
    multipliers = {
        'q': 10**15, 'Q': 10**18, 's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27, 'n': 10**30, 'N': 10**30,
        'd': 10**33, 'D': 10**33, 'U': 10**36,
        't': 10**12, 'T': 10**12, 'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 'k': 10**3, 'K': 10**3
    }
    
    multiplier = 1.0
    # 접미사 일치 여부 확인
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = float(mult)
            clean_str = clean_str[:-len(suffix)]
            break
            
    try:
        return float(clean_str) * multiplier
    except:
        return 0.0