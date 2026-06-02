/* eslint-disable */
const { useState, useEffect, useRef, useMemo } = React;

// admin/기본 정보 입력(SITE_INFO.phone) 우선, 없으면 기존 정적 값.
const PHONE = (typeof window !== "undefined" && window.SITE_INFO && window.SITE_INFO.phone) || "010-0000-0000";
const PHONE_HREF = "tel:" + PHONE.replace(/[^\d]/g, "");
const SMS_HREF = "sms:01000000000";

// ---------- Utilities ----------
const fmt = (n) => n.toLocaleString("ko-KR");

function useScrolled() {
  const [scrolled, set] = useState(false);
  useEffect(() => {
    const fn = () => set(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

// ---------- App bar ----------
function LiveDelivery() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  const OPEN = 9 * 60;       // 09:00
  const CLOSE = 18 * 60 + 30; // 18:30
  const isOpen = mins >= OPEN && mins < CLOSE;
  const closingIn = CLOSE - mins;
  const opensIn = mins < OPEN ? OPEN - mins : (24 * 60 - mins) + OPEN;

  const fmtDuration = (m) => {
    const H = Math.floor(m / 60);
    const M = m % 60;
    if (H === 0) return `${M}분`;
    if (M === 0) return `${H}시간`;
    return `${H}시간 ${M}분`;
  };

  return (
    <div className={"live " + (isOpen ? "open" : "closed")} role="status" aria-live="polite">
      <span className="live-dot" aria-hidden="true">
        {isOpen && <span className="live-pulse" />}
      </span>
      <span className="live-text">
        <span className="live-label">{isOpen ? "당일배송 가능" : "당일배송 마감"}</span>
        {!isOpen && (
          <>
            <span className="live-sep" aria-hidden="true">·</span>
            <span className="live-meta">09:00~18:30</span>
          </>
        )}
      </span>
    </div>
  );
}

function AppBar({ title, onBack, scrolled, action }) {
  return (
    <div className={"appbar " + (scrolled ? "shadow" : "")}>
      {onBack && (
        <button className="iconbtn" onClick={onBack} aria-label="뒤로 가기"><I.Back /></button>
      )}
      <div className="pagetitle">{title || "전국꽃배달"}</div>
      <div className="grow" />
      <LiveDelivery />
      {action || (
        <a className="iconbtn" href={PHONE_HREF} aria-label="전화 걸기"><I.Phone /></a>
      )}
    </div>
  );
}

// ---------- Bottom Nav ----------
function BottomNav({ route, go }) {
  const tabs = [
    { id: "home", label: "홈", icon: I.Home },
    { id: "items", label: "상품목록", icon: I.List },
    { id: "order", label: "주문하기", icon: I.Order },
    { id: "faq", label: "질의응답", icon: I.Help },
  ];
  return (
    <nav className="bottomnav" aria-label="기본 메뉴">
      {tabs.map((t) => {
        const Ic = t.icon;
        const active = route.startsWith(t.id);
        return (
          <button key={t.id} className={active ? "on" : ""} onClick={() => go(t.id)} aria-current={active}>
            <Ic size={22} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- HOME FAQ ----------
function HomeFaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"faq-item " + (open ? "open" : "")}>
      <button className="faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="faq-q-text">
          <span className="faq-q-title">{item.q}</span>
        </span>
        <span className="faq-icon" aria-hidden="true">
          {open ? <I.Minus size={18} /> : <I.Plus size={18} />}
        </span>
      </button>
      {open && <div className="faq-a">{item.a}</div>}
    </div>
  );
}

// ---------- HOME ----------
function HomeScreen({ go, openCat, onPick }) {
  const [draftHS, setDraftHS] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      const d = e && e.data;
      if (d && d.type === "draftHomeSections" && Array.isArray(d.sections)) {
        setDraftHS(d.sections);
      }
    };
    window.addEventListener("message", handler);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: "previewReady" }, "*"); } catch (_) {}
    }
    return () => window.removeEventListener("message", handler);
  }, []);

  const HS = draftHS || window.HOME_SECTIONS || [];
  const hero = (HS.find((s) => s && s.type === "hero") || {}).data || {};
  const sliderSections = HS.filter((s) => s && s.type === "slider").map((s) => s.data || {});
  const faqHome = (HS.find((s) => s && s.type === "faq") || {}).data || {};

  // admin hero 입력 → flower_example 의 hero 영역에 매핑
  const heroHeadline = hero.storeName || hero.title || "대한민국 어디든";
  const heroSubhead = hero.storeDesc || hero.body || "아름다운 마음을 대한민국 전국 어디든지 보내드립니다\n10년 경력의 노하우를 그대로";
  const heroBanner = hero.bannerText || "온라인 주문이 어렵다면";

  const productById = {};
  Object.values(SECTIONS).forEach((groups) => {
    groups.forEach((g) => {
      g.items.forEach((p) => {
        if (p.productId) productById[p.productId] = p;
        if (p.id) productById[p.id] = p;
      });
    });
  });

  const adminSliders = sliderSections
    .map((s) => ({
      title: s.title || "",
      subtitle: s.subtitle || "",
      list: (s.pickedIds || []).map((id) => productById[id]).filter(Boolean),
    }))
    .filter((s) => s.list.length > 0);

  const allFaqs = (window.FAQS && window.FAQS.length > 0) ? window.FAQS : (window.FAQ_ITEMS || []);
  const pickedFaqs = (faqHome.pickedIds && faqHome.pickedIds.length > 0)
    ? faqHome.pickedIds.map((id) => allFaqs.find((f) => f.id === id || f.faqId === id)).filter(Boolean)
    : [];
  const homeFaqTitle = faqHome.title || "자주 묻는 질문";

  return (
    <div>
      <section className="hero">
        <h2>{heroHeadline}{!hero.storeName && !hero.title && <><br /><em>3시간 당일배송</em></>}</h2>
        <p>{heroSubhead.split(/\r?\n/).map((line, i, arr) => (
          <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
        ))}</p>
        <a href={PHONE_HREF} className="hero-cta">
          <span className="ring"><I.Phone size={20} strokeWidth={2} /></span>
          <span className="grow">
            <div className="label">{heroBanner}</div>
            <div className="num">{PHONE}</div>
          </span>
          <span className="pill">바로 전화</span>
        </a>
      </section>

      <div style={{ display: "none" }} />

      <section className="section">
        <div className="section-head">
          <h3>어떤 경조사가 발생했나요?</h3>
          <span className="meta">상황에 따른 상품선택</span>
        </div>
        <div className="catlist">
          {CATEGORIES.map((c) => {
            const count = SECTIONS[c.id].reduce((a, s) => a + s.items.length, 0);
            return (
              <button key={c.id} className="cat" onClick={() => openCat(c.id)}>
                <span className="thumb">
                  <img src={c.photo} alt={c.name} />
                </span>
                <span className="cat-text">
                  <div className="cat-blurb">{c.blurb}</div>
                  <div className="cat-name">
                    <span className="cat-name-label">{c.name}</span>
                    <span className="cat-count">{count}개</span>
                  </div>
                </span>
                <span className="arrow"><I.Arrow size={20} /></span>
              </button>
            );
          })}
        </div>
      </section>

      {adminSliders.map((s, i) => (
        <section className="section" key={"slider-" + i}>
          <div className="section-head">
            <h3>{s.title}</h3>
            {s.subtitle && <span className="meta">{s.subtitle}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 12px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
            {s.list.map((item, j) => (
              <button key={j} className="product" style={{ minWidth: 150, flex: "0 0 auto", scrollSnapAlign: "start" }}
                onClick={() => onPick({ ...item, imgLg: item.imgLg || item.img, category: s.title, group: "" })}>
                <div className="product-img">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <div className="product-name">{item.name}</div>
                  <div className="product-price">{fmt(item.price)}<span className="won">원</span></div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="usp">
        <div>
          <h4>전화 한 통이면, 3시간 안에 도착해요</h4>
          <p>상품 선택부터 리본 문구까지 한 번에 안내해 드려요.</p>
        </div>
        <a href={PHONE_HREF} className="ring" aria-label="전화 걸기"><I.Phone strokeWidth={2.2} /></a>
      </div>

      <section className="section how-section">
        <div className="section-head">
          <h3>마음을 담아 보내는 3단계</h3>
          <p className="how-sub">전화 없이도, 누구나 3분이면 주문을 완성할 수 있어요.</p>
        </div>
        <ol className="how-timeline">
          {[
            { n: "01", t: "상품 고르기", d: "어떤 자리에, 누구에게 보내실 건가요?\n5가지 카테고리에서 마음에 드는 상품을 골라보세요.", icon: I.Gift },
            { n: "02", t: "주문서 작성", d: "받는 분, 배송지, 리본 문구까지\n꽃배달에 필요한 모든 항목을 한 번에 입력해요.", icon: I.Edit },
            { n: "03", t: "간편 주문", d: "메시지 한 통을 보내면 주문이 완료돼요.\n곧바로 담당자가 확인 연락을 드려요.", icon: I.Sparkle },
          ].map((s) => {
            const Ic = s.icon;
            return (
              <li className="how-step" key={s.n}>
                <span className="how-spine" aria-hidden="true">
                  <span className="how-spine-dot"><Ic size={18} strokeWidth={1.9} /></span>
                </span>
                <div className="how-card">
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <button className="btn" style={{ marginTop: 20 }} onClick={() => go("items")}>
          <I.List size={18} strokeWidth={2.2} />상품 목록 둘러보기
        </button>
      </section>

      {pickedFaqs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3>{homeFaqTitle}</h3>
          </div>
          <div className="faq-list" style={{ padding: "0 20px" }}>
            {pickedFaqs.map((it, i) => <HomeFaqItem key={i} item={it} />)}
          </div>
          <div style={{ textAlign: "center", padding: "12px 20px 0" }}>
            <button className="btn-secondary" style={{ width: "auto", display: "inline-flex", padding: "0 18px" }} onClick={() => go("faq")}>
              전체 질문 보기
            </button>
          </div>
        </section>
      )}

      <div className="footer">
        <a className="num" href={PHONE_HREF}>{PHONE}</a>
        <p>대한민국 어디든 3시간 당일배송</p>
        <div className="row">
          <a href={SMS_HREF} className="btn-secondary"><I.Chat size={18} /> 문자 문의</a>
          <a href={PHONE_HREF} className="btn-secondary" style={{ background: "var(--p-neutral-90)", color: "var(--p-neutral-0)" }}>
            <I.Phone size={18} /> 전화 걸기
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------- ITEMS ----------
function ItemsScreen({ activeTab, setActiveTab, onPick }) {
  const tabRef = useRef(null);
  useEffect(() => {
    const el = tabRef.current?.querySelector(`[data-tab='${activeTab}']`);
    if (el) el.scrollIntoViewIfNeeded?.() ?? el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  const cat = CATEGORIES.find((c) => c.id === activeTab);
  const groups = SECTIONS[activeTab];

  return (
    <div>
      <div className="tabbar">
        <div className="tabbar-scroll" ref={tabRef}>
          {CATEGORIES.map((c) => (
            <button key={c.id} data-tab={c.id} className={"tab " + (c.id === activeTab ? "on" : "")} onClick={() => setActiveTab(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="cat-banner">
        <img src={cat.banner} alt={cat.name} />
      </div>

      {groups.map((g, gi) => {
        const CatIc = ({ leaf: I.Leaf, basket: I.Basket, orchid: I.Orchid, wreath: I.Wreath, memorial: I.Memorial })[cat.icon];
        return (
        <section className="group" key={gi}>
          <span className="group-kicker"><CatIc size={12} strokeWidth={2} /> {g.tag}</span>
          <h3>
            <span className="light">{g.kicker}</span>
            {g.title}
          </h3>
          <div className="products">
            {g.items.map((it, i) => (
              <button className="product" key={i} onClick={() => onPick({ ...it, category: cat.name, group: g.title })}>
                <div className="product-img">
                  <span className="tag">{g.tag}</span>
                  <img src={it.img} alt={it.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <div className="product-name">{it.name}</div>
                  <div className="product-price">{fmt(it.price)}<span className="won">원</span></div>
                </div>
              </button>
            ))}
          </div>
        </section>
        );
      })}

      <div className="footer">
        <a className="num" href={PHONE_HREF}>{PHONE}</a>
        <p>마음에 드는 상품이 없으신가요? 전화로 상담받으세요</p>
      </div>
    </div>
  );
}

// ---------- ORDER ----------
function OrderScreen({ initialProduct }) {
  const [form, setForm] = useState({
    product: initialProduct || "",
    address: "",
    recipient: "",
    sender: "",
    message: "",
  });
  const [toast, setToast] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (initialProduct) setForm((f) => ({ ...f, product: initialProduct }));
  }, [initialProduct]);

  const fields = [
    { id: "product",   label: "상품 분류 및 이름", hint: "EX) 개업화분 뱅갈나무", icon: I.Tag },
    { id: "address",   label: "보내는 장소(상세주소)", hint: "EX) 부산 동구 고관로29번길 8 솥뚜껑삼겹살", icon: I.Pin },
    { id: "recipient", label: "받는 분 정보(성함, 연락처)", hint: "EX) 홍길동, 010-0000-0000", icon: I.User },
    { id: "sender",    label: "리본문구 좌측(보내는분)", hint: "EX) 00컴퍼니 대표이사 홍길동", icon: I.Edit },
    { id: "message",   label: "리본문구 우측(경조사어)", hint: "EX) 개업을 진심으로 축하합니다", icon: I.Heart, guide: true },
  ];
  const done = fields.filter((f) => form[f.id].trim().length > 0).length;
  const total = fields.length;

  const send = () => {
    if (done === 0) {
      setToast("최소 한 가지 이상 입력해주세요");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    const body = [
      "상품 분류 및 이름: " + form.product,
      "보내는 장소(상세주소): " + form.address,
      "받는 분 정보(성함, 연락처): " + form.recipient,
      "리본문구 좌측(보내는분): " + form.sender,
      "리본문구 우측(경조사어): " + form.message,
    ].join("\n");
    const url = SMS_HREF + "?&body=" + encodeURIComponent(body);
    setToast("문자 앱을 열고 있어요");
    setTimeout(() => { window.location.href = url; setTimeout(() => setToast(null), 1200); }, 400);
  };

  return (
    <div>
      <div className="order-hero">
        <span className="step-pill"><I.Edit size={12} strokeWidth={2.2} /> 주문서 작성</span>
        <h2>내용을 작성하시면<br />문자로 주문이 보내져요</h2>
        <p>입력한 내용은 그대로 메시지에 복사돼요. 자세히 입력할수록 빨리 처리할 수 있어요.</p>
      </div>

      <div className="progress" aria-label={`${done}/${total} 입력 완료`}>
        {fields.map((_, i) => <span key={i} className={i < done ? "on" : ""} />)}
      </div>
      <div style={{ padding: "8px 20px 0", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sm-content-tertiary)" }}>
        <span>입력 진행</span>
        <span style={{ fontWeight: 700, color: "var(--sm-content-secondary)", fontVariantNumeric: "tabular-nums" }}>{done}/{total}</span>
      </div>

      <form className="form" onSubmit={(e) => { e.preventDefault(); send(); }}>
        {fields.map((f, i) => {
          const Ic = f.icon;
          const value = form[f.id];
          const isDone = value.trim().length > 0;
          return (
            <div className={"field " + (isDone ? "done" : "")} key={f.id}>
              <div className="field-label">
                <span className="lbl">
                  <span className="stepno">{i + 1}</span>
                  {f.label}
                </span>
                {f.guide ? (
                  <button type="button" className="field-guide-btn" onClick={() => setGuideOpen(true)}>
                    <I.Sparkle size={12} strokeWidth={2.2} /> 작성가이드
                  </button>
                ) : (
                  isDone ? <I.Check size={16} strokeWidth={2.4} style={{ color: "var(--p-green-500)" }} /> : <Ic size={16} style={{ color: "var(--sm-content-tertiary)" }} />
                )}
              </div>
              <input
                type="text"
                value={value}
                placeholder={f.hint}
                onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
              />
            </div>
          );
        })}
      </form>

      <div className="notice">
        <h5>NOTICE</h5>
        <h6>주문 시 꼭 확인해주세요</h6>
        <ul>
          <li>배송완료 이후에 사진과 수령인을 발송해 드려요.</li>
          <li>18:00 이후 주문은 익일 오전 중 배송돼요.</li>
          <li>일부 지역에서 배송비가 발생할 수 있어요.</li>
          <li>화분의 종류는 변경될 수 있어요.</li>
        </ul>
      </div>

      <div className="dock">
        <button className="btn" onClick={send}>
          <I.Chat size={18} strokeWidth={2} /> 작성한 내용으로 주문하기
        </button>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--sm-content-tertiary)" }}>
          또는 <a href={PHONE_HREF} style={{ color: "var(--p-indigo-600)", fontWeight: 700 }}>전화로 바로 주문하기</a>
        </div>
      </div>

      {toast && <div className="toast"><I.Check size={16} strokeWidth={2.4} /> {toast}</div>}
      {guideOpen && (
        <RibbonGuide
          onClose={() => setGuideOpen(false)}
          onPick={(text) => { setForm((f) => ({ ...f, message: text })); setGuideOpen(false); setToast("리본문구가 입력되었어요"); setTimeout(() => setToast(null), 1800); }}
        />
      )}
    </div>
  );
}

// ---------- FAQ ----------
function FaqScreen() {
  const [activeCat, setActiveCat] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState("");

  const cats = [{ id: "all", label: "전체" }, ...window.FAQ_CATEGORIES];
  const filtered = window.FAQ_ITEMS.filter((it) => {
    if (activeCat !== "all" && it.cat !== activeCat) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q);
    }
    return true;
  });

  const catLabel = (id) => window.FAQ_CATEGORIES.find((c) => c.id === id)?.label || "";

  return (
    <div>
      <div className="faq-hero">
        <span className="step-pill"><I.Help size={12} strokeWidth={2.2} /> 자주 묻는 질문</span>
        <h2>궁금한 점을<br />빠르게 찾아드려요</h2>
        <p>배송·주문·상품·결제 관련 답변을 모았어요. 더 궁금한 점은 전화 또는 문자로 문의주세요.</p>
        <div className="faq-search">
          <I.Search size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="질문 검색하기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="faq-clear" onClick={() => setQuery("")} aria-label="검색어 지우기">
              <I.Close size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      <div className="faq-tabs">
        {cats.map((c) => (
          <button key={c.id} className={"faq-tab " + (c.id === activeCat ? "on" : "")} onClick={() => setActiveCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {filtered.length === 0 ? (
          <div className="faq-empty">
            <I.Search size={28} strokeWidth={1.5} />
            <h4>검색 결과가 없어요</h4>
            <p>다른 키워드로 검색하거나 전화로 문의해주세요.</p>
            <a href={PHONE_HREF} className="btn-secondary" style={{ marginTop: 12, width: "auto", display: "inline-flex", padding: "0 18px" }}>
              <I.Phone size={16} /> 전화로 문의하기
            </a>
          </div>
        ) : filtered.map((it, i) => {
          const id = `${it.cat}-${i}`;
          const isOpen = openId === id;
          return (
            <div key={id} className={"faq-item " + (isOpen ? "open" : "")}>
              <button className="faq-q" onClick={() => setOpenId(isOpen ? null : id)} aria-expanded={isOpen}>
                <span className="faq-q-text">
                  <span className="faq-cat">{catLabel(it.cat)}</span>
                  <span className="faq-q-title">{it.q}</span>
                </span>
                <span className="faq-icon" aria-hidden="true">
                  {isOpen ? <I.Minus size={18} /> : <I.Plus size={18} />}
                </span>
              </button>
              {isOpen && <div className="faq-a">{it.a}</div>}
            </div>
          );
        })}
      </div>

      <div className="faq-foot">
        <h4>여전히 궁금한 점이 있으신가요?</h4>
        <p>전화·문자로 문의주시면 빠르게 답변해드려요.</p>
        <div className="footer-row">
          <a href={SMS_HREF} className="btn-secondary"><I.Chat size={18} /> 문자 문의</a>
          <a href={PHONE_HREF} className="btn"><I.Phone size={18} /> 전화 걸기</a>
        </div>
      </div>
    </div>
  );
}

// ---------- RIBBON GUIDE SHEET ----------
function RibbonGuide({ onClose, onPick }) {
  const [activeId, setActiveId] = useState(window.RIBBON_GUIDE[0].id);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);
  const active = window.RIBBON_GUIDE.find((g) => g.id === activeId);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet sheet-tall" role="dialog" aria-modal="true" aria-label="리본문구 작성가이드">
        <div className="sheet-handle" />
        <div className="guide-head">
          <h3>리본문구 작성가이드</h3>
          <button className="sheet-close" onClick={onClose} aria-label="닫기"><I.Close size={18} /></button>
        </div>
        <div className="guide-tabs">
          {window.RIBBON_GUIDE.map((g) => (
            <button key={g.id} className={"guide-tab " + (g.id === activeId ? "on" : "")} onClick={() => setActiveId(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="guide-body">
          <ul className="guide-list">
            {active.items.map((it, i) => (
              <li key={i}>
                <span className="guide-text">
                  {it.text}
                  {it.note && <span className="guide-note"> {it.note}</span>}
                </span>
                <button className="guide-apply" onClick={() => onPick(it.text)} aria-label={`${it.text} 사용`}>
                  <I.Copy size={14} strokeWidth={2.2} />
                  사용
                </button>
              </li>
            ))}
          </ul>
          <div className="guide-notice">
            <div className="guide-notice-title">유의사항</div>
            <ul>
              <li>리본문구는 <strong>1,570,000</strong> 주문자들의 빅데이터 기반으로 제공하고 있습니다. 상황별, 대상별 적절한 리본문구를 작성해주시기 바랍니다!</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- ITEM SHEET ----------
function ItemSheet({ item, onClose, onOrder }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);
  if (!item) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item.name}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h4>이미지 크게보기</h4>
          <button className="sheet-close" onClick={onClose} aria-label="닫기"><I.Close size={18} /></button>
        </div>
        <div className="sheet-body">
          <div className="sheet-img">
            <img src={item.imgLg} alt={item.name} />
          </div>
          <div className="sheet-meta">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sm-content-tertiary)" }}>
              <span>{item.category}</span>
              <span>·</span>
              <span>{item.group}</span>
            </div>
            <div className="name">{item.name}</div>
            <div className="price">{fmt(item.price)}<span className="won">원</span></div>
            <div className="ribbon">
              <I.Info size={16} strokeWidth={2.2} />
              <div>
                실제 상품은 시즌과 재고에 따라 색감이나 구성이 조금 달라질 수 있어요.<br />
                정확한 상품은 주문 전 전화로 확인해 주세요.
              </div>
            </div>
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn-secondary" onClick={onClose}>닫기</button>
          <button className="btn" onClick={() => onOrder(item)}>
            <I.Edit size={18} strokeWidth={2} /> 이 상품으로 주문하기
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- App root ----------
function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "brand": "#4F46E5",
    "dark": false,
    "tabStyle": "pill"
  }/*EDITMODE-END*/;
  const [t, setTweak] = (window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}]);

  // brand color override
  useEffect(() => {
    const root = document.documentElement;
    if (t.brand) {
      root.style.setProperty("--p-indigo-500", t.brand);
      // derive hover/active
      root.style.setProperty("--p-indigo-600", shade(t.brand, -0.12));
      root.style.setProperty("--p-indigo-700", shade(t.brand, -0.24));
      root.style.setProperty("--p-indigo-50", tint(t.brand, 0.92));
      root.style.setProperty("--p-indigo-100", tint(t.brand, 0.80));
      root.style.setProperty("--p-indigo-300", tint(t.brand, 0.45));
      root.style.setProperty("--p-indigo-400", tint(t.brand, 0.25));
    }
    root.dataset.theme = t.dark ? "dark" : "light";
  }, [t.brand, t.dark]);

  // route + state
  const [route, setRoute] = useState(() => {
    const h = (location.hash || "").replace("#", "");
    if (h === "items" || h === "order" || h === "faq") return h;
    return "home";
  });
  const [activeTab, setActiveTab] = useState("tab1");
  const [sheet, setSheet] = useState(null);
  const [orderSeed, setOrderSeed] = useState(null);

  // 어드민 상품 편집기 미리보기 — ?preview=product 진입 시 postMessage(draftProduct) 를 받아 시트로 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") !== "product") return;
    const handler = (e) => {
      const d = e && e.data;
      if (d && d.type === "draftProduct" && d.product) {
        const p = d.product;
        setSheet({
          id: p.id,
          name: p.name || "(이름 없음)",
          price: p.price,
          img: p.img || p.image,
          imgLg: p.img || p.image,
          desc: p.desc || p.description || "",
          tag: p.tag,
        });
      }
    };
    window.addEventListener("message", handler);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: "previewReady" }, "*"); } catch (_) {}
    }
    return () => window.removeEventListener("message", handler);
  }, []);

  const go = (r) => { setRoute(r); location.hash = r === "home" ? "" : r; window.scrollTo(0, 0); };
  const openCat = (tabId) => { setActiveTab(tabId); go("items"); };
  const orderProduct = (it) => {
    setOrderSeed(`${it.name} (${fmt(it.price)}원)`);
    setSheet(null);
    go("order");
  };

  const scrolled = useScrolled();
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  let title = null;
  let onBack = null;
  if (route === "items") { title = "상품목록"; onBack = () => go("home"); }
  if (route === "order") { title = "주문하기"; onBack = () => go("home"); }
  if (route === "faq")   { title = "질의응답"; onBack = () => go("home"); }

  return (
    <div className="app">
      <div className="app-frame">
        <AppBar title={title} onBack={onBack} scrolled={scrolled} />
        {route === "home"  && <HomeScreen go={go} openCat={openCat} onPick={setSheet} />}
        {route === "items" && <ItemsScreen activeTab={activeTab} setActiveTab={setActiveTab} onPick={setSheet} />}
        {route === "order" && <OrderScreen initialProduct={orderSeed} />}
        {route === "faq"   && <FaqScreen />}
        {sheet && <ItemSheet item={sheet} onClose={() => setSheet(null)} onOrder={orderProduct} />}
      </div>
      <BottomNav route={route} go={go} />
      {/* Tweaks */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Theme">
            <window.TweakColor
              label="Brand color"
              value={t.brand}
              onChange={(v) => setTweak("brand", v)}
              options={["#4F46E5", "#0F766E", "#B91C5D", "#C2410C", "#1F2937"]}
            />
            <window.TweakToggle
              label="Dark mode"
              value={t.dark}
              onChange={(v) => setTweak("dark", v)}
            />
          </window.TweakSection>
          <window.TweakSection title="Quick actions">
            <window.TweakButton onClick={() => go("home")}>Go to Home</window.TweakButton>
            <window.TweakButton onClick={() => go("items")}>Go to Items</window.TweakButton>
            <window.TweakButton onClick={() => go("order")}>Go to Order</window.TweakButton>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

// ---------- color helpers ----------
function hexToRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
function tint(hex, amt) {
  // mix toward white by amt (0..1)
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
