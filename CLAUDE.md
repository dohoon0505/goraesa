# CLAUDE.md

EBS/GRS 거래처 경조사 접수센터 — 무빌드(no-build) 정적 웹앱.
빌드 도구·프레임워크 없이 브라우저가 바로 실행하는 순수 JavaScript로 되어 있다.

## 실행

```bash
npm run dev      # node server.js → http://localhost:3000
```

`server.js`는 Node 기본 모듈만 쓰므로 `npm install` 없이 실행된다.
정적 서빙과 `/api/ai` 프록시(간편접수용)를 함께 담당한다.

## 구조

`index.html`이 아래 순서로 스크립트를 로드한다. **순서가 의존관계다.**

| 파일 | 역할 |
| --- | --- |
| `js/config.js` | 간편접수(AI) 설정 — 모델, 프록시 주소 |
| `js/ai.js` | `window.GORAESA_AI` — 프록시 호출 + 응답 JSON 파싱 |
| `js/icons.js` | `window.I` — 인라인 SVG 아이콘 |
| `js/data.js` | 상품 카탈로그(CATEGORIES/SECTIONS), 홈 구성, FAQ, 신청내역 데모, SITE_INFO |
| `js/region-rules.js` | 지역별 반입상품 규칙 + `matchRegionRule(주소)` |
| `js/ribbon-guide.js` | 리본문구 작성가이드 |
| `js/faq-data.js` | FAQ 원본 |
| `js/site-info.js` | SITE_INFO → document.title·OG 메타 주입 |
| `js/app.js` | 전 화면·시트·라우팅 (단일 IIFE) |
| `js/dev-mock.js` | 로컬 전용 간편접수 목업 (배포 환경에서는 자동으로 꺼짐) |

CSS는 `css/colors_and_type.css`(디자인 토큰·폰트) → `css/app.css`(전체 스타일) 순.
폰트는 `fonts/`, 이미지는 `img/`에 있으며 **둘 다 없으면 화면이 깨진다.**

## app.js 규칙

- **`el(tag, props, ...children)`** — DOM 생성 헬퍼. `onClick` 같은 `on*` 키는 이벤트로,
  `class`/`style`/`html`/`dataset`은 특수 처리된다. React 대신 이걸 쓴다.
- **`mountOverlay(build, escapeAllowed)`** — 모달·바텀시트 공통 마운트.
  scrim + Escape + body 스크롤 잠금을 처리한다. 시트를 새로 만들 땐 반드시 이걸 경유.
- **`S`** — 앱 상태. 화면을 다시 그려도 유지되어야 하는 값은 전부 여기 둔다.
  특히 `S.orderForm`(주문서 입력값)은 상품 선택하러 상품목록에 다녀와도 살아 있어야 하므로
  화면 지역 변수로 되돌리면 안 된다.
- **`go(route)`** — 라우팅. 해시(`#items`/`#order`/`#history`)와 동기화된다.
  수동으로 `location.hash`만 바꾸면 다시 그려지지 않는다.
- 화면은 `buildHomeScreen` / `buildItemsScreen` / `buildOrderScreen` / `buildHistoryScreen`.
  시트는 `open*` 접두사(`openProductPicker`, `openChoiceSheet`, `openQuickIntake` 등).
- 목록에서 하나 고르는 시트는 **`openChoiceSheet`를 재사용**한다(최근작성·받는 분 선택).

## 도메인 규칙

- **지역별 반입 제한** — 주소를 `matchRegionRule()`에 넣으면 규칙을 돌려준다.
  제한 지역은 반입 가능한 상품만 노출하고, 배송 불가 지역(계룡·신안)은 신청을 차단한다.
  규칙 원본은 「지역별 반입상품 DB」 엑셀이며 `js/region-rules.js`에 코드화되어 있다.
- **대체상품** — 근조바구니·쌀화환·오브제. 상품에 `kind`(basket/rice/objet)와
  `substitute: true`가 붙어 있고, 지역 규칙의 `allowed`와 매칭된다. 상품목록에는 상시 노출된다.
- **경조사어 자동 입력** — 근조는 「삼가 故人의 冥福을 빕니다」,
  결혼은 받는 분이 신랑측이면 「祝結婚 (축결혼)」·신부측이면 「祝華婚 (축화혼)」.
  **이미 입력된 문구는 덮어쓰지 않는다.**
- **간편접수 받는 분** — AI가 `"故 김철수 / 상주 김영민"`처럼 한 줄로 내려주므로
  `parseRecipientOptions()`가 사람 단위로 쪼개 선택지로 보여준다. 연락처는 선택 사항.

## 확인 방법

UI 변경은 **미리보기 패널**에서 확인한다. 자동 점검이 필요하면 Playwright로
375~390px 뷰포트에서 실제 흐름(간편접수 → 받는 분 선택 → 상품 선택)을 돌려본다.
스플래시가 3초라 페이지 로드 후 약 4초 대기가 필요하다.

`js/dev-mock.js` 덕분에 API 없이도 간편접수를 확인할 수 있다.
localhost·사설망 IP에서만 켜지고, `?mock=off`를 붙이면 실제 API를 호출한다.
누를 때마다 다음 예시로 넘어가며 지역 제한 상황을 차례로 확인할 수 있다.

## 주의

- **API 키를 저장소에 두지 않는다.** `keystore.json`은 제거되었고 `.gitignore`에 있다.
  키는 서버 환경변수 `OPENAI_API_KEY`로 넣는다.
- `*.zip`(전달용 압축본)은 커밋하지 않는다. `git add -A` 전에 `git status`를 확인할 것.
- **신청 전송은 아직 미구현이다.** `send()`는 안내 문구만 띄운다.
  백엔드 연동 시 [신청인 정보 + 주문 폼]을 보내야 하며, 상품은 표시용 문자열이 아니라
  상품 ID를 함께 실어야 한다. 상세는 `backend-handoff.docx` 참고.

## 문서

- `Front_Update.docx` — 프론트 변경사항 정리 + 하단 [백엔드 영역 참고자료]
- `backend-handoff.docx` — 백엔드 연동 인수인계(워크플로·DB·API)
