/* eslint-disable */
// flower_example — 상품 카탈로그 (자동 생성: publishToGitHub)
const CATEGORIES = [
  { id: "tab1", name: "개업화분", blurb: "개업·이전하는 지인에게", banner: "img/banner_tab1.png", photo: "img/cat_tab1.png", icon: "leaf", accent: "#16A34A", accentBg: "#DCFCE7" },
  { id: "tab2", name: "꽃바구니", blurb: "기념일·생일·특별한 날에", banner: "img/banner_tab2.png", photo: "img/cat_tab2.png", icon: "basket", accent: "#D946A6", accentBg: "#FDE7F4" },
  { id: "tab3", name: "동서양란", blurb: "이·취임식·승진 축하 자리에", banner: "img/banner_tab3.png", photo: "img/cat_tab3.png", icon: "orchid", accent: "var(--p-indigo-500)", accentBg: "var(--p-indigo-50)" },
  { id: "tab4", name: "축하화환", blurb: "개업식·결혼식·행사장에", banner: "img/banner_tab4.png", photo: "img/tab4_grand1.jpg", icon: "wreath", accent: "var(--p-amber-500)", accentBg: "#FEF3D1" },
  { id: "tab5", name: "근조화환", blurb: "장례식장·애도현장으로", banner: "img/banner_tab5.png", photo: "img/tab5_grand1.jpg", icon: "memorial", accent: "var(--p-neutral-70)", accentBg: "var(--p-neutral-20)" }
];
const SECTIONS = {
  tab1: [
    { kicker: "다른 사람들이 평균적으로", title: "많이 구매하는 개업화분", tag: "베스트상품", items: [{ productId: "tab1-s1-1", id: "tab1-s1-1", name: "행복을 가져다주는 해피트리", price: 110000, img: "img/tab1_item1_img1.png" }, { productId: "tab1-s1-2", id: "tab1-s1-2", name: "행복을 빌어주는 뱅갈나무", price: 120000, img: "img/tab1_item2_img1.png" }] },
    { kicker: "비교적 저렴한 가격대,", title: "가볍게 선물하기 좋은 개업화분", tag: "경제적인 선택", items: [{ productId: "tab1-s2-1", id: "tab1-s2-1", name: "행복을 빌어주는 고무나무", price: 87000, img: "img/tab1_item3_img1.png" }, { productId: "tab1-s2-2", id: "tab1-s2-2", name: "키우기가 쉬운 스파트필름", price: 79000, img: "img/tab1_item4_img1.png" }] },
    { kicker: "남들과 비슷한 것이 싫다면,", title: "독보적이고 특별한 개업화분", tag: "프리미엄", items: [{ productId: "tab1-s3-1", id: "tab1-s3-1", name: "튼튼하고 오래사는 떡갈나무", price: 120000, img: "img/tab1_item5_img1.png" }, { productId: "tab1-s3-2", id: "tab1-s3-2", name: "색상이 인상적인 크로톤", price: 110000, img: "img/tab1_item6_img1.png" }] }
  ],
  tab2: [
    { kicker: "다른 사람들이 평균적으로", title: "많이 구매하는 꽃바구니", tag: "베스트상품", items: [{ productId: "tab2-s1-1", id: "tab2-s1-1", name: "파스텔톤 혼합 꽃바구니", price: 78000, img: "img/tab2_item1_img1.png" }, { productId: "tab2-s1-2", id: "tab2-s1-2", name: "연핑크톤 장미 꽃바구니", price: 86000, img: "img/tab2_item2_img1.png" }] },
    { kicker: "비교적 저렴한 가격대,", title: "가볍게 선물하기 좋은 꽃바구니", tag: "경제적인 선택", items: [{ productId: "tab2-s2-1", id: "tab2-s2-1", name: "연보라톤 혼합 꽃바구니", price: 65000, img: "img/tab2_item3_img1.png" }, { productId: "tab2-s2-2", id: "tab2-s2-2", name: "화사한 빨강화이트 꽃바구니", price: 60000, img: "img/tab2_item4_img1.png" }] },
    { kicker: "특별한 사람에게 보내는 것이라면,", title: "독보적이고 특별한 꽃바구니", tag: "프리미엄", items: [{ productId: "tab2-s3-1", id: "tab2-s3-1", name: "빨간장미 한가득 꽃바구니", price: 110000, img: "img/tab2_item5_img1.png" }, { productId: "tab2-s3-2", id: "tab2-s3-2", name: "핑크장미 한가득 꽃바구니", price: 110000, img: "img/tab2_item6_img1.png" }] }
  ],
  tab3: [
    { kicker: "다른 사람들이 평균적으로", title: "많이 구매하는 승진취임 화분", tag: "베스트상품", items: [{ productId: "tab3-s1-1", id: "tab3-s1-1", name: "고급스러운 청자 황룡금", price: 96000, img: "img/tab3_item1_img1.png" }, { productId: "tab3-s1-2", id: "tab3-s1-2", name: "잎새가 아름다운 철골소심", price: 65000, img: "img/tab3_item2_img1.png" }] },
    { kicker: "종류 별 색상이 포인트,", title: "아름다운 색을 띄는 서양란 화분", tag: "COLOR", items: [{ productId: "tab3-s2-1", id: "tab3-s2-1", name: "강렬한 인상의 진핑크 호접란", price: 88000, img: "img/tab3_item3_img1.png" }, { productId: "tab3-s2-2", id: "tab3-s2-2", name: "따듯한 인상의 연핑크 호접란", price: 130000, img: "img/tab3_item4_img1.png" }] },
    { kicker: "평범하지 않은 상품을 찾으신다면,", title: "독특함을 자랑하는 동·서양란 화분", tag: "프리미엄", items: [{ productId: "tab3-s3-1", id: "tab3-s3-1", name: "넓은 잎이 특징인 산천보세", price: 65000, img: "img/tab3_item5_img1.png" }, { productId: "tab3-s3-2", id: "tab3-s3-2", name: "특색있는 노란색의 호접란", price: 120000, img: "img/tab3_item6_img1.png" }] }
  ],
  tab4: [
    { kicker: "예의상 보내야 하는 관계라면,", title: "무난하게 보내기 좋은 기본 축하화환", tag: "경제적인 선택", items: [{ productId: "tab4-s1-1", id: "tab4-s1-1", name: "기본형 축하화환 (1)", price: 60000, img: "img/tab4_basic1.png" }, { productId: "tab4-s1-2", id: "tab4-s1-2", name: "기본형 축하화환 (2)", price: 60000, img: "img/tab4_basic2.jpg" }] },
    { kicker: "조금 신경써야 하는 관계라면,", title: "장식이 추가되고 꽃이 풍성한 고급 축하화환", tag: "프리미엄", items: [{ productId: "tab4-s2-1", id: "tab4-s2-1", name: "고급형 축하화환 (1)", price: 80000, img: "img/tab4_premium1.jpg" }, { productId: "tab4-s2-2", id: "tab4-s2-2", name: "고급형 축하화환 (2)", price: 80000, img: "img/tab4_premium2.jpg" }] },
    { kicker: "많이 애틋하고 소중한 사람이라면,", title: "독보적으로 풍성한 특대 축하화환", tag: "차이가 확실한", items: [{ productId: "tab4-s3-1", id: "tab4-s3-1", name: "특대형 축하화환 (1)", price: 93000, img: "img/tab4_grand1.jpg" }, { productId: "tab4-s3-2", id: "tab4-s3-2", name: "특대형 축하화환 (2)", price: 93000, img: "img/tab4_grand2.jpg" }] }
  ],
  tab5: [
    { kicker: "예의상 보내야 하는 관계라면,", title: "무난하게 보내기 좋은 기본 근조화환", tag: "경제적인 선택", items: [{ productId: "tab5-s1-1", id: "tab5-s1-1", name: "기본형 근조화환 (1)", price: 60000, img: "img/tab5_basic1.jpg" }, { productId: "tab5-s1-2", id: "tab5-s1-2", name: "기본형 근조화환 (2)", price: 60000, img: "img/tab5_basic2.png" }] },
    { kicker: "조금 신경써야 하는 관계라면,", title: "장식이 추가되고 꽃이 풍성한 고급 근조화환", tag: "프리미엄", items: [{ productId: "tab5-s2-1", id: "tab5-s2-1", name: "고급형 근조화환 (1)", price: 80000, img: "img/tab5_premium1.jpg" }, { productId: "tab5-s2-2", id: "tab5-s2-2", name: "고급형 근조화환 (2)", price: 80000, img: "img/tab5_premium2.jpg" }] },
    { kicker: "많이 애틋하고 소중한 사람이라면,", title: "독보적으로 풍성한 특대 & 4단 근조화환", tag: "차이가 확실한", items: [{ productId: "tab5-s3-1", id: "tab5-s3-1", name: "특대형 근조화환", price: 100000, img: "img/tab5_grand1.jpg" }, { productId: "tab5-s3-2", id: "tab5-s3-2", name: "4단형 근조화환", price: 120000, img: "img/tab5_grand2_4dan.png" }] }
  ]
,
};
const HOME_SECTIONS = [
  { id: "hero", type: "hero", title: "히어로", icon: "image", data: { storeDesc: "아름다운 마음을 대한민국 전국 어디든지 보내드립니다\n10년 경력의 노하우를 그대로", storeName: "대한민국 어디든\n3시간 당일배송" } },
  { id: "faq", type: "faq", title: "FAQ", icon: "help", data: { title: "주문 전 자주하는 질문", pickedIds: ["faq-delivery-1", "faq-delivery-2", "faq-delivery-3", "faq-delivery-4", "faq-delivery-5", "faq-order-1"] } }
];
const FAQS = [
  { id: "faq-delivery-1", cat: "delivery", q: "당일 배송이 가능한 시간은 언제까지인가요?", a: "09:00 ~ 18:30 사이에 접수된 주문에 한하여 당일배송이 가능합니다. 18:30 이후 주문은 익일 오전 중 순차적으로 배송됩니다." },
  { id: "faq-delivery-2", cat: "delivery", q: "배송 완료는 어떻게 확인하나요?", a: "배송이 완료되면 등록된 연락처로 배송 사진과 수령인 성함을 문자로 보내드립니다. 사진은 약 1주일간 보관되며, 추후 재발송도 가능합니다." },
  { id: "faq-delivery-3", cat: "delivery", q: "배송비가 추가로 발생하나요?", a: "전국 어디든 기본 배송비는 무료입니다. 다만 일부 도서·산간 지역, 차량 진입이 어려운 곳, 또는 30km 이상 장거리 지역은 추가 배송비가 발생할 수 있어요." },
  { id: "faq-delivery-4", cat: "delivery", q: "새벽·심야 배송도 가능한가요?", a: "심야·새벽 배송은 불가합니다. 주문도, 배송도 09:00~18:30 운영 시간 내에만 가능합니다. 그 외 시간에는 주문 접수가 어려우니 양해 부탁드립니다." },
  { id: "faq-delivery-5", cat: "delivery", q: "장례식장으로 보낼 때 주의할 점이 있나요?", a: "장례식장명, 호실, 고인 성함을 정확히 알려주시면 빠르게 배송됩니다. 다만 빈소가 변경되는 경우가 잦으니 주문 전 호실을 한 번 더 확인해주시고, 배송은 09:00~18:30 운영 시간 내에 진행되는 점 참고해주세요." },
  { id: "faq-order-1", cat: "order", q: "주문은 어떻게 진행되나요?", a: "① 상품 선택 → ② 주문서 작성(받는 분, 배송지, 리본문구) → ③ 작성한 내용으로 문자 발송. 발송된 문자를 확인한 후 담당자가 전화로 결제·세부사항을 안내해드립니다." },
  { id: "faq-order-2", cat: "order", q: "주문 후 변경이나 취소가 가능한가요?", a: "배송 출발 전이라면 자유롭게 변경·취소가 가능합니다. 이미 상품 제작이 시작된 경우 일부 비용이 발생할 수 있으며, 배송이 출발한 이후에는 취소가 어렵습니다." },
  { id: "faq-order-3", cat: "order", q: "단체 주문이나 정기 주문도 가능한가요?", a: "기업·관공서 단체 주문, 매월·매년 정기 주문 모두 가능합니다. 단가 협의가 필요하니 전화로 별도 문의해주세요." },
  { id: "faq-order-4", cat: "order", q: "주문 내역은 어디서 확인하나요?", a: "전화 또는 문자로 접수된 주문은 본사에서 관리됩니다. 주문번호 또는 보내신 분 성함을 알려주시면 언제든지 진행 상황을 확인해드려요." },
  { id: "faq-product-1", cat: "product", q: "사진과 실제 상품이 다를 수 있나요?", a: "꽃·식물은 시즌과 재고에 따라 색감·구성이 다소 달라질 수 있습니다. 동일한 가치와 풍성함을 유지하되 일부 꽃 종류가 대체될 수 있어요. 특정 꽃을 꼭 사용하셔야 한다면 주문 전 알려주세요." },
  { id: "faq-product-2", cat: "product", q: "화환 종류별 차이는 무엇인가요?", a: "기본형은 깔끔한 표준 구성, 고급형은 장식과 꽃 종류를 추가한 풍성한 구성, 특대/4단형은 가장 화려하고 입체감 있는 최고급 구성입니다. 가격대와 위계감을 함께 고려해 선택하시면 됩니다." },
  { id: "faq-product-3", cat: "product", q: "화분은 어느 정도 관리가 필요한가요?", a: "상품마다 다르지만 대부분은 7~10일에 한 번 물을 주고 햇빛이 잘 드는 곳에 두시면 됩니다. 상품 인수 시 함께 제공되는 관리 카드를 참고해주세요." },
  { id: "faq-payment-1", cat: "payment", q: "결제는 어떻게 진행되나요?", a: "주문 접수 후 담당자가 전화로 확인을 드리고, 계좌이체 또는 카드결제 안내를 드립니다. 결제 완료 후 배송이 시작됩니다." },
  { id: "faq-payment-2", cat: "payment", q: "세금계산서나 현금영수증 발행이 가능한가요?", a: "법인·개인사업자 모두 세금계산서 발행이 가능하며, 개인은 현금영수증으로도 발행해드립니다. 결제 시 사업자등록증 또는 휴대전화 번호를 함께 알려주세요." },
  { id: "faq-payment-3", cat: "payment", q: "환불은 어떻게 처리되나요?", a: "배송 출발 전 취소는 전액 환불됩니다. 상품 제작 후 취소는 제작 비용을 제외한 금액이, 배송 완료 후에는 상품 하자가 확인된 경우에 한해 환불 또는 재배송이 처리됩니다." }
];
const FAQ_CATEGORIES = [];
Object.assign(window, { CATEGORIES, SECTIONS, HOME_SECTIONS, FAQS, FAQ_CATEGORIES });
const SITE_INFO = { phone: "010-0000-0000", kakaoChannel: "", ogTitle: "전국꽃배달서비스", ogDescription: "대한민국 어디든 3시간 당일배송", ogImage: "https://easysite.kr/flower_example/img/cover.jpg" };
Object.assign(window, { SITE_INFO });
