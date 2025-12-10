# 통계 캐시용 (간단한 인메모리 저장소)
_stats_cache = {}
CACHE_EXPIRE_MINUTES = 10

def parse_game_number_safe(value_str: str) -> float:
    if not value_str: return 0.0
    clean_str = str(value_str).strip().replace(',', '')
    multipliers = {
        'q': 10**15, 'Q': 10**18, 's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27, 'n': 10**30, 'N': 10**30,
        'd': 10**33, 'D': 10**33, 'U': 10**36,
        't': 10**12, 'T': 10**12, 'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 'k': 10**3, 'K': 10**3
    }
    multiplier = 1.0
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = float(mult)
            clean_str = clean_str[:-len(suffix)]
            break
    try:
        return float(clean_str) * multiplier
    except:
        return 0.0