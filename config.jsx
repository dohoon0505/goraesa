/* eslint-disable */
// ───────────────────────────────────────────────────────────────
//  간편접수(AI) 설정
//
//  ⚠️ 보안 주의
//   - 아래 apiKey 에 OpenAI 키를 직접 넣으면 git/배포물에 그대로 포함됩니다.
//     (사용자 승인 하에 임시 허용 — 추후 키 재발급 + 백엔드 프록시로 이전 예정)
//   - 키를 비워두면, 간편접수 버튼을 처음 누를 때 키 입력창이 뜨고
//     입력한 키는 이 브라우저 세션(sessionStorage)에만 저장됩니다.
//
//  ▶ 백엔드 전환 시
//     apiKey 는 비우고 proxyEndpoint 에 백엔드 URL 만 넣으면
//     프런트 코드 수정 없이 그대로 동작합니다.
//     (백엔드는 { type, url, text } 를 받아 OpenAI를 호출하고
//      { ...추출JSON } 또는 { output_text } / { text } 를 돌려주면 됩니다.)
// ───────────────────────────────────────────────────────────────
window.GORAESA_AI_CONFIG = {
  // 브라우저에서는 키를 두지 않습니다(노출 방지). 키는 server.js 가 keystore.json 에서 읽습니다.
  apiKey: "",

  // 사용할 모델 — 계정에서 사용 가능한 모델로 바꾸세요. (서버 OPENAI_MODEL 환경변수로도 지정 가능)
  // 예: "gpt-5", "gpt-5.5", "gpt-4.1", "gpt-4o"
  model: "gpt-4.1",

  // 프록시 주소. ⚠️ OpenAI는 브라우저 직접 호출(CORS)을 막으므로 프록시가 필요합니다.
  //  · 기본값 "/api/ai" = 함께 포함된 server.js (정적 서빙 + 프록시 겸용, npm run dev)
  //  · 추후 별도 백엔드를 만들면 그 URL 로 교체하세요.
  proxyEndpoint: "/api/ai",

  // 프록시(서버)가 키를 자체 보관 → true. 브라우저는 키를 입력/전송하지 않습니다.
  // 키는 keystore.json (서버 전용, .gitignore 처리)에 저장되어 server.js 만 읽습니다.
  proxyHoldsKey: true,
};
