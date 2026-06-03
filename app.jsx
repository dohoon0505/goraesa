/* eslint-disable */
const { useState, useEffect, useRef, useMemo } = React;

// admin/기본 정보 입력(SITE_INFO.phone) 우선, 없으면 기존 정적 값.
const PHONE = (typeof window !== "undefined" && window.SITE_INFO && window.SITE_INFO.phone) || "010-0000-0000";
const PHONE_HREF = "tel:" + PHONE.replace(/[^\d]/g, "");
const SMS_HREF = "sms:01076152699";

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
      <div className="pagetitle">{title || "경조사 지원센터"}</div>
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
    { id: "order", label: "신청하기", icon: I.Order },
    { id: "history", label: "신청내역", icon: I.Doc },
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

      <section className="section how-section">
        <div className="section-head">
          <h3>경조사 지원 신청방법</h3>
          <p className="how-sub">전화 없이도, 누구나 3분이면 주문을 완성할 수 있어요.</p>
        </div>
        <ol className="how-timeline">
          {[
            { n: "01", t: "상황별 상품 선택", d: "어떤 대상에게 어떤 경조사가 발생하였나요?\n상황에 맞춰 상품을 선택할 수 있어요", icon: I.Gift },
            { n: "02", t: "주문서 작성", d: "경조사 지원에 필요한 모든 내용(배송주소, 받는분 정보 등)을 작성하여 신청해주세요", icon: I.Edit },
            { n: "03", t: "경조사 신청 완료", d: "메시지 한 통을 보내면 주문이 완료돼요.\n곧바로 담당자가 확인 연락을 드려요.", icon: I.Sparkle },
            { n: "04", t: "상품배송 완료", d: "주문하신 상품을 정성껏 준비해 배송해드리고, 완료 후 사진을 발송해 드려요.", icon: I.Truck },
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
          <div className="faq-list" style={{ padding: 0 }}>
            {pickedFaqs.map((it, i) => <HomeFaqItem key={i} item={it} />)}
          </div>
        </section>
      )}

      <div className="footer">
        <a className="num" href={PHONE_HREF}>{PHONE}</a>
        <p>경조사 지원 문의센터</p>
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
  const [recentOpen, setRecentOpen] = useState(false);

  useEffect(() => {
    if (initialProduct) setForm((f) => ({ ...f, product: initialProduct }));
  }, [initialProduct]);

  const fields = [
    { id: "product",   label: "상품 분류 및 이름", hint: "EX) 개업화분 뱅갈나무", icon: I.Tag },
    { id: "address",   label: "보내는 장소(상세주소)", hint: "EX) 부산 동구 고관로29번길 8 솥뚜껑삼겹살", icon: I.Pin, multiline: true },
    { id: "recipient", label: "받는 분 정보(성함, 연락처)", hint: "EX) 홍길동, 010-0000-0000", icon: I.User },
    { id: "sender",    label: "리본문구 좌측(보내는분)", hint: "EX) 00컴퍼니 대표이사 홍길동", icon: I.Edit, recent: true },
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
                ) : f.recent ? (
                  <button type="button" className="field-guide-btn" onClick={() => setRecentOpen(true)}>
                    <I.Clock size={12} strokeWidth={2.2} /> 최근작성
                  </button>
                ) : (
                  isDone ? <I.Check size={16} strokeWidth={2.4} style={{ color: "var(--p-green-500)" }} /> : <Ic size={16} style={{ color: "var(--sm-content-tertiary)" }} />
                )}
              </div>
              {f.multiline ? (
                <textarea
                  rows={2}
                  value={value}
                  placeholder={f.hint}
                  onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  placeholder={f.hint}
                  onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                />
              )}
            </div>
          );
        })}
      </form>

      <div className="notice">
        <h5>NOTICE</h5>
        <h6>주문 시 꼭 확인해주세요</h6>
        <ul>
          <li>배송완료 이후에 사진을 발송해 드려요.</li>
          <li>18:30 이후 주문은 익일 오전 중 배송돼요.</li>
          <li>일부 지역에서 배송비가 발생할 수 있어요.</li>
          <li>화분의 종류는 변경될 수 있어요.</li>
        </ul>
      </div>

      <div className="dock">
        <button className="btn" onClick={send}>
          <I.Chat size={18} strokeWidth={2} /> 작성한 내용으로 신청
        </button>
      </div>

      {toast && <div className="toast"><I.Check size={16} strokeWidth={2.4} /> {toast}</div>}
      {guideOpen && (
        <RibbonGuide
          onClose={() => setGuideOpen(false)}
          onPick={(text) => { setForm((f) => ({ ...f, message: text })); setGuideOpen(false); setToast("리본문구가 입력되었어요"); setTimeout(() => setToast(null), 1800); }}
        />
      )}
      {recentOpen && (
        <RecentSenders
          onClose={() => setRecentOpen(false)}
          onPick={(text) => { setForm((f) => ({ ...f, sender: text })); setRecentOpen(false); setToast("보내는분이 입력되었어요"); setTimeout(() => setToast(null), 1800); }}
        />
      )}
    </div>
  );
}

// ---------- FAQ ----------
function HistoryScreen() {
  const [filter, setFilter] = useState("all");
  const filtersRef = useRef(null);
  useEffect(() => {
    const el = filtersRef.current?.querySelector(`[data-filter='${filter}']`);
    if (el) el.scrollIntoViewIfNeeded?.() ?? el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [filter]);

  const STATUS = {
    pending:   { label: "접수대기", cls: "pending" },
    received:  { label: "접수완료", cls: "received" },
    delivered: { label: "배송완료", cls: "delivered" },
    cancelled: { label: "주문취소", cls: "cancelled" },
  };
  const filters = [
    { id: "all", label: "전체" },
    { id: "pending", label: "접수대기" },
    { id: "received", label: "접수완료" },
    { id: "delivered", label: "배송완료" },
    { id: "cancelled", label: "주문취소" },
  ];

  const records = window.ORDER_HISTORY || [];
  const list = records.filter((r) => filter === "all" || r.status === filter);

  return (
    <div>
      <div className="hist-hero">
        <span className="step-pill"><I.Doc size={12} strokeWidth={2.2} /> 신청내역</span>
        <h2>신청하신 내역을<br />확인할 수 있어요</h2>
        <p>경조사 지원 신청 건의 진행 상태를 확인할 수 있어요.<br />접수완료 되어있다면 요청한 일시에 맞춰 배송되어요.</p>
      </div>

      <div className="hist-filters" ref={filtersRef}>
        {filters.map((f) => (
          <button key={f.id} data-filter={f.id} className={"hist-chip " + (f.id === filter ? "on" : "")} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="hist-list">
        {list.length === 0 ? (
          <div className="hist-empty">
            <I.Clock size={28} strokeWidth={1.5} />
            <h4>신청내역이 없어요</h4>
            <p>해당 상태의 신청 건이 없습니다.</p>
          </div>
        ) : list.map((r) => {
          const st = STATUS[r.status] || {};
          return (
            <div className="hist-card" key={r.id}>
              <div className="hist-product-row">
                <span className="hist-product">{r.category}</span>
                <span className={"hist-badge " + (st.cls || "")}>{st.label}</span>
              </div>
              <dl className="hist-rows">
                <div><dt>신청상품</dt><dd>{r.product}</dd></div>
                <div><dt>받는 분</dt><dd>{r.recipient}</dd></div>
                <div className="hist-addr"><dt>보내는 장소</dt><dd>{r.address}</dd></div>
                <div><dt>경조사어</dt><dd>{r.message}</dd></div>
                <div><dt>보내는분</dt><dd>{r.sender}</dd></div>
              </dl>
              <div className="hist-card-foot">
                <span className="hist-date">{r.date}</span>
                <span className="hist-price">{fmt(r.price)}원</span>
              </div>
            </div>
          );
        })}
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

// ---------- RECENT SENDERS SHEET ----------
function RecentSenders({ onClose, onPick }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);
  const list = window.RECENT_SENDERS || [];
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="최근 작성한 보내는분">
        <div className="sheet-handle" />
        <div className="guide-head">
          <h3>최근 작성한 보내는분</h3>
          <button className="sheet-close" onClick={onClose} aria-label="닫기"><I.Close size={18} /></button>
        </div>
        <div className="guide-body">
          {list.length === 0 ? (
            <div className="faq-empty" style={{ padding: "32px 0" }}>
              <I.Clock size={28} strokeWidth={1.5} />
              <h4>최근 작성한 내역이 없어요</h4>
              <p>보내는분을 직접 입력해주세요.</p>
            </div>
          ) : (
            <ul className="guide-list">
              {list.map((text, i) => (
                <li key={i}>
                  <span className="guide-text">{text}</span>
                  <button className="guide-apply" onClick={() => onPick(text)} aria-label={`${text} 선택`}>
                    <I.Check size={14} strokeWidth={2.2} />
                    선택
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            <img src={item.imgLg || item.img} alt={item.name} />
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
              <div>
                실제 상품은 시즌과 재고에 따라 색감이나 구성이 조금 달라질 수 있어요. 정확한 상품은 주문 전 전화로 확인해 주세요.
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
// ---------- Splash (앱 스플래시 화면) ----------
function Splash({ onDone }) {
  const DURATION = 3000; // 프로그래스바 + 카운트다운 길이 (3초)
  const [phase, setPhase] = useState("intro"); // intro → exit
  const [progress, setProgress] = useState(0);
  const [remain, setRemain] = useState(Math.ceil(DURATION / 1000));
  const exitTimer = useRef(null);

  const enter = () => {
    if (exitTimer.current) return;
    setPhase("exit");
    exitTimer.current = setTimeout(() => onDone && onDone(), 650);
  };

  // 3초 동안 진행률 + 남은 시간 카운트다운 → 완료 시 자동 진입
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      setProgress(Math.min(100, (elapsed / DURATION) * 100));
      setRemain(Math.max(1, Math.ceil((DURATION - elapsed) / 1000)));
      if (elapsed < DURATION) raf = requestAnimationFrame(tick);
      else enter();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  return (
    <div
      className={"splash splash-" + phase}
      onClick={enter}
      role="button"
      tabIndex={0}
      aria-label="늘푸른바다 경조사 지원센터 시작하기"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enter();
        }
      }}
    >
      <div className="splash-bg" aria-hidden="true" />
      <div className="splash-scrim" aria-hidden="true" />
      <div className="splash-content">
        <span className="splash-eyebrow">경조사 토탈 케어 서비스</span>
        <h1 className="splash-title">
          <span className="splash-line splash-line-1">
            늘푸른바다 <em>(고래사)</em>
          </span>
          <span className="splash-line splash-line-2">경조사 지원센터</span>
        </h1>
        <div className="splash-loader" aria-hidden="true">
          <span className="splash-loader-bar" style={{ width: progress + "%" }} />
        </div>
        <span className="splash-countdown" aria-live="polite">
          {remain}초 뒤 접속됩니다
        </span>
      </div>
    </div>
  );
}

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
    if (h === "items" || h === "order" || h === "history") return h;
    return "home";
  });
  const [activeTab, setActiveTab] = useState("tab1");
  const [sheet, setSheet] = useState(null);
  const [orderSeed, setOrderSeed] = useState(null);

  // 웹 접속 시 앱 스플래시 화면 (어드민 상품 미리보기 진입 시에는 생략)
  const [showSplash, setShowSplash] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("preview") !== "product";
  });
  useEffect(() => {
    document.body.style.overflow = showSplash ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSplash]);

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
  if (route === "history") { title = "신청내역"; onBack = () => go("home"); }

  return (
    <React.Fragment>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
    <div className="app">
      <div className="app-frame">
        <AppBar title={title} onBack={onBack} scrolled={scrolled} />
        {route === "home"  && <HomeScreen go={go} openCat={openCat} onPick={setSheet} />}
        {route === "items" && <ItemsScreen activeTab={activeTab} setActiveTab={setActiveTab} onPick={setSheet} />}
        {route === "order" && <OrderScreen initialProduct={orderSeed} />}
        {route === "history" && <HistoryScreen />}
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
    </React.Fragment>
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
