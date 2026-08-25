/* eslint-disable */
// 지역별 · 장소별 대체상품 반입 가이드 (장례식장 기준) — "지역별 반입상품 DB" 엑셀 원본을 코드화.
// rule 구조:
//   sido     시·도 표기 (안내문 표시용)
//   keywords 주소에 포함되어야 하는 지역명 (하나라도 포함 시 지역 일치)
//   venues   지정 장례식장명 목록. null 이면 지역 전체 적용, 배열이면 주소에 장소명까지 포함될 때만 적용
//   allowed  반입 가능 상품 kind 목록: "objet"(오브제) | "basket"(근조바구니) | "rice"(쌀화환) | "3dan"(일반 화환)
//   blocked  true 면 배송 불가 지역
//   note     상세 안내 문구 (엑셀 F열)
const REGION_RULES = [
  { sido: "서울", keywords: ["노원"], venues: ["더조은요양병원"], allowed: ["objet"], note: "근조 오브제 반입가능" },
  { sido: "부산", keywords: ["부산"], venues: ["영락공원", "원자력병원", "착한전문장례식장", "빌리브세웅병원", "좌천봉생병원", "중앙U병원", "중앙 U병원"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "대구", keywords: ["북구"], venues: ["가톨릭병원", "경북요양병원"], allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "울산", keywords: ["울주"], venues: ["하늘공원"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "세종", keywords: ["세종"], venues: ["은하수공원"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "경기·인천", keywords: ["수원"], venues: ["연화장"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "충남", keywords: ["예산"], venues: ["중앙장례식장"], allowed: ["rice"], note: "근조 쌀화환 반입가능" },
  { sido: "충남", keywords: ["계룡"], venues: null, blocked: true, note: "배송 불가 지역입니다" },
  { sido: "전남", keywords: ["여수"], venues: null, allowed: ["objet"], note: "근조 오브제 반입가능" },
  { sido: "전남", keywords: ["완도"], venues: null, allowed: ["rice"], note: "근조 쌀화환 반입가능" },
  { sido: "전남", keywords: ["신안"], venues: null, blocked: true, note: "배송 불가 지역입니다" },
  { sido: "전북", keywords: ["정읍", "남원"], venues: null, allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "전북", keywords: ["부안"], venues: null, allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "경남", keywords: ["창원", "마산"], venues: ["상복고", "마산의료원", "동마산병원"], allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "경남", keywords: ["양산"], venues: ["양산장례", "시민장례", "신세계병원"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "경남", keywords: ["밀양"], venues: ["밀양농협"], allowed: ["3dan", "basket", "rice"], note: "밀양농협은 3단·근조바구니·쌀화환 반입가능" },
  { sido: "경남", keywords: ["밀양"], venues: null, allowed: ["rice"], note: "밀양농협 외 장례식장은 쌀화환 반입가능" },
  { sido: "경남", keywords: ["사천"], venues: ["공설장례식장"], allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "경남", keywords: ["산청"], venues: null, allowed: ["rice"], note: "쌀화환 반입가능" },
  { sido: "경남", keywords: ["함안"], venues: ["하늘공원"], allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "경남", keywords: ["거창"], venues: null, allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "경남", keywords: ["거제"], venues: ["거붕백병원"], allowed: ["objet"], note: "오브제 반입가능" },
  { sido: "경남", keywords: ["창녕"], venues: ["공설장례식장"], allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "경남", keywords: ["고령"], venues: null, allowed: ["basket"], note: "근조바구니 반입가능" },
  { sido: "경남", keywords: ["청도"], venues: null, allowed: ["rice"], note: "청도 내에서는 근조 쌀화환만 제작·반입 가능" },
];

// 주소 문자열 → 매칭되는 rule 또는 null.
// 공백을 제거한 뒤 부분 문자열로 비교한다. venues 지정 행은 장소명까지 포함될 때만 매칭.
// blocked 행이 다른 행보다 우선, venues 매칭 행이 지역 전체 행보다 우선.
function matchRegionRule(addressText) {
  if (!addressText) return null;
  const addr = String(addressText).replace(/\s+/g, "");
  let regionWide = null;
  for (let i = 0; i < REGION_RULES.length; i++) {
    const r = REGION_RULES[i];
    if (!r.keywords.some((k) => addr.indexOf(k.replace(/\s+/g, "")) >= 0)) continue;
    if (r.blocked) return r;
    if (r.venues) {
      if (r.venues.some((v) => addr.indexOf(v.replace(/\s+/g, "")) >= 0)) return r;
    } else if (!regionWide) {
      regionWide = r;
    }
  }
  return regionWide;
}

Object.assign(window, { REGION_RULES, matchRegionRule });
