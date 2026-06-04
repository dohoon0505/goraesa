/* eslint-disable */
// Inline-styled SVG icons matching UIUX-DH iconography spec
// 24×24 viewBox · 1.7 stroke · round caps · currentColor

function Icon({ d, size = 22, strokeWidth = 1.8, fill = "none", children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const I = {
  Home: (p) => <Icon {...p}><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></Icon>,
  List: (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h12" /></Icon>,
  Order: (p) => <Icon {...p}><path d="M9 4h6l1 4H8z" /><path d="M5 8h14l-1 12H6z" /><path d="M9 12v4M15 12v4" /></Icon>,
  Phone: (p) => <Icon {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icon>,
  Chat: (p) => <Icon {...p}><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4z" /></Icon>,
  Arrow: (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>,
  Back: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>,
  Close: (p) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12" /></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5 9-10" /></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Icon>,
  Doc: (p) => <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Icon>,
  Truck: (p) => <Icon {...p}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" /><path d="M19 4l.5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5z" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>,
  // Category icons — outlined glyphs
  Leaf: (p) => <Icon {...p}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19l7-7" /></Icon>,
  Basket: (p) => <Icon {...p}><path d="M5 10h14l-1.5 9h-11z" /><path d="M8 10l2-5M16 10l-2-5" /></Icon>,
  Orchid: (p) => <Icon {...p}><path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z" /><path d="M12 12c0-3-2-5-5-5 0 3 2 5 5 5z" /><path d="M12 12c-2 0-4 2-4 4 2 0 4-2 4-4z" /><path d="M12 12c2 0 4 2 4 4-2 0-4-2-4-4z" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></Icon>,
  Wreath: (p) => <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M9 5l-1 3M15 5l1 3M5 9l3 1M5 15l3-1M9 19l-1-3M15 19l1-3M19 9l-3 1M19 15l-3-1" /></Icon>,
  Memorial: (p) => <Icon {...p}><path d="M8 21V9a4 4 0 0 1 8 0v12" /><path d="M6 21h12" /><path d="M12 5V3" /></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></Icon>,
  Tag: (p) => <Icon {...p}><path d="M4 12V4h8l8 8-8 8z" /><circle cx="9" cy="9" r="1.4" /></Icon>,
  Copy: (p) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Icon>,
  Help: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2.5-2.5 4" /><path d="M12 17h.01" /></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Minus: (p) => <Icon {...p}><path d="M5 12h14" /></Icon>,
  Edit: (p) => <Icon {...p}><path d="M4 20l4-1 11-11-3-3L5 16z" /></Icon>,
  Gift: (p) => <Icon {...p}><rect x="3" y="8" width="18" height="13" rx="1.5" /><path d="M3 12h18M12 8v13" /><path d="M12 8c-2 0-4-1-4-3a2 2 0 0 1 4 0c0 2 2 3 4 3a2 2 0 0 0 0-4c-2 0-4 2-4 4z" /></Icon>,
  Heart: (p) => <Icon {...p}><path d="M12 21s-7-4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5-9 9-9 9z" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Icon>,
};

window.I = I;
