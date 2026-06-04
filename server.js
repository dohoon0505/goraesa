/* eslint-disable */
// ───────────────────────────────────────────────────────────────
//  goraesa 로컬 서버 — 정적 파일 서빙 + OpenAI 프록시(/api/ai)
//
//  왜 필요한가: OpenAI는 브라우저에서의 직접 호출(CORS)을 막습니다.
//  같은 출처(same-origin)의 이 서버가 대신 호출하면 CORS 없이 동작하고,
//  키는 브라우저 → 이 서버 → OpenAI 로만 전달됩니다(깃/번들에 안 남음).
//
//  실행:  npm run dev   (기본 포트 3000)
//  키 우선순위:  요청 body.apiKey(간편접수 화면 입력)  →  환경변수 OPENAI_API_KEY
//  의존성 없음(Node 18+ 내장 fetch 사용).
//
//  ▶ 추후 별도 백엔드로 이전 시: config.jsx 의 proxyEndpoint 를 그 URL 로 바꾸면 됩니다.
// ───────────────────────────────────────────────────────────────
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// 서버 전용 키 저장소 (브라우저로는 절대 노출 금지 — 정적 서빙에서도 차단함)
const KEYSTORE = path.join(ROOT, "keystore.json");
function loadKeystoreKey() {
  try {
    const j = JSON.parse(fs.readFileSync(KEYSTORE, "utf8"));
    return (j && (j.openaiApiKey || j.OPENAI_API_KEY)) || "";
  } catch (_) { return ""; }
}
// 정적 서빙 금지 목록 (키/환경파일)
const SENSITIVE = /(^|[\\/])(keystore\.json|\.env)/i;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

// 부고장/청첩장 추출 프롬프트 (백엔드 역할 — 여기서 프롬프트를 소유)
const SHAPE = {
  obituary: `{
  "deliveryAddress": "장례식장명 + 빈소/호실 + 도로명주소를 한 줄로 (예: '○○병원 장례식장 301호 / 부산 동구 고관로 12')",
  "recipient": "상주 또는 고인 정보와 연락처를 한 줄로 (예: '故 홍길동 / 상주 홍철수 / 010-0000-0000'). 없으면 빈 문자열",
  "summary": "한 줄 요약"
}`,
  wedding: `{
  "deliveryAddress": "예식장명 + 홀/층 + 도로명주소를 한 줄로 (예: '○○웨딩홀 3층 그랜드볼룸 / 서울 강남구 테헤란로 1')",
  "recipient": "신랑·신부(또는 혼주) 성함과 연락처를 한 줄로 (예: '신랑 김○○ · 신부 이○○ / 010-0000-0000'). 없으면 빈 문자열",
  "ceremonyDateTime": "예식 일시를 ISO8601 로 (예: '2026-06-14T11:00'). 시간 정보가 없으면 날짜만, 전혀 없으면 빈 문자열",
  "summary": "한 줄 요약"
}`,
};

function buildInstructions(type) {
  const kind = type === "obituary" ? "부고장(장례 부고)" : "청첩장(결혼식 초대장)";
  return [
    `너는 한국어 ${kind}에서 화환 배송에 필요한 정보를 추출하는 도우미야.`,
    `주어진 링크(웹 검색 도구로 열람) 또는 붙여넣은 내용에서 정보를 찾아,`,
    `아래 JSON 형식의 키를 '그대로' 사용해서 값만 채워 출력해.`,
    `JSON 객체 하나만 출력하고, 그 외의 설명·문장·코드펜스는 절대 출력하지 마.`,
    `찾을 수 없는 값은 빈 문자열("")로 둬.`,
    SHAPE[type] || SHAPE.obituary,
  ].join("\n");
}

async function handleAI(req, res, raw) {
  let payload;
  try { payload = JSON.parse(raw || "{}"); }
  catch (_) { return send(res, 400, JSON.stringify({ error: "BAD_JSON" }), "application/json"); }

  const type = payload.type === "wedding" ? "wedding" : "obituary";
  const url = (payload.url || "").trim();
  const text = (payload.text || "").trim();
  // 키 우선순위: 환경변수 → keystore.json → (예외적으로) 요청 body
  const key = process.env.OPENAI_API_KEY || loadKeystoreKey() || payload.apiKey;
  if (!key) return send(res, 400, JSON.stringify({ error: "NO_KEY" }), "application/json");
  if (!url && !text) return send(res, 400, JSON.stringify({ error: "NO_INPUT" }), "application/json");

  const kindName = type === "wedding" ? "청첩장" : "부고장";
  const userInput = url
    ? `다음 ${kindName} 링크를 열어 정보를 추출해줘:\n${url}`
    : `다음 ${kindName} 내용에서 정보를 추출해줘:\n\n${text}`;

  const body = { model: MODEL, instructions: buildInstructions(type), input: userInput };
  if (url) body.tools = [{ type: "web_search" }];

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify(body),
    });
    const data = await r.text();
    send(res, r.status, data, "application/json");
  } catch (e) {
    send(res, 502, JSON.stringify({ error: "UPSTREAM", detail: String((e && e.message) || e) }), "application/json");
  }
}

const server = http.createServer((req, res) => {
  // ── OpenAI 프록시 ──
  if (req.url === "/api/ai") {
    if (req.method !== "POST") return send(res, 405, "Method Not Allowed");
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 2e6) req.destroy(); });
    req.on("end", () => { handleAI(req, res, raw); });
    return;
  }

  // ── 정적 파일 ──
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const safe = path.normalize(urlPath).replace(/^([.][.][/\\])+/, "");
  if (SENSITIVE.test(safe)) return send(res, 404, "Not Found"); // 키/환경파일 노출 차단
  const filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");
  fs.readFile(filePath, (err, buf) => {
    if (err) return send(res, 404, "Not Found");
    send(res, 200, buf, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`goraesa server (static + /api/ai) → http://localhost:${PORT}`);
});
