/* eslint-disable */
// ───────────────────────────────────────────────────────────────
//  로컬 확인용 간편접수 목업 (개발 전용 · 배포 환경에서는 동작하지 않음)
//
//  간편접수는 실제 AI 호출이 있어야 동작하므로, API 없이 프런트 흐름
//  (주소·받는분·배송일시 자동 입력 → 지역 판정 → 상품 선택)을 확인하기 어렵다.
//  그래서 localhost 에서만 GORAESA_AI.extractInvitation 을 가로채
//  미리 준비한 예시값을 돌려준다.
//
//   · 실행 조건 : localhost / 127.0.0.1 에서 접속했을 때만
//   · 끄는 방법 : 주소 뒤에 ?mock=off 를 붙이면 실제 API 를 호출
//   · 값        : 누를 때마다 다음 예시로 넘어가며, 지역 제한 상황을 차례로 확인 가능
//
//  ※ 이 파일을 index.html 에서 빼면 기능이 완전히 사라진다(다른 코드 수정 불필요).
// ───────────────────────────────────────────────────────────────
(function () {
  if (typeof window === "undefined") return;

  var host = location.hostname;
  var isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "" ||
    /\.localhost$/.test(host) ||
    // 사설망 IP — 같은 와이파이의 휴대폰으로 확인할 때 (외부에 노출되지 않는 대역)
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);
  if (!isLocal) return;
  if (/[?&]mock=off(&|$)/.test(location.search)) return;
  if (!window.GORAESA_AI) return;

  function pad(n) { return String(n).padStart(2, "0"); }
  // 오늘로부터 d일 뒤 hh:mm 을 ISO8601(로컬) 로
  function inDays(d, hh, mm) {
    var t = new Date();
    t.setDate(t.getDate() + d);
    return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate()) + "T" + pad(hh) + ":" + pad(mm);
  }

  // 부고장 — 지역 반입 규칙의 주요 갈래를 차례로 확인할 수 있게 구성
  var OBITUARY = [
    { label: "제한 없음", deliveryAddress: "부산 해운대구 해운대로 875 해운대백병원 장례식장 3호실", recipient: "故 김철수 / 상주 김영민 / 010-2345-6789" },
    { label: "오브제만 반입", deliveryAddress: "서울 노원구 동일로 1342 더조은요양병원 장례식장 202호", recipient: "故 이순재 / 상주 이지훈 / 010-3456-7890" },
    { label: "근조바구니만 반입", deliveryAddress: "대구 북구 고성로 45 가톨릭병원 장례식장 3호실", recipient: "故 박정길 / 상주 박서준 / 010-4567-8901" },
    { label: "쌀화환만 반입", deliveryAddress: "경남 청도군 청도읍 청도장례식장 201호", recipient: "故 최영자 / 상주 최민호 / 010-5678-9012" },
    { label: "배송 불가 지역", deliveryAddress: "충남 계룡시 엄사면 계룡장례식장 101호", recipient: "故 정만수 / 상주 정해인 / 010-6789-0123" },
  ];

  // 청첩장 — 예식 일시가 배송일시로 들어가는지 확인용
  var WEDDING = [
    { label: "서울 예식장", deliveryAddress: "서울 강남구 테헤란로 123 그랜드웨딩홀 3층 그랜드볼룸", recipient: "신랑 박지훈 · 신부 이서연 / 010-2222-3333", days: 14, hh: 12, mm: 0 },
    { label: "부산 예식장", deliveryAddress: "부산 해운대구 센텀중앙로 55 센텀웨딩컨벤션 5층 라온홀", recipient: "신랑 김도윤 · 신부 정하은 / 010-4444-5555", days: 21, hh: 14, mm: 30 },
  ];

  var idx = { obituary: 0, wedding: 0 };
  function nextSample(type) {
    var list = type === "wedding" ? WEDDING : OBITUARY;
    var s = list[idx[type] % list.length];
    idx[type]++;
    return s;
  }

  window.GORAESA_AI.hasKey = function () { return true; }; // 키 입력창 건너뛰기
  window.GORAESA_AI.extractInvitation = function (opts) {
    var type = (opts && opts.type) === "wedding" ? "wedding" : "obituary";
    var s = nextSample(type);
    var result = { deliveryAddress: s.deliveryAddress, recipient: s.recipient, summary: "[목업] " + s.label };
    if (type === "wedding") result.ceremonyDateTime = inDays(s.days, s.hh, s.mm);
    console.info("[dev-mock] 간편접수 예시값 사용 (" + type + " · " + s.label + ") — 실제 호출은 ?mock=off");
    // 불러오는 중 표시를 볼 수 있도록 약간의 지연
    return new Promise(function (resolve) { setTimeout(function () { resolve(result); }, 600); });
  };

  console.info("[dev-mock] 로컬 간편접수 목업이 켜져 있습니다. 실제 API 호출은 주소에 ?mock=off 를 붙이세요.");
})();
