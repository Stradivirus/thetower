#!/usr/bin/env python3
import json
import re

# 파일 읽기
with open('research_data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# JavaScript 객체에서 JSON 부분 추출
json_start = content.find('{')
json_end = content.rfind('}') + 1
json_str = content[json_start:json_end]

# JSON 파싱
data = json.loads(json_str)

# 해금 패턴 정의 (티어/웨이브 관련 해금 조건)
unlock_patterns = [
    r'티어\s*\d+\s*웨이브\s*\d+.*해금',  # "티어 19 웨이브 500 해금"
    r'Tier\s*\d+.*[Ww]ave\s*\d+.*해금',  # "Tier 21 웨이브 60에서 해금"
]

# 기본 데이터와 해금 데이터 분리
base_labs = {}
unlock_labs = {}

for lab_name, lab_data in data['labs'].items():
    description_ko = lab_data.get('wikiDescriptionKo', '')
    
    # 해금 패턴이 있는지 확인
    has_unlock = False
    for pattern in unlock_patterns:
        if re.search(pattern, description_ko):
            has_unlock = True
            break
    
    if has_unlock:
        unlock_labs[lab_name] = lab_data
    else:
        base_labs[lab_name] = lab_data

# 기본 데이터 저장
base_data = {
    "version": data["version"],
    "updatedAt": data["updatedAt"],
    "notes": data["notes"],
    "timeUnit": data["timeUnit"],
    "labs": base_labs
}

# 해금 데이터 저장
unlock_data = {
    "version": data["version"],
    "updatedAt": data["updatedAt"],
    "notes": data["notes"] + " (Unlock Labs Only - Tier/Wave unlock requirements)",
    "timeUnit": data["timeUnit"],
    "labs": unlock_labs
}

# 기본 파일 저장 (새 파일로 생성)
with open('research_data_base.js', 'w', encoding='utf-8') as f:
    f.write('window.RESEARCH_DATA_BASE = ')
    f.write(json.dumps(base_data, ensure_ascii=False, indent=4))
    f.write(';\n')

# 해금 파일 저장 (새 파일로 생성)
with open('research_data_unlock.js', 'w', encoding='utf-8') as f:
    f.write('window.RESEARCH_DATA_UNLOCK = ')
    f.write(json.dumps(unlock_data, ensure_ascii=False, indent=4))
    f.write(';\n')

# 통계 출력
print(f"분리 완료!")
print(f"기본 연구소: {len(base_labs)}개")
print(f"해금 연구소: {len(unlock_labs)}개")
print(f"전체 연구소: {len(data['labs'])}개")
print(f"\n해금 연구소 예시:")
for i, (name, lab) in enumerate(list(unlock_labs.items())[:5]):
    desc = lab.get('wikiDescriptionKo', '')[:100]
    print(f"  - {name}: {desc}...")
