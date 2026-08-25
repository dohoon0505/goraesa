/* eslint-disable */
// ───────────────────────────────────────────────────────────────
//  Vanilla JS 전환본 (React/Babel 제거). DOM 구조·className·동작을
//  app.jsx 와 1:1로 재현 → app.css 무수정으로 디자인 100% 동일.
//  (개발자 TweaksPanel·관리자 postMessage 미리보기 연동은 제외)
// ───────────────────────────────────────────────────────────────
(function () {
  const I = window.I;

  // ---------- 상수 ----------
  const PHONE = (window.SITE_INFO && window.SITE_INFO.phone) || "010-0000-0000";
  const PHONE_HREF = "tel:" + PHONE.replace(/[^\d]/g, "");
  const APPLICANT_KEY = "goraesa_applicant";
  const APPLICANT_TTL = 30 * 24 * 60 * 60 * 1000; // 30일

  // ---------- 유틸 ----------
  const fmt = (n) => n.toLocaleString("ko-KR");
  const isFramedImg = (src) => /tab[123]_/.test(src || "");

  function loadApplicant() {
    try {
      const data = JSON.parse(localStorage.getItem(APPLICANT_KEY) || "null");
      if (!data || !data.savedAt) return null;
      if (Date.now() - data.savedAt > APPLICANT_TTL) { localStorage.removeItem(APPLICANT_KEY); return null; }
      return data;
    } catch (_) { return null; }
  }
  function saveApplicant(info) {
    const rec = Object.assign({}, info, { savedAt: Date.now() });
    try { localStorage.setItem(APPLICANT_KEY, JSON.stringify(rec)); } catch (_) {}
    return rec;
  }
  function fmtDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function formatDateKR(s) {
    if (!s) return "";
    const p = s.split("-").map(Number);
    const dt = new Date(p[0], p[1] - 1, p[2]);
    const dow = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
    return p[0] + "." + String(p[1]).padStart(2, "0") + "." + String(p[2]).padStart(2, "0") + " (" + dow + ")";
  }
  function computeInstantDelivery(base) {
    const now = base || new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    let target;
    if (mins >= 18 * 60 + 30) target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 30);
    else if (mins < 9 * 60) target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30);
    else { target = new Date(now.getTime() + 3 * 60 * 60 * 1000); if (target.getMinutes() >= 30) target.setHours(target.getHours() + 1); target.setMinutes(0, 0, 0); }
    return { date: fmtDate(target), time: String(target.getHours()).padStart(2, "0") + ":" + String(target.getMinutes()).padStart(2, "0") };
  }
  function parseISOToDateTime(iso) {
    if (!iso || typeof iso !== "string") return null;
    const hasTime = iso.includes("T") || /\d{1,2}:\d{2}/.test(iso);
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return null;
    const date = fmtDate(dt);
    if (!hasTime) return { date, time: "" };
    return { date, time: String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0") };
  }
  // 색상 헬퍼 (브랜드색 CSS 변수 파생)
  function hexToRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join(""); }
  function shade(hex, amt) { const c = hexToRgb(hex); return rgbToHex(c[0] * (1 + amt), c[1] * (1 + amt), c[2] * (1 + amt)); }
  function tint(hex, amt) { const c = hexToRgb(hex); return rgbToHex(c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt); }

  // ---------- DOM 헬퍼 ----------
  function append(node, child) {
    if (child == null || child === false || child === true) return;
    if (Array.isArray(child)) { child.forEach((c) => append(node, c)); return; }
    if (child instanceof Node) { node.appendChild(child); return; }
    node.appendChild(document.createTextNode(String(child)));
  }
  function el(tag, props) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "style") { if (typeof v === "string") node.style.cssText = v; else Object.assign(node.style, v); }
        else if (k === "html") node.innerHTML = v;
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k.length > 2 && k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "value" || k === "checked" || k === "disabled") node[k] = v;
        else node.setAttribute(k, v);
      }
    }
    for (let i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  // ---------- 앱 상태 ----------
  const S = {
    route: (function () {
      // 새로고침 시 현재 화면 유지(해시), 해시 없는 최초 접속은 홈
      const h = (location.hash || "").replace("#", "");
      if (h === "items" || h === "history") return h;
      if (h === "order" && loadApplicant()) return "order";
      return "home";
    })(),
    activeTab: "tab1",
    // 주문서 입력값 — 상품 선택을 위해 상품목록으로 다녀와도 유지되도록 화면 밖(S)에 보관
    orderForm: { product: "", deliveryDate: "", deliveryTime: "", address: "", recipient: "", sender: "", message: "", reason: "" },
    pickMode: false, // 주문서에서 넘어온 '상품 선택' 상태
    pendingIntake: null, // 홈에서 간편접수한 결과 — 주문서가 열릴 때 반영
    applicant: loadApplicant(),
  };
  let pendingRoute = null;

  let frameEl, screenHostEl, appbarTitleEl, appbarBackBtnHost, appbarEl, bottomNavBtns;

  // ---------- 테마 (브랜드색/다크 — 기본값, 현행 라이브와 동일) ----------
  function applyTheme() {
    const brand = "#4F46E5", dark = false;
    const root = document.documentElement;
    root.style.setProperty("--p-indigo-500", brand);
    root.style.setProperty("--p-indigo-600", shade(brand, -0.12));
    root.style.setProperty("--p-indigo-700", shade(brand, -0.24));
    root.style.setProperty("--p-indigo-50", tint(brand, 0.92));
    root.style.setProperty("--p-indigo-100", tint(brand, 0.80));
    root.style.setProperty("--p-indigo-300", tint(brand, 0.45));
    root.style.setProperty("--p-indigo-400", tint(brand, 0.25));
    root.dataset.theme = dark ? "dark" : "light";
  }

  // ---------- 오버레이(모달/시트) 마운트 ----------
  function mountOverlay(build, escapeAllowed) {
    const holder = document.createElement("div");
    let closed = false;
    const onKey = (e) => { if (e.key === "Escape" && (!escapeAllowed || escapeAllowed())) close(); };
    function close() {
      if (closed) return; closed = true;
      if (openDropdown) openDropdown(false); // body 에 떠 있는 드롭다운이 남지 않도록
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (holder.parentNode) holder.parentNode.removeChild(holder);
    }
    build(holder, close);
    document.body.appendChild(holder);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return { close };
  }

  // ---------- App bar / LiveDelivery / BottomNav ----------
  function buildLiveDelivery() {
    const dot = el("span", { class: "live-dot", "aria-hidden": "true" });
    const label = el("span", { class: "live-label" });
    const root = el("div", { role: "status", "aria-live": "polite" },
      dot, el("span", { class: "live-text" }, label));
    function update() {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const isOpen = mins >= 9 * 60 && mins < 18 * 60 + 30;
      root.className = "live " + (isOpen ? "open" : "closed");
      dot.innerHTML = "";
      if (isOpen) dot.appendChild(el("span", { class: "live-pulse" }));
      label.textContent = isOpen ? "당일배송 가능" : "당일배송 마감";
    }
    update();
    setInterval(update, 30 * 1000);
    return root;
  }
  function buildAppBar() {
    appbarBackBtnHost = el("span");
    appbarTitleEl = el("div", { class: "pagetitle" }, "경조사 접수센터");
    appbarEl = el("div", { class: "appbar" },
      appbarBackBtnHost,
      appbarTitleEl,
      el("div", { class: "grow" }),
      buildLiveDelivery(),
      el("a", { class: "iconbtn", href: PHONE_HREF, "aria-label": "전화 걸기" }, I.Phone())
    );
    return appbarEl;
  }
  function updateAppBar() {
    let title = null, onBack = null;
    if (S.route === "items") { title = S.pickMode ? "상품 선택" : "상품목록"; onBack = () => go(S.pickMode ? "order" : "home"); }
    if (S.route === "order") { title = "주문하기"; onBack = () => go("home"); }
    if (S.route === "history") { title = "신청내역"; onBack = () => go("home"); }
    appbarTitleEl.textContent = title || "경조사 접수센터";
    appbarBackBtnHost.innerHTML = "";
    if (onBack) appbarBackBtnHost.appendChild(el("button", { class: "iconbtn", onClick: onBack, "aria-label": "뒤로 가기" }, I.Back()));
  }
  function buildBottomNav() {
    const tabs = [
      { id: "home", label: "홈", icon: I.Home },
      { id: "items", label: "상품목록", icon: I.List },
      { id: "order", label: "신청하기", icon: I.Order },
      { id: "history", label: "신청내역", icon: I.Doc },
    ];
    bottomNavBtns = [];
    const nav = el("nav", { class: "bottomnav", "aria-label": "기본 메뉴" });
    tabs.forEach((t) => {
      const btn = el("button", { onClick: () => go(t.id) }, t.icon({ size: 22 }), el("span", null, t.label));
      btn._tabId = t.id;
      bottomNavBtns.push(btn);
      nav.appendChild(btn);
    });
    return nav;
  }
  function updateBottomNav() {
    bottomNavBtns.forEach((btn) => {
      const active = S.route.startsWith(btn._tabId);
      btn.className = active ? "on" : "";
      if (active) btn.setAttribute("aria-current", "true"); else btn.removeAttribute("aria-current");
    });
  }

  // ---------- 신청인 카드 ----------
  function buildApplicantCard(applicant, onEdit) {
    if (!applicant) return null;
    const meta = [applicant.company, applicant.dept, applicant.position].filter(Boolean).join(" · ");
    return el("section", { class: "applicant-card" },
      el("div", { class: "applicant-card-head" },
        el("span", { class: "applicant-card-label" }, I.User({ size: 13, strokeWidth: 2.2 }), " 신청인 정보"),
        el("button", { type: "button", class: "applicant-card-edit", onClick: onEdit }, I.Edit({ size: 12, strokeWidth: 2.2 }), " 수정")
      ),
      el("div", { class: "applicant-card-name" }, applicant.name, applicant.contact ? el("span", { class: "applicant-card-contact" }, applicant.contact) : null),
      meta ? el("div", { class: "applicant-card-meta" }, meta) : null
    );
  }

  // ---------- HOME FAQ ----------
  function buildHomeFaqItem(item) {
    let open = false;
    const iconWrap = el("span", { class: "faq-icon", "aria-hidden": "true" }, I.Plus({ size: 18 }));
    const root = el("div", { class: "faq-item" });
    const ansHost = el("span"); // placeholder, answer 추가/제거
    const btn = el("button", { class: "faq-q", "aria-expanded": "false", onClick: toggle },
      el("span", { class: "faq-q-text" }, el("span", { class: "faq-q-title" }, item.q)), iconWrap);
    root.appendChild(btn);
    let ansEl = null;
    function toggle() {
      open = !open;
      root.className = "faq-item " + (open ? "open" : "");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      iconWrap.innerHTML = "";
      iconWrap.appendChild(open ? I.Minus({ size: 18 }) : I.Plus({ size: 18 }));
      if (open) { ansEl = el("div", { class: "faq-a" }, item.a); root.appendChild(ansEl); }
      else if (ansEl) { root.removeChild(ansEl); ansEl = null; }
    }
    return root;
  }

  // ---------- HOME ----------
  function buildHomeScreen() {
    const HS = window.HOME_SECTIONS || [];
    const hero = (HS.find((s) => s && s.type === "hero") || {}).data || {};
    const faqHome = (HS.find((s) => s && s.type === "faq") || {}).data || {};

    const heroHeadline = hero.storeName || hero.title || "대한민국 어디든";
    const heroSubhead = hero.storeDesc || hero.body || "아름다운 마음을 대한민국 전국 어디든지 보내드립니다\n10년 경력의 노하우를 그대로";

    const allFaqs = (window.FAQS && window.FAQS.length > 0) ? window.FAQS : (window.FAQ_ITEMS || []);
    const pickedFaqs = (faqHome.pickedIds && faqHome.pickedIds.length > 0)
      ? faqHome.pickedIds.map((id) => allFaqs.find((f) => f.id === id || f.faqId === id)).filter(Boolean) : [];
    const homeFaqTitle = faqHome.title || "자주 묻는 질문";

    // hero
    const h2 = el("h2");
    String(heroHeadline).split(/\r?\n/).forEach((line, i, arr) => { h2.appendChild(document.createTextNode(line)); if (i < arr.length - 1) h2.appendChild(el("br")); });
    if (!hero.storeName && !hero.title) { h2.appendChild(el("br")); h2.appendChild(el("em", null, "3시간 당일배송")); }
    const heroP = el("p");
    heroSubhead.split(/\r?\n/).forEach((line, i, arr) => { heroP.appendChild(document.createTextNode(line)); if (i < arr.length - 1) heroP.appendChild(el("br")); });
    const heroSec = el("section", { class: "hero" }, h2, heroP, buildApplicantCard(S.applicant, openEditApplicant));

    // categories
    const catlist = el("div", { class: "catlist" });
    window.CATEGORIES.forEach((c) => {
      const count = window.SECTIONS[c.id].filter((s) => !s.regionOnly).reduce((a, s) => a + s.items.length, 0);
      catlist.appendChild(el("button", { class: "cat", onClick: () => openCat(c.id) },
        el("span", { class: "thumb" }, el("img", { src: c.photo, alt: c.name })),
        el("span", { class: "cat-text" },
          el("div", { class: "cat-blurb" }, c.blurb),
          el("div", { class: "cat-name" }, el("span", { class: "cat-name-label" }, c.name), el("span", { class: "cat-count" }, count + "개"))
        ),
        el("span", { class: "arrow" }, I.Arrow({ size: 20 }))
      ));
    });
    const catSec = el("section", { class: "section" },
      el("div", { class: "section-head" }, el("h3", null, "어떤 경조사가 발생했나요?"), el("span", { class: "meta" }, "상황에 따른 상품선택")),
      catlist);

    // how
    const steps = [
      { n: "01", t: "상황별 상품 선택", d: "어떤 대상에게 어떤 경조사가 발생하였나요?\n상황에 맞춰 상품을 선택할 수 있어요", icon: I.Gift },
      { n: "02", t: "주문서 작성", d: "경조사 지원에 필요한 모든 내용(배송주소, 받는분 정보 등)을 작성하여 신청해주세요", icon: I.Edit },
      { n: "03", t: "경조사 신청 완료", d: "'신청하기' 탭에서 내용 작성 후 버튼을 클릭하면, 신청이 완료되며 신청내역에서 확인 가능합니다.", icon: I.Sparkle },
      { n: "04", t: "상품배송 완료", d: "주문하신 상품을 정성껏 준비해 배송해드리고, 완료 후 사진을 발송해 드려요.", icon: I.Truck },
    ];
    const timeline = el("ol", { class: "how-timeline" });
    steps.forEach((s) => {
      timeline.appendChild(el("li", { class: "how-step" },
        el("span", { class: "how-spine", "aria-hidden": "true" }, el("span", { class: "how-spine-dot" }, s.icon({ size: 18, strokeWidth: 1.9 }))),
        el("div", { class: "how-card" }, el("h4", null, s.t), el("p", null, s.d))
      ));
    });
    const howBtn = el("button", { class: "btn", style: { marginTop: "20px" }, onClick: () => go("items") }, I.List({ size: 18, strokeWidth: 2.2 }), "상품 목록 둘러보기");
    const howSec = el("section", { class: "section how-section" },
      el("div", { class: "section-head" }, el("h3", null, "경조사 지원 신청방법"), el("p", { class: "how-sub" }, "전화 없이도, 누구나 3분이면 주문을 완성할 수 있어요.")),
      timeline, howBtn);

    // 간편접수 — 주문서 상단과 동일한 버튼을 홈에도 배치
    const qiSec = el("section", { class: "section" },
      el("div", { class: "section-head" },
        el("h3", null, "부고장·청첩장을 받으셨나요?"),
        el("span", { class: "meta" }, "링크로 자동 입력")),
      el("div", { class: "quick-intake" },
        el("button", { type: "button", class: "qi-btn qi-obituary", onClick: () => startIntake("obituary") }, I.Memorial({ size: 18, strokeWidth: 1.9 }), " 부고장 간편접수"),
        el("button", { type: "button", class: "qi-btn qi-wedding", onClick: () => startIntake("wedding") }, I.Wreath({ size: 18, strokeWidth: 1.9 }), " 청첩장 간편접수")));

    const root = el("div", null, heroSec, el("div", { style: { display: "none" } }), qiSec, catSec, howSec);

    // FAQ
    if (pickedFaqs.length > 0) {
      const faqList = el("div", { class: "faq-list", style: { padding: "0" } });
      pickedFaqs.forEach((it) => faqList.appendChild(buildHomeFaqItem(it)));
      root.appendChild(el("section", { class: "section" },
        el("div", { class: "section-head" }, el("h3", null, homeFaqTitle)), faqList));
    }

    root.appendChild(el("div", { class: "footer" },
      el("a", { class: "num", href: PHONE_HREF }, PHONE),
      el("p", null, "경조사 지원 문의센터")));
    return root;
  }

  // ---------- ITEMS ----------
  function buildItemsScreen() {
    const cat = window.CATEGORIES.find((c) => c.id === S.activeTab);
    const catIcons = { leaf: I.Leaf, basket: I.Basket, orchid: I.Orchid, wreath: I.Wreath, memorial: I.Memorial };
    // 주문서에서 넘어온 선택 모드에서는 주소의 지역 반입 규칙을 근조화환에 그대로 적용
    const rule = S.pickMode && window.matchRegionRule ? window.matchRegionRule(S.orderForm.address) : null;
    const restrict = rule && !rule.blocked && rule.allowed && S.activeTab === "tab5";
    let groups = window.SECTIONS[S.activeTab];
    if (restrict) {
      groups = groups
        .map((g) => Object.assign({}, g, { items: g.items.filter((it) => it.regionOnly ? rule.allowed.indexOf(it.kind) >= 0 : rule.allowed.indexOf("3dan") >= 0) }))
        .filter((g) => g.items.length > 0);
    } else {
      groups = groups.filter((g) => !g.regionOnly);
    }

    const tabScroll = el("div", { class: "tabbar-scroll" });
    window.CATEGORIES.forEach((c) => {
      tabScroll.appendChild(el("button", { "data-tab": c.id, class: "tab " + (c.id === S.activeTab ? "on" : ""), onClick: () => { S.activeTab = c.id; renderScreen(); } }, c.name));
    });
    const root = el("div", null,
      el("div", { class: "tabbar" }, tabScroll),
      el("div", { class: "cat-banner" }, el("img", { src: cat.banner, alt: cat.name })));

    if (S.pickMode) {
      const blocked = !!(rule && rule.blocked);
      root.appendChild(el("div", { class: "region-note " + (blocked ? "warn" : "info"), style: { margin: "14px 20px 0" } },
        I.Info({ size: 14, strokeWidth: 2.2 }),
        el("span", null, blocked
          ? rule.sido + " " + rule.keywords[0] + " 지역은 배송이 불가합니다. 보내는 장소를 확인해주세요."
          : restrict
            ? rule.sido + " " + rule.keywords[0] + " 지역 안내 · " + rule.note + " — 반입 가능한 상품만 표시됩니다."
            : "주문서에 넣을 상품을 선택해주세요. 상품을 누르면 선택할 수 있어요.")));
    }

    groups.forEach((g) => {
      const CatIc = catIcons[cat.icon];
      const products = el("div", { class: "products" });
      g.items.forEach((it) => {
        products.appendChild(el("button", { class: "product", onClick: () => openItemSheet(Object.assign({}, it, { category: cat.name, group: g.title })) },
          el("div", { class: "product-img" + (isFramedImg(it.img) ? " framed" : "") },
            el("span", { class: "tag" }, g.tag),
            el("img", { src: it.img, alt: it.name, loading: "lazy" })),
          el("div", { class: "product-body" },
            el("div", { class: "product-name" }, it.name),
            el("div", { class: "product-price" }, fmt(it.price), el("span", { class: "won" }, "원")))
        ));
      });
      root.appendChild(el("section", { class: "group" },
        el("span", { class: "group-kicker" }, CatIc({ size: 12, strokeWidth: 2 }), " ", g.tag),
        el("h3", null, el("span", { class: "light" }, g.kicker), g.title),
        products));
    });

    // 활성 탭 스크롤 인투뷰
    setTimeout(() => {
      const tEl = tabScroll.querySelector("[data-tab='" + S.activeTab + "']");
      if (tEl) { if (tEl.scrollIntoViewIfNeeded) tEl.scrollIntoViewIfNeeded(); else tEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }
    }, 0);
    return root;
  }

  // ---------- HISTORY ----------
  function buildHistoryScreen() {
    let filter = "all";
    const STATUS = {
      pending: { label: "접수대기", cls: "pending" },
      received: { label: "접수완료", cls: "received" },
      delivered: { label: "배송완료", cls: "delivered" },
      cancelled: { label: "주문취소", cls: "cancelled" },
    };
    const filters = [
      { id: "all", label: "전체" }, { id: "pending", label: "접수대기" }, { id: "received", label: "접수완료" },
      { id: "delivered", label: "배송완료" }, { id: "cancelled", label: "주문취소" },
    ];
    const records = window.ORDER_HISTORY || [];

    const filtersWrap = el("div", { class: "hist-filters" });
    const chipEls = {};
    filters.forEach((f) => {
      const chip = el("button", { "data-filter": f.id, class: "hist-chip " + (f.id === filter ? "on" : ""), onClick: () => setFilter(f.id) }, f.label);
      chipEls[f.id] = chip;
      filtersWrap.appendChild(chip);
    });
    const listWrap = el("div", { class: "hist-list" });

    function renderList() {
      listWrap.innerHTML = "";
      const list = records.filter((r) => filter === "all" || r.status === filter);
      if (list.length === 0) {
        listWrap.appendChild(el("div", { class: "hist-empty" },
          I.Clock({ size: 28, strokeWidth: 1.5 }), el("h4", null, "신청내역이 없어요"), el("p", null, "해당 상태의 신청 건이 없습니다.")));
        return;
      }
      list.forEach((r) => {
        const st = STATUS[r.status] || {};
        listWrap.appendChild(el("div", { class: "hist-card" },
          el("div", { class: "hist-product-row" },
            el("span", { class: "hist-product" }, r.category),
            el("span", { class: "hist-badge " + (st.cls || "") }, st.label)),
          el("dl", { class: "hist-rows" },
            el("div", null, el("dt", null, "신청인"), el("dd", null, r.applicant)),
            el("div", null, el("dt", null, "신청상품"), el("dd", null, r.product)),
            el("div", null, el("dt", null, "받는 분"), el("dd", null, r.recipient)),
            el("div", { class: "hist-addr" }, el("dt", null, "보내는 장소"), el("dd", null, r.address)),
            el("div", null, el("dt", null, "경조사어"), el("dd", null, r.message)),
            el("div", null, el("dt", null, "보내는분"), el("dd", null, r.sender))),
          el("div", { class: "hist-card-foot" },
            el("span", { class: "hist-date" }, r.date),
            el("span", { class: "hist-price" }, fmt(r.price) + "원"))
        ));
      });
    }
    function setFilter(id) {
      filter = id;
      filters.forEach((f) => { chipEls[f.id].className = "hist-chip " + (f.id === filter ? "on" : ""); });
      renderList();
      const c = chipEls[filter];
      if (c) { if (c.scrollIntoViewIfNeeded) c.scrollIntoViewIfNeeded(); else c.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }
    }
    renderList();

    return el("div", null,
      el("div", { class: "hist-hero" },
        (function () { const h = el("h2"); h.appendChild(document.createTextNode("신청하신 내역을")); h.appendChild(el("br")); h.appendChild(document.createTextNode("확인할 수 있어요")); return h; })(),
        (function () { const p = el("p"); p.appendChild(document.createTextNode("경조사 지원 신청 건의 진행 상태를 확인할 수 있어요.")); p.appendChild(el("br")); p.appendChild(document.createTextNode("접수완료 되어있다면 요청한 일시에 맞춰 배송되어요.")); return p; })()),
      filtersWrap, listWrap);
  }

  // ---------- 시트: RibbonGuide ----------
  function openRibbonGuide(onPick) {
    let activeId = window.RIBBON_GUIDE[0].id;
    mountOverlay((holder, close) => {
      const tabsWrap = el("div", { class: "guide-tabs" });
      const listWrap = el("div", { class: "guide-list", html: "" });
      const ul = el("ul", { class: "guide-list" });
      function renderTabs() {
        tabsWrap.innerHTML = "";
        window.RIBBON_GUIDE.forEach((g) => tabsWrap.appendChild(el("button", { class: "guide-tab " + (g.id === activeId ? "on" : ""), onClick: () => { activeId = g.id; renderTabs(); renderItems(); } }, g.label)));
      }
      function renderItems() {
        ul.innerHTML = "";
        const active = window.RIBBON_GUIDE.find((g) => g.id === activeId);
        active.items.forEach((it) => {
          ul.appendChild(el("li", null,
            el("span", { class: "guide-text" }, it.text, it.note ? el("span", { class: "guide-note" }, " " + it.note) : null),
            el("button", { class: "guide-apply", onClick: () => { onPick(it.text); close(); }, "aria-label": it.text + " 선택" }, I.Check({ size: 14, strokeWidth: 2.2 }), "선택")));
        });
      }
      renderTabs(); renderItems();
      holder.appendChild(el("div", { class: "scrim", onClick: close }));
      holder.appendChild(el("div", { class: "sheet sheet-tall", role: "dialog", "aria-modal": "true", "aria-label": "리본문구 작성가이드" },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "guide-head" }, el("h3", null, "리본문구 작성가이드"), el("button", { class: "sheet-close", onClick: close, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        tabsWrap,
        el("div", { class: "guide-body" }, ul,
          el("div", { class: "guide-notice" },
            el("div", { class: "guide-notice-title" }, "유의사항"),
            el("ul", null, el("li", { html: "리본문구는 <strong>1,570,000</strong> 주문자들의 빅데이터 기반으로 제공하고 있습니다. 상황별, 대상별 적절한 리본문구를 작성해주시기 바랍니다!" }))))
      ));
    });
  }

  // ---------- 시트: RecentSenders ----------
  function openRecentSenders(onPick) {
    mountOverlay((holder, close) => {
      const list = window.RECENT_SENDERS || [];
      let body;
      if (list.length === 0) {
        body = el("div", { class: "faq-empty", style: { padding: "32px 0" } },
          I.Clock({ size: 28, strokeWidth: 1.5 }), el("h4", null, "최근 작성한 내역이 없어요"), el("p", null, "보내는분을 직접 입력해주세요."));
      } else {
        const ul = el("ul", { class: "guide-list" });
        list.forEach((text) => ul.appendChild(el("li", null,
          el("span", { class: "guide-text" }, text),
          el("button", { class: "guide-apply", onClick: () => { onPick(text); close(); }, "aria-label": text + " 선택" }, I.Check({ size: 14, strokeWidth: 2.2 }), "선택"))));
        body = ul;
      }
      holder.appendChild(el("div", { class: "scrim", onClick: close }));
      holder.appendChild(el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "최근 작성한 보내는분" },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "guide-head" }, el("h3", null, "최근 작성한 보내는분"), el("button", { class: "sheet-close", onClick: close, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        el("div", { class: "guide-body" }, body)));
    });
  }

  // ---------- 시트: DateTimePicker ----------
  function openDateTimePicker(initialDate, initialTime, onConfirm) {
    mountOverlay((holder, close) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let view = (function () { const d = initialDate ? new Date(initialDate) : today; return new Date(d.getFullYear(), d.getMonth(), 1); })();
      let date = initialDate || "";
      let time = initialTime || "";

      const TIMES = [];
      for (let h = 9; h <= 18; h++) { TIMES.push(String(h).padStart(2, "0") + ":00"); TIMES.push(String(h).padStart(2, "0") + ":30"); }

      const calTitle = el("div", { class: "cal-title" });
      const grid = el("div", { class: "cal-grid" });
      const timeGrid = el("div", { class: "time-grid" });
      const confirmBtn = el("button", { class: "btn", onClick: () => { if (date && time) { onConfirm({ date: date, time: time }); close(); } } }, "선택 완료");

      function syncConfirm() { confirmBtn.disabled = !(date && time); }
      function renderCal() {
        const year = view.getFullYear(), month = view.getMonth();
        calTitle.textContent = year + "." + String(month + 1).padStart(2, "0");
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);
        grid.innerHTML = "";
        cells.forEach((d) => {
          if (!d) { grid.appendChild(el("span", { class: "cal-cell empty" })); return; }
          const disabled = d < today;
          const sel = fmtDate(d) === date;
          const isToday = d.getTime() === today.getTime();
          const btn = el("button", {
            class: "cal-cell " + (sel ? "sel " : "") + (disabled ? "disabled " : "") + (isToday && !sel ? "today " : ""),
            "data-dow": d.getDay(), disabled: disabled,
            onClick: () => { if (!disabled) { date = fmtDate(d); renderCal(); syncConfirm(); } }
          }, String(d.getDate()));
          grid.appendChild(btn);
        });
      }
      function renderTimes() {
        timeGrid.innerHTML = "";
        TIMES.forEach((t) => timeGrid.appendChild(el("button", { class: "time-cell " + (t === time ? "sel" : ""), onClick: () => { time = t; renderTimes(); syncConfirm(); } }, t)));
      }
      renderCal(); renderTimes(); syncConfirm();

      const dow = ["일", "월", "화", "수", "목", "금", "토"];
      const dowRow = el("div", { class: "cal-grid cal-dow" });
      dow.forEach((d, i) => dowRow.appendChild(el("span", { class: "cal-dow-lbl " + (i === 0 ? "sun" : i === 6 ? "sat" : "") }, d)));

      holder.appendChild(el("div", { class: "scrim", onClick: close }));
      holder.appendChild(el("div", { class: "sheet sheet-tall", role: "dialog", "aria-modal": "true", "aria-label": "배송일시 선택" },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "sheet-head" }, el("h4", null, "배송일시 선택"), el("button", { class: "sheet-close", onClick: close, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        el("div", { class: "sheet-body", style: { paddingBottom: "8px" } },
          el("div", { class: "cal-head" },
            el("button", { class: "cal-nav", onClick: () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); }, "aria-label": "이전 달" }, I.Back({ size: 18 })),
            calTitle,
            el("button", { class: "cal-nav", onClick: () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); }, "aria-label": "다음 달" }, I.Arrow({ size: 18 }))),
          dowRow, grid,
          el("div", { class: "cal-section" }, el("div", { class: "cal-section-title" }, "시간 선택"), timeGrid)),
        el("div", { class: "sheet-foot" }, el("button", { class: "btn-secondary", onClick: close }, "취소"), confirmBtn)));
    });
  }

  // ---------- 시트: QuickIntake ----------
  function openQuickIntake(type, onResult) {
    const isOb = type === "obituary";
    const title = isOb ? "부고장 간편접수" : "청첩장 간편접수";
    const targetName = isOb ? "부고장" : "청첩장";
    const productName = isOb ? "근조화환" : "축하화환";
    let busy = false, needKey = !(window.GORAESA_AI && window.GORAESA_AI.hasKey());
    let ctrl = null;

    mountOverlay((holder, close) => {
      const keyInput = el("input", { type: "password", autocomplete: "off", placeholder: "sk-...", onInput: (e) => { keyVal = e.target.value; } });
      let keyVal = "", urlVal = "";
      const urlInput = el("input", { type: "url", inputmode: "url", placeholder: "https://...", onInput: (e) => { urlVal = e.target.value; } });
      const errBox = el("div");
      const keyField = el("label", { class: "qi-field" },
        el("span", { class: "qi-field-lbl" }, "OpenAI API 키"), keyInput,
        el("span", { class: "qi-hint" }, "이 브라우저 세션에만 저장되며 OpenAI로만 전송됩니다."));
      const body = el("div", { class: "sheet-body" },
        el("p", { class: "qi-desc" }, targetName + " 링크를 넣으면 AI가 내용을 읽어 ", el("b", null, productName), " 선택과 배송일시·보내는 장소·받는 분 정보를 자동으로 채워드려요."));
      if (needKey) body.appendChild(keyField);
      body.appendChild(el("label", { class: "qi-field" }, el("span", { class: "qi-field-lbl" }, targetName + " 링크"), urlInput));
      body.appendChild(errBox);

      const cancelBtn = el("button", { class: "btn-secondary", onClick: () => { if (!busy) close(); } }, "취소");
      const submitBtn = el("button", { class: "btn", onClick: submit });
      function renderSubmit() {
        submitBtn.innerHTML = ""; submitBtn.disabled = busy;
        if (busy) { submitBtn.appendChild(el("span", { class: "qi-spinner", "aria-hidden": "true" })); submitBtn.appendChild(document.createTextNode(" 불러오는 중…")); }
        else { submitBtn.appendChild(I.Sparkle({ size: 18, strokeWidth: 2 })); submitBtn.appendChild(document.createTextNode(" 정보 가져오기")); }
      }
      function setErr(msg) { errBox.innerHTML = ""; if (msg) { errBox.className = "qi-err"; errBox.appendChild(I.Info({ size: 14, strokeWidth: 2.2 })); errBox.appendChild(document.createTextNode(" " + msg)); } else errBox.className = ""; }
      function setBusy(b) { busy = b; cancelBtn.disabled = b; renderSubmit(); }
      const shortErr = (m) => {
        if (m.indexOf("HTTP_401") >= 0) return "API 키가 올바르지 않아요";
        if (m.indexOf("HTTP_404") >= 0) return "모델명을 확인해주세요 (config.js)";
        if (m.indexOf("HTTP_429") >= 0) return "요청이 많아요. 잠시 후 다시";
        if (m.indexOf("PARSE_FAIL") >= 0 || m.indexOf("EMPTY") >= 0) return "정보를 인식하지 못했어요";
        if (m.indexOf("Failed to fetch") >= 0) return "네트워크 오류 (CORS/연결)";
        return m.slice(0, 80);
      };
      async function submit() {
        setErr("");
        if (!window.GORAESA_AI) { setErr("AI 모듈을 불러오지 못했어요."); return; }
        if (needKey) {
          if (!keyVal.trim()) { setErr("OpenAI API 키를 입력해주세요."); return; }
          window.GORAESA_AI.setSessionKey(keyVal.trim());
          needKey = false; if (keyField.parentNode) keyField.parentNode.removeChild(keyField);
        }
        if (!urlVal.trim()) { setErr(targetName + " 링크를 입력해주세요."); return; }
        setBusy(true);
        ctrl = new AbortController();
        try {
          const data = await window.GORAESA_AI.extractInvitation({ type: type, url: urlVal.trim(), signal: ctrl.signal });
          onResult(data); close();
        } catch (e) {
          const msg = String((e && e.message) || e);
          if (msg === "NO_KEY") { needKey = true; if (!keyField.parentNode) body.insertBefore(keyField, body.children[1]); setErr("API 키가 필요합니다. 키를 입력해주세요."); }
          else setErr("링크에서 정보를 가져오지 못했어요 (" + shortErr(msg) + "). 링크를 다시 확인해 주세요.");
        } finally { setBusy(false); ctrl = null; }
      }
      renderSubmit();

      holder.appendChild(el("div", { class: "scrim", onClick: () => { if (!busy) close(); } }));
      holder.appendChild(el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "sheet-head" }, el("h4", null, title), el("button", { class: "sheet-close", onClick: () => { if (!busy) close(); }, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        body,
        el("div", { class: "sheet-foot" }, cancelBtn, submitBtn)));
    }, () => !busy); // Escape: busy 중엔 막음

    // 시트 닫힐 때 진행 중 요청 중단 — mountOverlay close 시점에 보장하기 위해 래핑
  }

  // ---------- 시트: ProductPicker ----------
  function openProductPicker(categoryId, onPick, opts) {
    const rule = opts && opts.rule;
    mountOverlay((holder, close) => {
      const cat = (window.CATEGORIES || []).find((c) => c.id === categoryId);
      let sections = (window.SECTIONS && window.SECTIONS[categoryId]) || [];
      // 지역 반입 제한 필터 — 근조화환(tab5)에만 대체상품 규칙 적용
      if (rule && rule.blocked) {
        sections = [];
      } else if (rule && categoryId === "tab5" && rule.allowed) {
        sections = sections
          .map((sec) => ({
            title: sec.title, tag: sec.tag,
            items: sec.items.filter((it) => it.regionOnly ? rule.allowed.indexOf(it.kind) >= 0 : rule.allowed.indexOf("3dan") >= 0),
          }))
          .filter((sec) => sec.items.length > 0);
      } else {
        sections = sections.filter((sec) => !sec.regionOnly);
      }
      const body = el("div", { class: "sheet-body" });
      if (rule) {
        body.appendChild(el("div", { class: "region-note " + (rule.blocked ? "warn" : "info") },
          I.Info({ size: 14, strokeWidth: 2.2 }),
          el("span", null, rule.sido + " " + rule.keywords[0] + " 지역 안내 · " + rule.note)));
      }
      if (sections.length === 0) {
        body.appendChild(el("div", { class: "faq-empty", style: { padding: "32px 0" } },
          I.Clock({ size: 28, strokeWidth: 1.5 }),
          el("h4", null, rule && rule.blocked ? "배송 불가 지역이에요" : "노출 가능한 상품이 없어요"),
          el("p", null, rule && rule.blocked ? "해당 지역은 상품 배송이 불가합니다." : "전화로 별도 문의해주세요.")));
      }
      sections.forEach((sec) => {
        const grid = el("div", { class: "pp-grid" });
        sec.items.forEach((it) => grid.appendChild(el("button", { type: "button", class: "pp-item", onClick: () => { onPick(it.name + " (" + fmt(it.price) + "원)"); close(); } },
          el("div", { class: "pp-thumb" }, el("img", { src: it.img, alt: it.name, loading: "lazy" })),
          el("div", { class: "pp-meta" }, el("div", { class: "pp-name" }, it.name), el("div", { class: "pp-price" }, fmt(it.price), el("span", { class: "won" }, "원"))),
          I.Arrow({ size: 16 }))));
        body.appendChild(el("div", { class: "pp-section" }, el("div", { class: "pp-section-title" }, sec.title), grid));
      });
      holder.appendChild(el("div", { class: "scrim", onClick: close }));
      holder.appendChild(el("div", { class: "sheet sheet-tall", role: "dialog", "aria-modal": "true", "aria-label": (cat ? cat.name : "상품") + " 선택" },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "sheet-head" }, el("h4", null, (cat ? cat.name : "상품") + " 선택"), el("button", { class: "sheet-close", onClick: close, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        body));
    });
  }

  // ---------- 시트: ItemSheet ----------
  function openItemSheet(item) {
    if (!item) return;
    mountOverlay((holder, close) => {
      holder.appendChild(el("div", { class: "scrim", onClick: close }));
      holder.appendChild(el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": item.name },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "sheet-head" }, el("h4", null, "이미지 크게보기"), el("button", { class: "sheet-close", onClick: close, "aria-label": "닫기" }, I.Close({ size: 18 }))),
        el("div", { class: "sheet-body" },
          el("div", { class: "sheet-img" }, el("img", { src: item.imgLg || item.img, alt: item.name })),
          el("div", { class: "sheet-meta" },
            el("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--sm-content-tertiary)" } }, el("span", null, item.category), el("span", null, "·"), el("span", null, item.group)),
            el("div", { class: "name" }, item.name),
            el("div", { class: "price" }, fmt(item.price), el("span", { class: "won" }, "원")),
            el("div", { class: "ribbon" }, el("div", null, "실제 상품은 시즌과 재고에 따라 색감이나 구성이 조금 달라질 수 있어요. 정확한 상품은 주문 전 전화로 확인해 주세요.")))),
        el("div", { class: "sheet-foot" },
          el("button", { class: "btn-secondary", onClick: close }, "닫기"),
          el("button", { class: "btn", onClick: () => { close(); orderProduct(item); } }, I.Edit({ size: 18, strokeWidth: 2 }), S.pickMode ? " 이 상품으로 선택" : " 이 상품으로 주문하기"))));
    });
  }

  // ---------- 커스텀 드롭다운 ----------
  // 목록은 시트를 늘리지 않고 아래 항목을 덮는 오버레이로 뜬다.
  // 시트 본문(.sheet-body)이 스크롤 컨테이너라 그 안에 두면 잘리므로,
  // body 에 붙이고 트리거 위치에 맞춰 fixed 로 띄운다.
  // 선택은 두 가지 — 누른 채 끌어서 원하는 항목 위에서 떼거나, 열어 둔 뒤 탭.
  let openDropdown = null; // 동시에 하나만 열리도록
  function buildDropdown(cfg) {
    const options = cfg.options || [];
    let value = cfg.value || "";
    let open = false, dragging = false, pickedByDrag = false, activeOpt = null;

    const valSpan = el("span", { class: "dd-val" + (value ? "" : " placeholder") }, value || cfg.placeholder);
    const trigger = el("button", {
      type: "button", class: "dd-trigger",
      "aria-haspopup": "listbox", "aria-expanded": "false",
    }, valSpan, el("span", { class: "dd-caret", "aria-hidden": "true" }, I.Chevron({ size: 18, strokeWidth: 2.2 })));

    const panel = el("div", { class: "dd-panel", role: "listbox", "aria-label": cfg.label || cfg.placeholder });
    const optEls = options.map((o) => {
      const b = el("button", {
        type: "button", class: "dd-opt" + (o === value ? " sel" : ""),
        role: "option", "aria-selected": o === value ? "true" : "false",
        onClick: () => { if (pickedByDrag) return; pick(o); },
      }, el("span", null, o), I.Check({ size: 16, strokeWidth: 2.4 }));
      panel.appendChild(b);
      return b;
    });

    const root = el("div", { class: "dd" }, trigger);

    // 목록 전체 높이는 열 때 한 번만 잰다.
    // place() 안에서 maxHeight 를 풀어 다시 재면 스크롤 컨테이너가 사라져
    // 스크롤 위치가 맨 위로 초기화되므로, 측정과 배치를 분리한다.
    let naturalH = 0;
    function measure() {
      panel.style.maxHeight = "none";
      naturalH = panel.scrollHeight;
    }
    // 트리거 바로 아래에 띄우되, 아래 공간이 모자라면 위로 펼친다.
    function place() {
      const r = trigger.getBoundingClientRect();
      const GAP = 6, EDGE = 10;
      const MIN_DOWN = 200; // 아래로 펼쳤을 때 목록이 쓸 만하게 보이는 최소 높이
      const below = window.innerHeight - r.bottom - GAP - EDGE;
      const above = r.top - GAP - EDGE;
      panel.style.width = r.width + "px";
      panel.style.left = r.left + "px";
      // 아래 항목을 덮는 것이 기본. 아래가 너무 좁을 때만 위로 펼친다.
      if (naturalH <= below || below >= MIN_DOWN || below >= above) {
        panel.style.top = (r.bottom + GAP) + "px";
        panel.style.maxHeight = below + "px";
      } else {
        panel.style.top = (r.top - GAP - Math.min(naturalH, above)) + "px";
        panel.style.maxHeight = above + "px";
      }
    }
    // 목록 안에서의 스크롤은 위치를 다시 잡을 필요가 없다(잡으면 스크롤이 끊긴다).
    function onScroll(e) { if (e.target !== panel) place(); }
    function onDocPointer(e) { if (!root.contains(e.target) && !panel.contains(e.target)) setOpen(false); }
    function setOpen(next) {
      if (next === open) return;
      open = next;
      if (open) {
        if (openDropdown && openDropdown !== setOpen) openDropdown(false);
        openDropdown = setOpen;
        document.body.appendChild(panel);
        measure();
        place();
        const cur = optEls[options.indexOf(value)];
        if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" }); // 선택된 항목이 보이도록
        document.addEventListener("pointerdown", onDocPointer, true);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", onScroll, true); // 시트 본문 스크롤에는 따라붙도록
      } else {
        if (openDropdown === setOpen) openDropdown = null;
        setActive(null);
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        document.removeEventListener("pointerdown", onDocPointer, true);
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", onScroll, true);
      }
      root.className = "dd" + (open ? " open" : "");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function setActive(o) {
      if (activeOpt === o) return;
      if (activeOpt) activeOpt.classList.remove("active");
      activeOpt = o;
      if (activeOpt) {
        activeOpt.classList.add("active");
        if (activeOpt.scrollIntoView) activeOpt.scrollIntoView({ block: "nearest" }); // 끝에 닿으면 목록이 따라 스크롤
      }
    }
    function optAt(x, y) {
      const t = document.elementFromPoint(x, y);
      const o = t && t.closest ? t.closest(".dd-opt") : null;
      return o && panel.contains(o) ? o : null;
    }
    function pick(o) {
      value = o;
      valSpan.className = "dd-val";
      valSpan.textContent = o;
      optEls.forEach((b, i) => {
        const sel = options[i] === value;
        b.className = "dd-opt" + (sel ? " sel" : "");
        b.setAttribute("aria-selected", sel ? "true" : "false");
      });
      setOpen(false);
      trigger.focus();
      if (cfg.onChange) cfg.onChange(o);
    }

    // 누른 채 끌어서 선택 — 포인터를 트리거에 가둬 두고 좌표로 항목을 찾는다.
    trigger.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button > 0) return;
      e.preventDefault();
      pickedByDrag = false;
      trigger.focus();
      if (open) { setOpen(false); return; }
      setOpen(true);
      dragging = true;
      try { trigger.setPointerCapture(e.pointerId); } catch (_) {}
    });
    trigger.addEventListener("pointermove", (e) => { if (dragging) setActive(optAt(e.clientX, e.clientY)); });
    trigger.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      try { trigger.releasePointerCapture(e.pointerId); } catch (_) {}
      const o = optAt(e.clientX, e.clientY);
      setActive(null);
      // 항목 위에서 뗐으면 선택, 트리거 위에서 뗐으면(그냥 탭) 목록을 열어 둔다.
      if (o) { pickedByDrag = true; pick(options[optEls.indexOf(o)]); setTimeout(() => { pickedByDrag = false; }, 0); }
    });
    trigger.addEventListener("pointercancel", () => { dragging = false; setActive(null); });
    // 키보드(Enter/Space)로 누른 경우엔 포인터 이벤트가 없으므로 여기서 연다.
    trigger.addEventListener("click", (e) => { if (e.detail === 0) setOpen(!open); });

    // 화살표 이동 / Escape 닫기 — Escape 가 시트까지 닫지 않도록 여기서 소비한다.
    function onKeydown(e) {
      if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); trigger.focus(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      if (!open) { setOpen(true); (optEls[Math.max(0, options.indexOf(value))] || optEls[0]).focus(); return; }
      const cur = optEls.indexOf(document.activeElement);
      const next = e.key === "ArrowDown" ? cur + 1 : cur - 1;
      if (optEls[next]) optEls[next].focus();
    }
    root.addEventListener("keydown", onKeydown);
    panel.addEventListener("keydown", onKeydown);
    return root;
  }

  // ---------- 모달: 신청인 정보 ----------
  function openApplicantModal(initial, onSave, onClose) {
    let closedVia = false;
    const api = mountOverlay((holder, close) => {
      const COMPANIES = ["늘푸른바다", "고래사"];
      const DEPTS = ["리테일채널 영업팀", "온라인채널 영업팀", "GA팀", "SCM팀", "해외영업팀", "대외협력팀", "구매팀"];
      let name = (initial && initial.name) || "", contact = (initial && initial.contact) || "";
      let company = (initial && initial.company) || "";
      let dept = (initial && DEPTS.indexOf(initial.dept) >= 0 && initial.dept) || "";
      const saveBtn = el("button", { class: "btn", onClick: () => { if (!(company && dept && name.trim() && contact.trim())) return; closedVia = true; close(); onSave({ company: company, dept: dept, name: name.trim(), contact: contact.trim() }); } }, "저장");
      function sync() { saveBtn.disabled = !(company && dept && name.trim() && contact.trim()); }
      const fldCompany = buildDropdown({ label: "회사", placeholder: "회사를 선택하세요", options: COMPANIES, value: company, onChange: (v) => { company = v; sync(); } });
      const fldDept = buildDropdown({ label: "부서", placeholder: "부서를 선택하세요", options: DEPTS, value: dept, onChange: (v) => { dept = v; sync(); } });
      const fldName = el("input", { type: "text", value: name, placeholder: "홍길동", onInput: (e) => { name = e.target.value; sync(); } });
      const fldContact = el("input", { type: "tel", inputmode: "tel", value: contact, placeholder: "010-0000-0000", onInput: (e) => { contact = e.target.value; sync(); } });
      sync();
      const closeBtn = el("button", { class: "sheet-close", onClick: () => { close(); }, "aria-label": "닫기" }, I.Close({ size: 18 }));
      holder.appendChild(el("div", { class: "scrim", onClick: () => { close(); } }));
      holder.appendChild(el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "신청인 정보" },
        el("div", { class: "sheet-handle" }),
        el("div", { class: "sheet-head" }, el("h4", null, "신청인 정보"), closeBtn),
        el("div", { class: "sheet-body" },
          el("p", { class: "qi-desc" }, "신청인 정보확인 및 배송사진 전송을 위해 신청인 정보를 수집합니다."),
          el("div", { class: "qi-field" }, el("span", { class: "qi-field-lbl" }, "회사"), fldCompany),
          el("div", { class: "qi-field" }, el("span", { class: "qi-field-lbl" }, "부서"), fldDept),
          el("label", { class: "qi-field" }, el("span", { class: "qi-field-lbl" }, "성함"), fldName),
          el("label", { class: "qi-field" }, el("span", { class: "qi-field-lbl" }, "연락처"), fldContact)),
        el("div", { class: "sheet-foot" }, saveBtn)));
      // close 후 저장이 아니면 onClose 호출(닫기/스크림/ESC)
      holder._afterClose = () => { if (!closedVia && onClose) onClose(); };
    });
    // mountOverlay close 시 _afterClose 호출되도록 패치
    const origClose = api.close;
    // (mountOverlay 내부 close가 holder 제거. _afterClose는 close 직후 수동 호출이 어려우므로
    //  onClose는 scrim/closeBtn/ESC에서 직접 처리한다.)
    return api;
  }

  // ---------- ORDER ----------
  function buildOrderScreen() {
    S.pickMode = false; // 주문서로 돌아오면 상품 선택 모드 종료
    const form = S.orderForm;
    const fields = [
      { id: "product", label: "상품 분류 및 이름", hint: "상품목록에서 보낼 상품을 선택하세요", icon: I.Tag, select: true, onSelect: () => { S.pickMode = true; go("items"); } },
      { id: "address", label: "보내는 장소(상세주소)", hint: "EX) 부산 동구 고관로29번길 8 솥뚜껑삼겹살", icon: I.Pin, multiline: true },
      { id: "recipient", label: "받는 분 정보(성함, 연락처)", hint: "EX) 홍길동, 010-0000-0000", icon: I.User },
      { id: "sender", label: "리본문구 좌측(보내는분)", hint: "EX) 00컴퍼니 대표이사 홍길동", icon: I.Edit, recent: true },
      { id: "message", label: "리본문구 우측(경조사어)", hint: "EX) 개업을 진심으로 축하합니다", icon: I.Heart, guide: true },
      { id: "reason", label: "신청사유", hint: "EX) 주요 거래처 대표 부친상 조문", icon: I.Doc, multiline: true },
    ];
    const total = fields.length + 1;
    const refs = {}; // id → { container, input, iconSlot }

    // toast
    let toastTimer = null;
    const root = el("div");
    const toastHost = el("div");
    function showToast(msg, dur) {
      if (!msg) { toastHost.innerHTML = ""; return; }
      toastHost.innerHTML = "";
      toastHost.appendChild(el("div", { class: "toast" }, I.Check({ size: 16, strokeWidth: 2.4 }), " " + msg));
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastHost.innerHTML = ""; }, dur || 2200);
    }

    function dtDone() { return !!(form.deliveryDate && form.deliveryTime); }
    function countDone() { return fields.filter((f) => form[f.id].trim().length > 0).length + (dtDone() ? 1 : 0); }

    // 진행바
    const progressSpans = [];
    const progressWrap = el("div", { class: "progress", "aria-label": "" });
    for (let i = 0; i < total; i++) { const sp = el("span"); progressSpans.push(sp); progressWrap.appendChild(sp); }
    const doneText = el("span", { style: { fontWeight: "700", color: "var(--sm-content-secondary)", fontVariantNumeric: "tabular-nums" } });
    function recompute() {
      const done = countDone();
      progressWrap.setAttribute("aria-label", done + "/" + total + " 입력 완료");
      progressSpans.forEach((sp, i) => { sp.className = i < done ? "on" : ""; });
      doneText.textContent = done + "/" + total;
    }

    // datetime field
    const dtFieldContainer = el("div");
    const dtValSpan = el("span");
    function renderDtField() {
      dtFieldContainer.className = "field selectable " + (dtDone() ? "done" : "");
      dtValSpan.className = "field-val " + (!dtDone() ? "placeholder" : "");
      dtValSpan.textContent = dtDone() ? (formatDateKR(form.deliveryDate) + " · " + form.deliveryTime) : "달력에서 배송 날짜와 시간을 선택하세요";
    }
    dtFieldContainer.appendChild(el("div", { class: "field-label" },
      el("span", { class: "lbl" }, el("span", { class: "stepno" }, "1"), " 희망 배송일시"),
      el("button", { type: "button", class: "field-guide-btn", onClick: () => { const d = computeInstantDelivery(); form.deliveryDate = d.date; form.deliveryTime = d.time; renderDtField(); recompute(); showToast("즉시배송 일시로 설정했어요 · " + formatDateKR(d.date) + " " + d.time); } }, I.Truck({ size: 12, strokeWidth: 2.2 }), " 즉시배송")));
    dtFieldContainer.appendChild(el("button", { type: "button", class: "field-trigger", onClick: () => openDateTimePicker(form.deliveryDate, form.deliveryTime, (r) => { form.deliveryDate = r.date; form.deliveryTime = r.time; renderDtField(); recompute(); showToast("배송일시가 선택되었어요", 1800); }) }, dtValSpan));
    renderDtField();

    // 일반 필드 빌더
    function setFieldValue(id, value) {
      form[id] = value;
      const r = refs[id];
      const done = value.trim().length > 0;
      if (r.input) r.input.value = value;
      if (r.valSpan) { r.valSpan.className = "field-val " + (done ? "" : "placeholder"); r.valSpan.textContent = done ? value : r.hint; }
      r.container.className = "field " + (r.select ? "selectable " : "") + (done ? "done" : "");
      if (r.iconSlot) { r.iconSlot.innerHTML = ""; r.iconSlot.appendChild(done ? I.Check({ size: 16, strokeWidth: 2.4 }) : r.icon({ size: 16 })); }
      if (id === "address") updateRegionNote();
      recompute();
    }
    const regionNoteHost = el("div", { class: "region-note-host" });
    const formEl = el("form", { class: "form", onSubmit: (e) => { e.preventDefault(); send(); } });
    // 간편접수 버튼
    formEl.appendChild(el("div", { class: "quick-intake" },
      el("button", { type: "button", class: "qi-btn qi-obituary", onClick: () => openQuickIntake("obituary", (data) => handleIntake("obituary", data)) }, I.Memorial({ size: 18, strokeWidth: 1.9 }), " 부고장 간편접수"),
      el("button", { type: "button", class: "qi-btn qi-wedding", onClick: () => openQuickIntake("wedding", (data) => handleIntake("wedding", data)) }, I.Wreath({ size: 18, strokeWidth: 1.9 }), " 청첩장 간편접수")));
    formEl.appendChild(dtFieldContainer);

    fields.forEach((f, i) => {
      const value = form[f.id];
      const isDone = value.trim().length > 0;
      let rightNode, iconSlot = null;
      if (f.guide) rightNode = el("button", { type: "button", class: "field-guide-btn", onClick: () => openRibbonGuide((text) => { setFieldValue("message", text); showToast("리본문구가 입력되었어요", 1800); }) }, I.Sparkle({ size: 12, strokeWidth: 2.2 }), " 간편선택");
      else if (f.recent) rightNode = el("button", { type: "button", class: "field-guide-btn", onClick: () => openRecentSenders((text) => { setFieldValue("sender", text); showToast("보내는분이 입력되었어요", 1800); }) }, I.Clock({ size: 12, strokeWidth: 2.2 }), " 최근작성");
      else { iconSlot = el("span"); iconSlot.appendChild(isDone ? I.Check({ size: 16, strokeWidth: 2.4 }) : f.icon({ size: 16 })); rightNode = iconSlot; }

      const labelRow = el("div", { class: "field-label" },
        el("span", { class: "lbl" }, el("span", { class: "stepno" }, String(i + 2)), " " + f.label), rightNode);

      let input = null, valSpan = null, container;
      if (f.select) {
        // 직접 입력이 아닌 선택형 — 누르면 상품목록으로 이동
        valSpan = el("span", { class: "field-val " + (isDone ? "" : "placeholder") }, isDone ? value : f.hint);
        container = el("div", { class: "field selectable " + (isDone ? "done" : "") },
          labelRow,
          el("button", { type: "button", class: "field-trigger", onClick: f.onSelect }, valSpan, I.Arrow({ size: 18 })));
      } else {
        input = f.multiline
          ? el("textarea", { rows: 2, placeholder: f.hint, onInput: (e) => onFieldInput(f.id, e.target.value) })
          : el("input", { type: "text", placeholder: f.hint, onInput: (e) => onFieldInput(f.id, e.target.value) });
        input.value = value;
        container = el("div", { class: "field " + (isDone ? "done" : "") }, labelRow, input);
      }
      refs[f.id] = { container: container, input: input, valSpan: valSpan, iconSlot: iconSlot, icon: f.icon, hint: f.hint, select: !!f.select };
      formEl.appendChild(container);
      if (f.id === "address") formEl.appendChild(regionNoteHost);
    });

    // 지역별 반입상품 안내 — 주소 변경 시 재판정
    let regionRule = null;
    const dockBtn = el("button", { class: "btn", onClick: send }, "작성한 내용으로 신청", I.Send({ size: 18 }));
    function updateRegionNote() {
      regionRule = window.matchRegionRule ? window.matchRegionRule(form.address) : null;
      regionNoteHost.innerHTML = "";
      if (regionRule) {
        const blocked = !!regionRule.blocked;
        regionNoteHost.appendChild(el("div", { class: "region-note " + (blocked ? "warn" : "info") },
          I.Info({ size: 14, strokeWidth: 2.2 }),
          el("span", null, blocked
            ? regionRule.sido + " " + regionRule.keywords[0] + " 지역은 배송이 불가합니다. 신청이 제한돼요."
            : regionRule.sido + " " + regionRule.keywords[0] + " 지역 안내 · " + regionRule.note + " — 대체상품으로 신청해주세요.")));
      }
      dockBtn.disabled = !!(regionRule && regionRule.blocked);
    }

    function onFieldInput(id, value) {
      form[id] = value;
      const r = refs[id];
      r.container.className = "field " + (value.trim().length > 0 ? "done" : "");
      if (r.iconSlot) { r.iconSlot.innerHTML = ""; r.iconSlot.appendChild(value.trim().length > 0 ? I.Check({ size: 16, strokeWidth: 2.4 }) : r.icon({ size: 16 })); }
      if (id === "address") updateRegionNote();
      recompute();
    }

    function send() {
      if (regionRule && regionRule.blocked) { showToast("배송 불가 지역이라 신청할 수 없어요"); return; }
      if (countDone() === 0) { showToast("최소 한 가지 이상 입력해주세요"); return; }
      showToast("테스트 모드입니다");
    }
    function handleIntake(type, data) {
      if (data && data.deliveryAddress) setFieldValue("address", String(data.deliveryAddress).trim());
      if (data && data.recipient) setFieldValue("recipient", String(data.recipient).trim());
      if (type === "obituary") { const dt = computeInstantDelivery(); form.deliveryDate = dt.date; form.deliveryTime = dt.time; }
      else { const dt = parseISOToDateTime(data && data.ceremonyDateTime); if (dt) { form.deliveryDate = dt.date; if (dt.time) form.deliveryTime = dt.time; } }
      renderDtField(); recompute();
      const rule = regionRule; // updateRegionNote 가 setFieldValue("address") 시 갱신함
      if (rule && rule.blocked) {
        showToast("배송 불가 지역이에요 · " + rule.sido + " " + rule.keywords[0] + " 지역은 신청이 제한됩니다", 3500);
        return;
      }
      // 간편접수 시트의 close 가 body 스크롤 잠금을 해제한 뒤에 바텀시트를 열어야 잠금이 유지됨
      setTimeout(() => {
        openProductPicker(type === "obituary" ? "tab5" : "tab4", (label) => { setFieldValue("product", label); showToast("상품이 선택되었어요", 1800); }, { rule: type === "obituary" ? rule : null });
      }, 0);
      const restricted = rule && type === "obituary";
      showToast(type === "obituary"
        ? (restricted ? "부고장 정보를 불러왔어요 · 이 지역의 반입 가능 상품을 선택해주세요" : "부고장 정보를 불러왔어요 · 근조화환을 선택해주세요")
        : "청첩장 정보를 불러왔어요 · 축하화환을 선택해주세요", 3000);
    }

    recompute();

    // 홈에서 간편접수하고 넘어온 경우 — 화면이 붙은 뒤 이어서 처리
    if (S.pendingIntake) {
      const pi = S.pendingIntake;
      S.pendingIntake = null;
      setTimeout(() => handleIntake(pi.type, pi.data), 0);
    }

    root.appendChild(el("div", { class: "order-hero" },
      (function () { const h = el("h2"); h.appendChild(document.createTextNode("모든 내용을 작성 후")); h.appendChild(el("br")); h.appendChild(document.createTextNode("간편하게 신청해보세요")); return h; })(),
      el("p", null, "경조사 지원에 필요한 내용을 모두 입력해주세요! 작성하신 내용에 문제가 있다면 별도로 안내드립니다.")));
    root.appendChild(progressWrap);
    root.appendChild(el("div", { style: { padding: "8px 20px 0", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--sm-content-tertiary)" } }, el("span", null, "입력 진행"), doneText));
    root.appendChild(formEl);
    root.appendChild(el("div", { class: "notice" },
      el("h5", null, "NOTICE"), el("h6", null, "주문 시 꼭 확인해주세요"),
      el("ul", null,
        el("li", null, "배송완료 이후에 사진을 발송해 드려요."),
        el("li", null, "18:30 이후 주문은 익일 오전 중 배송돼요."),
        el("li", null, "일부 지역에서 배송비가 발생할 수 있어요."),
        el("li", null, "화분의 종류는 변경될 수 있어요."))));
    root.appendChild(el("div", { class: "dock" }, dockBtn));
    root.appendChild(toastHost);
    return root;
  }

  // ---------- 라우팅 ----------
  function renderScreen() {
    screenHostEl.innerHTML = "";
    let node;
    if (S.route === "home") node = buildHomeScreen();
    else if (S.route === "items") node = buildItemsScreen();
    else if (S.route === "order") node = buildOrderScreen();
    else if (S.route === "history") node = buildHistoryScreen();
    if (node) screenHostEl.appendChild(node);
    updateAppBar();
    updateBottomNav();
    window.scrollTo(0, 0);
  }
  function go(r) {
    if (r === "order" && !S.applicant) {
      pendingRoute = "order";
      openEditApplicant(true);
      return;
    }
    if (r !== "items") S.pickMode = false; // 상품목록을 벗어나면 선택 모드 해제
    S.route = r;
    location.hash = r === "home" ? "" : r;
    renderScreen();
  }
  function openCat(tabId) { S.activeTab = tabId; go("items"); }
  // 홈에서 간편접수 — 결과를 들고 주문서로 이동하면 buildOrderScreen 이 이어서 처리한다.
  function startIntake(type) {
    openQuickIntake(type, (data) => { S.pendingIntake = { type: type, data: data }; go("order"); });
  }
  function orderProduct(it) { S.orderForm.product = it.name + " (" + fmt(it.price) + "원)"; go("order"); }

  // 신청인 모달 열기 (수정/게이트 공용)
  function openEditApplicant(fromGate) {
    openApplicantModal(
      S.applicant,
      function onSave(info) {
        S.applicant = saveApplicant(info);
        const pending = pendingRoute; pendingRoute = null;
        // 홈 화면이면 신청인 카드 갱신 위해 재렌더
        if (pending) { S.route = pending; location.hash = pending; renderScreen(); }
        else if (S.route === "home") renderScreen();
      },
      function onClose() { pendingRoute = null; }
    );
  }

  // ---------- Splash ----------
  function mountSplash(onDone) {
    const DURATION = 3000;
    let exitTimer = null, raf = null, fallback = null, doneCalled = false;
    const loaderBar = el("span", { class: "splash-loader-bar", style: { width: "0%" } });
    const countdown = el("span", { class: "splash-countdown", "aria-live": "polite" }, Math.ceil(DURATION / 1000) + "초 뒤 접속됩니다");
    const root = el("div", { class: "splash splash-intro", role: "button", tabindex: 0, "aria-label": "EBS/GRS 거래처 경조사 접수센터 시작하기" });
    function enter() {
      if (exitTimer) return;
      root.className = "splash splash-exit";
      exitTimer = setTimeout(() => { if (!doneCalled) { doneCalled = true; cleanup(); onDone(); } }, 650);
    }
    function cleanup() { if (raf) cancelAnimationFrame(raf); if (fallback) clearTimeout(fallback); if (root.parentNode) root.parentNode.removeChild(root); }
    root.addEventListener("click", enter);
    root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); } });
    root.appendChild(el("div", { class: "splash-bg", "aria-hidden": "true" }));
    root.appendChild(el("div", { class: "splash-scrim", "aria-hidden": "true" }));
    root.appendChild(el("div", { class: "splash-content" },
      el("span", { class: "splash-eyebrow" }, "경조사 토탈 케어 서비스"),
      el("h1", { class: "splash-title" },
        el("span", { class: "splash-line splash-line-1" }, el("em", null, "EBS/GRS"), " 거래처"),
        el("span", { class: "splash-line splash-line-2" }, "경조사 접수센터")),
      el("div", { class: "splash-loader", "aria-hidden": "true" }, loaderBar),
      countdown));
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      loaderBar.style.width = Math.min(100, (elapsed / DURATION) * 100) + "%";
      countdown.textContent = Math.max(1, Math.ceil((DURATION - elapsed) / 1000)) + "초 뒤 접속됩니다";
      if (elapsed < DURATION) raf = requestAnimationFrame(tick); else enter();
    };
    raf = requestAnimationFrame(tick);
    fallback = setTimeout(() => enter(), DURATION + 50);
  }

  // ---------- 초기화 ----------
  function init() {
    applyTheme();
    const root = document.getElementById("root");
    screenHostEl = el("div");
    frameEl = el("div", { class: "app-frame" }, buildAppBar(), screenHostEl);
    const appEl = el("div", { class: "app" }, frameEl, buildBottomNav());
    root.appendChild(appEl);

    // 스크롤 섀도
    const onScroll = () => { appbarEl.className = "appbar " + (window.scrollY > 8 ? "shadow" : ""); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    renderScreen();

    // 스플래시 → 종료 후 신청인 정보 없으면 모달
    mountSplash(() => {
      document.body.style.overflow = "";
      if (!S.applicant) openEditApplicant(false);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
