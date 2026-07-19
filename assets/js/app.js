/* global React, ReactDOM, TRIP */
const {
  useState,
  useEffect,
  useMemo
} = React;

// ---- shared bits ----
const TABS = [{
  id: "home",
  label: "首頁",
  icon: "🏠"
}, {
  id: "days",
  label: "每日行程",
  icon: "📅"
}, {
  id: "extras",
  label: "備選清單",
  icon: "🗺️"
}, {
  id: "info",
  label: "實用資訊",
  icon: "ℹ️"
}, {
  id: "pack",
  label: "行李清單",
  icon: "🎒"
}];
function useHashTab(defaultTab) {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.replace("#", "");
    return TABS.find(t => t.id === h) ? h : defaultTab;
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (TABS.find(t => t.id === h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = id => {
    window.location.hash = id;
    setTab(id);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  return [tab, go];
}
function daysUntil(target) {
  const t = new Date(target + "T00:00:00+08:00");
  const now = new Date();
  return Math.ceil((t - now) / 86400000);
}

// 旅程目前狀態
function getTripPhase() {
  const start = new Date(TRIP.meta.startDate + "T00:00:00+08:00");
  const end = new Date(TRIP.meta.endDate + "T23:59:59+08:00");
  const now = new Date();
  if (now < start) {
    return {
      phase: "before",
      daysLeft: Math.ceil((start - now) / 86400000),
      todayDay: null
    };
  }
  if (now > end) {
    return {
      phase: "after",
      daysLeft: 0,
      todayDay: null
    };
  }
  const diffDays = Math.floor((now - start) / 86400000);
  return {
    phase: "during",
    daysLeft: 0,
    todayDay: diffDays + 1
  };
}

// 撒花動畫 (出發日 / 旅遊中)
function Confetti() {
  const pieces = useMemo(() => Array.from({
    length: 36
  }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: -Math.random() * 5,
    duration: 4 + Math.random() * 4,
    emoji: ["🎉", "🎊", "✨", "🌺", "💛", "🏖️"][i % 6],
    size: 14 + Math.random() * 12,
    drift: (Math.random() - 0.5) * 60
  })), []);
  return /*#__PURE__*/React.createElement("div", {
    className: "confetti",
    "aria-hidden": "true"
  }, pieces.map(p => /*#__PURE__*/React.createElement("span", {
    key: p.id,
    style: {
      left: p.left + "%",
      animationDelay: p.delay + "s",
      animationDuration: p.duration + "s",
      fontSize: p.size + "px",
      ["--drift"]: p.drift + "px"
    }
  }, p.emoji)));
}

// ---- Helpers: MapLink + BookingStatus ----
function MapLink({
  q,
  url: directUrl,
  area
}) {
  if (!q && !directUrl) return null;
  const url = directUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([q, area, "Bangkok"].filter(Boolean).join(" "))}`;
  return /*#__PURE__*/React.createElement("a", {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "map-link",
    title: "\u958B\u555F Google \u5730\u5716",
    onClick: e => e.stopPropagation()
  }, "\uD83D\uDCCD");
}
function BookingStatus({
  id
}) {
  const [s, setS] = useState(() => localStorage.getItem("tt7d-book-" + id) || "none");
  const cycle = e => {
    e.stopPropagation();
    const order = {
      none: "todo",
      todo: "booked",
      booked: "none"
    };
    const next = order[s];
    setS(next);
    localStorage.setItem("tt7d-book-" + id, next);
  };
  const label = {
    none: "+ 加入訂位",
    todo: "⏳ 待訂",
    booked: "✓ 已訂"
  }[s];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "book-pill is-" + s,
    onClick: cycle,
    title: "\u9EDE\u9078\u5207\u63DB\u72C0\u614B"
  }, label);
}

// ---- Header ----
function Header({
  tab,
  go
}) {
  const m = TRIP.meta;
  return /*#__PURE__*/React.createElement("header", {
    className: "hdr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hdr-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hdr-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "\uD83D\uDC18"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "brand-zh"
  }, m.title), /*#__PURE__*/React.createElement("div", {
    className: "brand-en"
  }, m.startDate.replace(/-/g, "."), " \u2013 ", m.endDate.replace(/-/g, "."))))), /*#__PURE__*/React.createElement("nav", {
    className: "tabs",
    role: "tablist"
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    role: "tab",
    "aria-selected": tab === t.id,
    className: "tab " + (tab === t.id ? "is-active" : ""),
    onClick: () => go(t.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ic"
  }, t.icon), /*#__PURE__*/React.createElement("span", null, t.label)))));
}

// ---- HOME ----
function Home({
  go
}) {
  const m = TRIP.meta;
  const {
    phase,
    daysLeft,
    todayDay
  } = getTripPhase();
  const showConfetti = phase === "during";
  return /*#__PURE__*/React.createElement("section", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "2026 SUMMER \xB7 7 DAYS \xB7 \uD83D\uDC18"), /*#__PURE__*/React.createElement("h1", {
    className: "hero-title",
    style: {
      textAlign: "left"
    }
  }, "\u66FC\u8C37\uFF0C", /*#__PURE__*/React.createElement("br", {
    className: "mobile-break"
  }), "\u6211\u5011\u4F86\u4E86\u3002"), /*#__PURE__*/React.createElement("p", {
    className: "hero-sub"
  }, "\u516B\u6708\u7684\u66FC\u8C37\uFF0C\u7A7A\u6C23\u88E1\u5E36\u8457\u4E00\u9EDE\u71B1\u3001\u4E00\u9EDE\u751C\u3002", /*#__PURE__*/React.createElement("br", null), "\u9019\u4E03\u5929\uFF0C\u6211\u5011\u628A\u6642\u9593\u9084\u7D66\u81EA\u5DF1\u2014\u2014", /*#__PURE__*/React.createElement("br", null), "\u597D\u597D\u5403\u4E00\u9813\u98EF\u3001\u597D\u597D\u901B\u4E00\u689D\u8857\u3001\u597D\u597D\u5728 SPA \u88E1\u653E\u7A7A\u3002", /*#__PURE__*/React.createElement("br", null), "\u884C\u7A0B\u3001\u8A02\u4F4D\u3001\u90A3\u4E9B\u503C\u5F97\u8A18\u4E0B\u4F86\u7684\u4E8B\uFF0C\u90FD\u5728\u9019\u88E1\u4E86\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => go("days")
  }, "\u770B\u6BCF\u65E5\u884C\u7A0B \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: () => go("info")
  }, "\u5BE6\u7528\u8CC7\u8A0A"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "countdown-card phase-" + phase
  }, showConfetti && /*#__PURE__*/React.createElement(Confetti, null), phase === "before" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "cd-label"
  }, "\u8DDD\u96E2\u51FA\u767C\u9084\u6709"), /*#__PURE__*/React.createElement("div", {
    className: "cd-num"
  }, daysLeft), /*#__PURE__*/React.createElement("div", {
    className: "cd-unit"
  }, "\u5929"), /*#__PURE__*/React.createElement("div", {
    className: "cd-meta"
  }, m.startDate.replace(/-/g, "/"), " (\u4E8C) \u2708 TPE \u2192 BKK")), phase === "during" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "cd-label"
  }, "\uD83C\uDF89 \u65C5\u7A0B\u9032\u884C\u4E2D \uD83C\uDF89"), /*#__PURE__*/React.createElement("div", {
    className: "cd-num cd-num-mid"
  }, "Day ", todayDay), /*#__PURE__*/React.createElement("div", {
    className: "cd-unit"
  }, TRIP.itinerary[todayDay - 1]?.title), /*#__PURE__*/React.createElement("div", {
    className: "cd-meta"
  }, "\u73A9\u5F97\u958B\u5FC3 \xB7 \u6CE8\u610F\u5B89\u5168")), phase === "after" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "cd-label"
  }, "\u65C5\u7A0B\u7D50\u675F"), /*#__PURE__*/React.createElement("div", {
    className: "cd-num cd-num-mid"
  }, "\u2764\uFE0F"), /*#__PURE__*/React.createElement("div", {
    className: "cd-unit"
  }, "\u671F\u5F85\u4E0B\u6B21\u76F8\u805A"), /*#__PURE__*/React.createElement("div", {
    className: "cd-meta"
  }, m.startDate.replace(/-/g, "/"), " \u2013 ", m.endDate.replace(/-/g, "/")))))), /*#__PURE__*/React.createElement("div", {
    className: "live-row"
  }, /*#__PURE__*/React.createElement(WidgetBoundary, null, /*#__PURE__*/React.createElement(WeatherWidget, null))), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u822A\u73ED & \u98EF\u5E97 ", /*#__PURE__*/React.createElement("span", {
    className: "h2-en"
  }, "Flight & Hotel")), /*#__PURE__*/React.createElement(FlightHotelCard, null), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u6BCF\u65E5\u91CD\u9EDE ", /*#__PURE__*/React.createElement("span", {
    className: "h2-en"
  }, "Daily Highlights")), /*#__PURE__*/React.createElement("div", {
    className: "day-grid"
  }, TRIP.itinerary.map(d => /*#__PURE__*/React.createElement("button", {
    key: d.day,
    className: "day-card " + (d.day === todayDay ? "is-today" : ""),
    onClick: () => {
      go("days");
      setTimeout(() => document.getElementById("day-" + d.day)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      }), 200);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-day"
  }, "DAY ", d.day, d.day === todayDay && /*#__PURE__*/React.createElement("span", {
    className: "today-badge"
  }, "\u4ECA\u65E5")), /*#__PURE__*/React.createElement("div", {
    className: "dc-date"
  }, d.date, " (", d.weekday, ")")), /*#__PURE__*/React.createElement("div", {
    className: "dc-title"
  }, d.title), /*#__PURE__*/React.createElement("div", {
    className: "dc-theme"
  }, d.theme)))), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u51FA\u767C\u524D To-Do"), /*#__PURE__*/React.createElement(Checklist, {
    storageKey: "predepart",
    items: ["機票訂好：CI835（去）/ CI838（回）", "亞洲酒店已訂", "機場包車已預訂", "Day 3 Chom Arun 17:15 已訂位", "確認所有人護照效期 6 個月以上", "投保旅遊平安險", "Day 5 包車安排：水門寺 → 美功鐵道市場 → 安帕瓦", "Nikko Thai Massage 提前預約（Day 2 / Day 4 / Day 7）", "換泰銖現金（或出發後到 Super Rich 換）", "辦泰國 SIM 卡 / eSIM", "下載 Grab App + Google Maps 離線地圖", "備好藥品：止瀉藥、防蚊液、退燒藥"]
  }));
}
function Stat({
  label,
  value,
  sub
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "stat-sub"
  }, sub));
}
function FamilyRoster() {
  const [names, setNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tt7d-family")) || TRIP.family;
    } catch {
      return TRIP.family;
    }
  });
  useEffect(() => {
    localStorage.setItem("tt7d-family", JSON.stringify(names));
  }, [names]);
  return /*#__PURE__*/React.createElement("div", {
    className: "roster"
  }, names.map((n, i) => /*#__PURE__*/React.createElement("input", {
    key: i,
    className: "roster-pill",
    value: n,
    onChange: e => setNames(names.map((v, j) => j === i ? e.target.value : v))
  })), /*#__PURE__*/React.createElement("button", {
    className: "roster-add",
    onClick: () => setNames([...names, "新成員"])
  }, "+ \u65B0\u589E\u6210\u54E1"));
}
function Checklist({
  storageKey,
  items
}) {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tt7d-chk-" + storageKey)) || {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem("tt7d-chk-" + storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);
  const total = items.length;
  const done = items.filter(i => checked[i]).length;
  return /*#__PURE__*/React.createElement("div", {
    className: "chklist"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chk-progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chk-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chk-fill",
    style: {
      width: done / total * 100 + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "chk-count"
  }, done, " / ", total)), items.map(it => /*#__PURE__*/React.createElement("label", {
    key: it,
    className: "chk-item " + (checked[it] ? "is-done" : "")
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked[it],
    onChange: e => setChecked({
      ...checked,
      [it]: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("span", {
    className: "chk-box"
  }), /*#__PURE__*/React.createElement("span", {
    className: "chk-txt"
  }, it))));
}

// ---- DAYS ----
function Days() {
  const {
    todayDay
  } = getTripPhase();
  const [open, setOpen] = useState(todayDay || 1);
  return /*#__PURE__*/React.createElement("section", {
    className: "page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\u6BCF\u65E5\u884C\u7A0B ", /*#__PURE__*/React.createElement("span", {
    className: "page-en"
  }, "7-Day Itinerary")), /*#__PURE__*/React.createElement("div", {
    className: "timeline"
  }, TRIP.itinerary.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.day,
    id: "day-" + d.day,
    className: "tl-day " + (open === d.day ? "is-open " : "") + (d.day === todayDay ? "is-today" : "")
  }, /*#__PURE__*/React.createElement("button", {
    className: "tl-head",
    onClick: () => setOpen(open === d.day ? 0 : d.day)
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-num"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-day-label"
  }, "DAY"), /*#__PURE__*/React.createElement("div", {
    className: "tl-day-n"
  }, d.day)), /*#__PURE__*/React.createElement("div", {
    className: "tl-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-date"
  }, d.date, " ", /*#__PURE__*/React.createElement("span", {
    className: "tl-wk"
  }, "(", d.weekday, ")"), d.day === todayDay && /*#__PURE__*/React.createElement("span", {
    className: "today-badge"
  }, "\u4ECA\u65E5")), /*#__PURE__*/React.createElement("div", {
    className: "tl-title"
  }, d.title), /*#__PURE__*/React.createElement("div", {
    className: "tl-sum"
  }, d.summary.split(" → ").slice(0, 3).join(" · "), d.summary.split(" → ").length > 3 ? " …" : "")), /*#__PURE__*/React.createElement("div", {
    className: "tl-toggle"
  }, open === d.day ? "−" : "+")), open === d.day && /*#__PURE__*/React.createElement("div", {
    className: "tl-body"
  }, d.blocks.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-time"
  }, b.time), /*#__PURE__*/React.createElement("div", {
    className: "block-ic"
  }, b.icon), /*#__PURE__*/React.createElement("div", {
    className: "block-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-title"
  }, /*#__PURE__*/React.createElement("span", null, b.title), /*#__PURE__*/React.createElement(MapLink, {
    q: b.mapurl ? null : b.nomap ? null : b.title,
    url: b.mapurl
  }), b.book && /*#__PURE__*/React.createElement(BookingStatus, {
    id: `d${d.day}-${i}`
  })), /*#__PURE__*/React.createElement("div", {
    className: "block-detail"
  }, b.detail)))), d.tips && /*#__PURE__*/React.createElement("div", {
    className: "tip"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tip-tag"
  }, "\u5C0F\u63D0\u9192"), /*#__PURE__*/React.createElement("span", {
    className: "tip-txt"
  }, d.tips)))))));
}

// ---- FOOD ----
function Extras() {
  const days = (TRIP.extras || []).filter(d => d.items && d.items.length > 0);
  const typeLabel = {
    food: "美食",
    shop: "購物",
    spa: "按摩",
    spot: "景點"
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\u5099\u9078\u6E05\u55AE ", /*#__PURE__*/React.createElement("span", {
    className: "page-en"
  }, "Explore")), /*#__PURE__*/React.createElement("p", {
    className: "page-lead"
  }, "\u81EA\u7531\u884C\u6642\u9593\u7684\u5099\u9078\u53BB\u8655\uFF0C\u4E0D\u5728\u4E3B\u884C\u7A0B\u5167\uFF0C\u53EF\u8996\u9AD4\u529B\u5B89\u6392\u3002"), days.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "extras-empty"
  }, "\u9084\u6C92\u6709\u5099\u9078\u9805\u76EE\uFF0C\u4E4B\u5F8C\u9678\u7E8C\u65B0\u589E\u3002") : days.map(group => /*#__PURE__*/React.createElement("div", {
    key: group.day,
    className: "extras-group"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "extras-day-h"
  }, "Day ", group.day, " ", /*#__PURE__*/React.createElement("span", {
    className: "extras-date"
  }, group.date, "\uFF08", group.weekday, "\uFF09"), group.area && /*#__PURE__*/React.createElement("span", {
    className: "extras-area-label"
  }, "\xB7 ", group.area)), /*#__PURE__*/React.createElement("div", {
    className: "extras-list"
  }, group.items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "extras-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "extras-card-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "extras-badge xt-" + it.type
  }, typeLabel[it.type] || it.type), /*#__PURE__*/React.createElement("span", {
    className: "extras-name"
  }, it.name), it.price && /*#__PURE__*/React.createElement("span", {
    className: "extras-price"
  }, it.price), /*#__PURE__*/React.createElement(MapLink, {
    q: it.mapurl ? null : it.name,
    url: it.mapurl,
    area: it.area
  })), it.area && /*#__PURE__*/React.createElement("div", {
    className: "extras-loc"
  }, "\uD83D\uDCCD ", it.area), /*#__PURE__*/React.createElement("div", {
    className: "extras-note"
  }, it.note)))))));
}

// ---- INFO ----
function Info() {
  const p = TRIP.practical;
  return /*#__PURE__*/React.createElement("section", {
    className: "page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\u5BE6\u7528\u8CC7\u8A0A ", /*#__PURE__*/React.createElement("span", {
    className: "page-en"
  }, "Essentials")), /*#__PURE__*/React.createElement("div", {
    className: "info-grid"
  }, /*#__PURE__*/React.createElement(InfoCard, {
    title: "\u7C3D\u8B49",
    icon: "\uD83D\uDEC2"
  }, p.visa), /*#__PURE__*/React.createElement(InfoCard, {
    title: "\u8CA8\u5E63",
    icon: "\uD83D\uDCB1"
  }, p.currency), /*#__PURE__*/React.createElement(InfoCard, {
    title: "\u5929\u6C23",
    icon: "\uD83C\uDF26\uFE0F"
  }, p.weather), /*#__PURE__*/React.createElement(InfoCard, {
    title: "\u6642\u5DEE",
    icon: "\uD83D\uDD50"
  }, p.time), /*#__PURE__*/React.createElement(InfoCard, {
    title: "\u96FB\u58D3 / \u63D2\u5EA7",
    icon: "\uD83D\uDD0C"
  }, p.plug), /*#__PURE__*/React.createElement(InfoCard, {
    title: "VAT Refund",
    icon: "\uD83E\uDDFE"
  }, p.vat)), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u4EA4\u901A\u65B9\u5F0F"), /*#__PURE__*/React.createElement("div", {
    className: "trans-list"
  }, p.transport.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.type,
    className: "trans-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "trans-type"
  }, t.type), /*#__PURE__*/React.createElement("div", {
    className: "trans-note"
  }, t.note)))), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u7DCA\u6025\u806F\u7D61"), /*#__PURE__*/React.createElement("div", {
    className: "em-grid"
  }, p.emergency.map(e => /*#__PURE__*/React.createElement("a", {
    key: e.name,
    className: "em-card",
    href: "tel:" + e.phone.replace(/[^\d+]/g, "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "em-name"
  }, e.name, /醫院|Hospital/i.test(e.name) && /*#__PURE__*/React.createElement(MapLink, {
    q: e.name
  })), /*#__PURE__*/React.createElement("div", {
    className: "em-phone"
  }, e.phone)))), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "\u5E38\u7528\u6CF0\u8A9E"), /*#__PURE__*/React.createElement("div", {
    className: "phrase-grid"
  }, p.phrases.map(ph => /*#__PURE__*/React.createElement("div", {
    key: ph.zh,
    className: "phrase"
  }, /*#__PURE__*/React.createElement("div", {
    className: "phrase-zh"
  }, ph.zh), /*#__PURE__*/React.createElement("div", {
    className: "phrase-th"
  }, ph.th), /*#__PURE__*/React.createElement("div", {
    className: "phrase-py"
  }, ph.th_zh)))));
}
function InfoCard({
  title,
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "info-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "info-ic"
  }, icon), /*#__PURE__*/React.createElement("div", {
    className: "info-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "info-body"
  }, children));
}

// ---- PACKING ----
function Pack() {
  return /*#__PURE__*/React.createElement("section", {
    className: "page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\u884C\u674E\u6E05\u55AE ", /*#__PURE__*/React.createElement("span", {
    className: "page-en"
  }, "Packing List")), TRIP.packing.map(group => /*#__PURE__*/React.createElement("div", {
    key: group.cat,
    className: "pack-group"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "pack-h"
  }, group.cat), /*#__PURE__*/React.createElement("ul", {
    className: "pack-list"
  }, group.items.map((item, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "pack-item"
  }, item))))));
}

// ---- Flight / Hotel ----
const defaultFH = {
  outFlight: "CI835",
  outTime: "8/18 (二) 13:30 出發 → 16:20 抵達 BKK",
  retFlight: "CI838",
  retTime: "8/25 (二) 02:40 出發 → 07:25 抵達 TPE",
  hotelName: "亞洲酒店 Asia Hotel Bangkok",
  hotelAddr: "296 Phaya Thai Rd, Ratchathewi, Bangkok",
  hotelPhone: "+66-2-215-0808"
};
function FlightHotelCard() {
  const [data, setData] = useState(() => {
    try {
      return {
        ...defaultFH,
        ...JSON.parse(localStorage.getItem("tt7d-flighthotel_v2") || "{}")
      };
    } catch {
      return defaultFH;
    }
  });
  useEffect(() => {
    localStorage.setItem("tt7d-flighthotel_v2", JSON.stringify(data));
  }, [data]);
  const upd = (k, v) => setData({
    ...data,
    [k]: v
  });
  const hotelQuery = [data.hotelName, data.hotelAddr, "Bangkok"].filter(Boolean).join(" ").trim();
  const mapUrl = data.hotelName || data.hotelAddr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelQuery)}` : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fh-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fh-flight"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fh-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fh-h"
  }, "\u2708\uFE0F \u53BB\u7A0B"), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u822A\u73ED\u865F (\u5982 BR 205)",
    value: data.outFlight,
    onChange: e => upd("outFlight", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u65E5\u671F / \u6642\u9593",
    value: data.outTime,
    onChange: e => upd("outTime", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fh-section",
    style: {
      marginTop: "8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fh-h"
  }, "\u2708\uFE0F \u56DE\u7A0B"), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u822A\u73ED\u865F",
    value: data.retFlight,
    onChange: e => upd("retFlight", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u65E5\u671F / \u6642\u9593",
    value: data.retTime,
    onChange: e => upd("retTime", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fh-hotel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fh-h"
  }, "\uD83C\uDFE8 \u98EF\u5E97"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "14px",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAKrBAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD1BY5I+FbePRuv51NHIM4IKn0NKM08AEcjP1qREqCplquqY5Rivt1FTK5X768eo6UCJ0qZahjIIyDmploAlWpBUSdalXrTGNlPzAUyhzljSCgCC+k8uzkI64xWDo8O++DHooJrR1qbZbKndjSaGn7t5MdeKJbDj3NasvWZB5aR5681rYrmtYk3320HhABQhdS/o0WA7/gK05H2xM3oKq6XGUskz/FzT9QcJaN2J4pIbMqJd8o9zWvcOsFpJI2NqISc/SqemxhmZyMgdPrVbxfd/YvCt/JnBMZQfU8ULcT2PAmAuNRubkj/AFsrN+tXPs5ddoHJqG2TkVv6Nai4vQGHCjNK12bpWRzVx4ehm5aMxv8A3kGPzrLn0W9tAXVfOQd06/lXrcmlqw+6DWdcaRt5QFTUNNbgrM8uS+MQ5yCOtP03xxrGh3nmafduqA/NG3zI31FdXqehw3cyJJCN7MFDDg9ao+JfAgjRrnTwSAMle4/xqXPldhqnzK52vhv4x6dehIdahNnMePNj+aM+57j9a9JtL22vrdZ7SeOeJhkPGwYfpXyDLFLayFJAVI79q09F8R6podwJtOvJYGzyFb5W+o6GtE9DNw6H1iab2ryjw58YY5xHBrdsEP3TcQDI+pX/AAr0nTtXsNWtxPYXcVxGf7jcj6jqKEyWi5uK9DTxcdmH5VETTCc0xFvcGGQc0w1U3EHIOPpSi4x979KoCweKIF33KD3qISq/Q1YsPmvF9gaGCNdqrStwanc1TmfrWU2VHcp3Ddan01AwkcjuAP5/1qnMea0tNXFpn1Y1NP4i5/CWcEdOawvE7AaUy5xlhmt+ue8WsBpoHq3FbsxWrR5/OvGc5B71AoqeRsEkVGPUflRA6JIvaEN95cnsAF/r/WugA5rn/Cw3peS/3pePzI/pXSKOa0i9DCW4BaaUqwEoKVVySnsB61n32hWGpFftNurkHIOORWwUojTMqj3qZWaKje5TuLfYoAHQVmyoa6K6i4PFY1xHgniuWLOgboaf8Tu39iT+hru/4a47QY86wh9FY/pXYHIU1vHYxqbnGeNH/fWa/wC8f5Vz8XStfxc+7UrdPRGP6isiL7oq47ij8Jo6b/x9kf7B/nVjUdKtNTgMNzCrg+o5FUtPf/iYEf7BP61tZq7J7kttM4w2WteGGLae5vdPHW2kOWQf7J7VtaT4isdXBSJjFcL963l4cf4/hWwygjpWDq/hmy1L96AYbleUlj4INTZx2HdM2W6Gsd+M1mwajrWizLb6nA19ascLdRD5x/vDv/OtOYdT2NTOSdi6asQbq73wkf8AiSD/AK6NXn7Gu98JHGij/ro1KwT2KfjU/wCj2g9Zv6VzKjNdD41f91aD/pt/SueU8CrhuSvhK+iSKZ79Nw3ednGfrWwK5q40Dz5GvbOZ7e8VjiRD174PqKdZ+IpbSYWmtxeRL0WdR+7f6/3TQnbRia6o6YVDdDNs/wBKkVg4BUgg9CDTbjm3cf7JqmJbmMetaOhSFdatQTxv7/Ss5qu6McaxaenmCsjd7HS+MVzoE/0zXJxjdYR/7gP6V1vixT/YNzt7J0rkrbnT4sf3BWsDBGto7b9Lh9sj8iaTUdIttSi2TIN3Zh1FReH33acy/wByVl/r/WtUdamyasx3aehzSahfeH2EWoh7mx/huAMun+96j9frTZXSWV5I2DRsxKsO4NdQyK64ZQR6EVy8qCORkA4UkCpaa3NI2NTw02Ndg9ww/Q0vildvia0b+9EwqHQCF121J7sR+hq54yXbq2nSf7RWhCl8RzrLew6q1xZKjyRpkxt/GM4Ire03VbfU4z5eUmTiSF+GU/4e9UrciPW4/wDbRl/r/SptT0RLqRbu2c294nKSpx+B9R7VSbWqCSRpsu5GHqMVzRXBIq9Ya063C2OqRi3u84Vv4Jfoex9qq3C7LiRfRjSk09gp6XR0WgjzfDupQ+5/Vf8A61eevGRaWz/3Tj8jXoPhM7o7+E/xIrfzriXi/wBEnXH+qmcfrWU9jSHxNGhLaiWJSRkFQa5++0pk3MgOPauq0yaG8s0g+7cRLhkbg47H3GKWW1BJBGazcSk+h5n5xBwQV+tdf4d1UwLC8zuYlynynkD09x7VFc6HHIzDb3NVpbR9J09iyERFuGPTPpUp20Zc46XRp+KfDFvqNkby1weNyutYulza/wCDZ7KfBltbhcgx8gf7JFWtG19rYFVbzbd+HQnj8PSuo0t01ZbWFkXy4N2Oc59CfTvTimnoZNprU7jw/rUupaclzLE8W85CMMYH+FbYmPXgisO1XYiqowB3rQifb3rpS0Oa+pfEmRkimS4ZPeo1cEZpxORQ0AKBspIxjI60R9CKAcPigBoAEppJEDPtYZBFPIw9JJwyn3pDRReN7eQFT+PrWD4l0CHVbRrmCMech3sg/pVz+3I4NbudNvDiPcDG/wDdyK0WV7eQMh46gjoRUyjfRlxlyvQ8S8Wzz6P4lj1KwTbA6KXKcZbuT716L4T8VR6vbpIjAXCjDpnG8f41a8R+G7fWrKWSFBvI+ePHf1FeZXtkfCdjYalatIjmQxyL6kZ59ulTGTjoy5RUveR75bzpcRB0PHcHsfSpa4fwv4qi1W1SWJk84f6xAfvCu1hmSeMOhyD+lamI+iiigApKWigBKKKKBCYopaMUAJRRRTATFFLRQAlFFFACUUppKACiiigBKKWkoEJikp1JTQxKQ0tJTAxAKeooxTgKwAcKlU1GKlUUAPCgnOMH1FSKZB6MPyNMWpVpgSxuCfT2NPY4HpUYAI5Gaaw2k4Jx6UDG4kU5B3D0br+dKJR0bKn0NKDigkEHPI96BXMDXHL3SIDworX0qPyrGPPBPNYcoE1823puwK6aJQsSqOwpPcpaIkJxk1yMzGe/c9dz8V093J5drI3+zWDZQiW7jOO+aYlqzoYU8uFE9BWbrLnbHGPXNaorntVmL6gVB4UYoQGnpSFLXJ6sa5P4pXhi0KC2BwZpcn6Cu1tE2W0Y/wBnmvKvileebrdtaA5EUe4j3NLZD3kjjLZeldd4ZgyJZSOuFFctAuFruvD8Pl6ahI5Yk0U9zabsjUVBiporVbiRUYZycUKtaOlxb7yPjoc1rLYxRna14SS2KXsEgMcTBmR+o+hrFmXKV3Pieby9L2Z5dgPwrh5T8pFcVVK510G+U4TxT4aivEeaBAJOpUcbv/r15lc20lpKVIO0H8q90u13Ka4XxJo6zq00afOPvADqPWohPlZpOCkcTA52BucHoa1dO1a706dZ7S5khlB4ZGINSNos0VpEVXI25xVCSBo+oKn3ra6exg1bc9S0H4tXEe2LWbf7QvA86Hhh9V6H8MV6NpfiDTNbi8ywvI5uMlAcMv1B5r5lDMh5qxbXsttMssErxyLyGQ4I/GqTIcT6hLVGxrx7QvihqNnsh1NReQD+PpIB9eh/H869F0jxVpGuRg2d0vmHrC/yuPw7/hVp3IaNdmIOVPNWrDURbT7pgSpGMjtVFjUbVVhHWi7huE3RSBh7Gqsr9a5tHaNtykg+oq5HfSEYk+b371lOD6FJlqRvmrZsRts4x7Zrn9++umiXbEi+igUqSs9Rzeg+uV8ZPi3iT1Oa6quM8YvmWFPbNavYiK95HHydTUfPOOuKfJ9400ClA2kVoodf0mKK807ZcQMpMtswxn5jyD61uaN4v07UZRbzlrK86GC44JPseh/nWjpwAsoR6rUOp+G9N1mIrcwDf2kXhh+NVZpaGTs2bo7U7HtXDC18TeFctZyHVNPH/LCU5dR7Hr/Ot3RfF+l6w3k7za3YODbz/K2fbsfwoUkyWjaK0sSfv1qQipLZM3C8etEtgW4y5Tg1j3KA5reul68VkXC1yo6EL4ejzqhPpGf6V1Dr8tYPh2P/AEyY+if1ro3HFdENjCpueb+KeddUekI/mazoxgCtTxMudek9o1H86zVXitYv3ikvcDTZCdddPS3z+v8A9et8HiuPt9UtNO8SSG8mEKyJ5aswOM8Hk9q61WDoGRgykZBByKuL3M5E2c0h5pmaWqEMkUbTx2rMmJU8GtOT7h+lZc/SsKm5rTKrkHqMf7tdx4V+XRU5yC7EfnXDNXb+GMrocRHIy386a1CexmeNW+WzHrMKxUrT8ZSAmywek4yKy46uK1JXwk9m24Sj0fH6Clu7GC9hMc8aup65FQaY257v2mx+grQFO1yW9TlhZ6n4eYtp7G6sQctayHkf7p7Vr2Gs2mrW8ixOVmVTvhcYdfw/rWiy5FZd5olnPcLdlCk0fzB4ztP6VNmitHuQnpVzSjt1ezP/AE2X+dVSMGp9PONStT6TJ/OoRq9jsvEq7tDuh/0zP8q4yx5sIf8ArmK7bXxu0i5H/TM1xGmnOnw/7grSJjHqVNP1d9FllS+t2WynlZkuF5CHp83tx1FdbDLHPGssTq8bDKspyCKz7CKK5sJIJUDqJGUqf8+9ZL6Xf6FK1xo7eZbk5e0ckg/T0P0qL2KaudZXNXg23ko/2zWlpWuWuqqVTMVwn34ZOGX39x7iqOprtv5PfB/Sm3ccNxdJbZq9mf8Apqo/M4rW8bjbLp8g7TCsK2bZeQP6SKf1roPHK4s7WT+7MppIcviMGdvL1WzkH/PQL+fH9a6KuZ1ZjDbw3AVm8uVWwoyTiugsr+11K2E9rIHQ9fVT6EdjRBk1ER3unW2oQGK5iDqfzFYzxJCxhy/yHbuY7iQOOa6XvWBqCbb6T3wf0okluh02avhQ7dSmUMCrQnBHsRWIbYGfWo8cJKSPxrS8NNs12If3lYfoT/SoZtsev63F/eVWAqJaopO0yvHpn9q2NvNDmK4RQFlXggjjmrumyqZvsGqp5F5/A3RZfofX2q94SZX0pgQNySsv8j/Wr+rWVrf2xjuEyByrd1PtUJBzanNXtt5N+8eOM5FW7vTI9R8M39syAkxZH1waouk0UojmnacqAA7dSO2fWt/RmEpng7vCcf5/Gi12XKTUTxPSbK5aSOCCMsWGPYGvUvC+gGwYXFxIzykYwDhR+Heud8N26prbRFfuzOn869Ihj2ADFOEXzETkrWLsZ4FTqTVdOlTqcV0GBOjEGp1YHoaqZ5qRWwQaTQFlOpoP36TPNBOTmpAV+oNJJ9wH0pWGVFB5T8KAPLPiLb3en6/DqtqrPHJEBNEO+MjI98YrV8J+LoLu2S2uZQ8LcRyH+H2Na/i2OOaGzjkx+8LIpP8AexkD8QDXluo6bc6NeG8s1JUnMsI/i9x71DbTNbKS03PaWR7aQMhyD0PUEVgeJPDUGs2ErRJndlniz39QKzvCfi+K5gitLpiYXAEcjdVPoa7FlaBwyHKnoexFEldExk4s8OsNK1Lw011f28p8q0cF4+nynvXqfhnxJFqkKzwMC5H7xM4z7in69oKahZXbW6rtuI9s8WOeO4rySxtNa8Na64so3lt1BkKKfmwOuB3pRly6SNJR5lzRPoiOVZow6HINPrnvCWppq+n/AGtFYbgM8fKfpXQ1oYhRRRQAUmKWigBKKKKBBSUtFACUUUUwCkpaKAEoNFFACUUtJQAUUUUAJRS0lAhKSnUmKoZiinqKaKkWsAHAVIBTVFSCgB6ipFHSq01zHbruc/hTLXVLW4kEavhz0B71VmK6vY0B0pj9af2qM9aQwqG5kEVtI+cYWpqzdal2WRUHljimgZl6Z5sl4m7EgznI4NdSrqeBwfQ1z+gx/vHfHQYrfIDDBFSUypq0m222A/eNVtJTMrN6Cmao2ZkTJIAzg9qu6VHtty3qaGEdrl88Ak9q5bm51Insz10l0+y1kb/ZNYelwbrwN1xzTBLU6BRhcCvBfFt59v8AF19JnKq+xfw4r3O+nW1sZ52OBHGW/IV86+Ybi9lmbku5b86l7FU1eRfgTO0Y5JxXoljEIbWJB2UVw2mQ+dfQR46uCa9BjXCirpLqVVJFHNbeiR5lZ/QVjoOa6HR49tszepq5mZkeLZ8ywQ+gLYrk5TxWx4in83WJRnITC1hyNmuCo7yOykrQRVl54qgbTz7uKMDO9wPzNXpOtW9Dg8/XLRSMgPuP0HNQ1oap2Ov1DwrpOoQCN7ZY2VQA8Q2n/wCvXAa78NZ0DPahbhPbh/y716yTxUR6V0cnY4lUfU+aL/w1cWzsAjAjqrD+lYc1o8TEMhUj2r6i1DSrLUY9t1bpJ6NjkfjXD618PUkVns2Eg/uPwfz70tUWpJnh/wAynp+NSRzsjhlYhgcgg9DXVap4SntJGVomjYfwsMVzlzp80DYdCMdwKEx2Op0X4i6tpuI7lvt0HpKfnA9m/wAc16FpHjTR9Z2pHP5FwR/qZvlJPoD0NeElHU+tO3lT6EVam0Q4XPpMNmpUNeE6L451fR9sYm+0W4/5ZTHPHseor0nQviDo+qhEnk+x3B42yn5SfZun51opJkOLR2qGtW31SSMBZRvX171kxsGAIIIPII71MDmgR0cVzFcD92/PoetcR4sk36njsq1rDIOQSD6iqOo6et+3mFysuPvHmlJ6DhZSuzkW5amSHZEzegJq7dadc2pJdMp2ZeRWfcnEDf7RC/maIG0tTqNPGLOAf7A/lWlF0rOtvlhjB7KP5Vfiatehz9SyAMYrI1jwtpmtAm4gCzHpMnDD8e9bK9KkArNpDTscP5fijwvkxE6zpy/wOf3qD2Pf9fwrp/DPiPT9emK2zPHcIpMkEq7XTt+P4Vp7Qe1Tadp9qt3JdrAizldpkAwSM9/yFRK6RSaY65XrWPcJya37iPryayLlOTWD3NYk3h6P95cN/uj+dbpGRWXoKYjnP+0BWuRxXTT2Mam55z4jGddnPso/Ss0LxWp4gGdYnP8Atf0FZwHFVH4i18KGppNrqFvPHcRLIrEdR7VjNpGs+HHMmjzme0HJtJjkY9vSus0pQwn9mA/SrrRZ7VdkzNvozm9K8UWWouLeYNaXneCbjP8Aunoa3KzdW8O2WqoRNEN/Z1GGH41hB9e8NfK27VNPUdOkqD2PenzNaMVr7HWyf6s/SsuXoak03W7DWYGNpMGdR88TcOp9waWVMZqKjV0XTRQau48M8aFD9W/ma4mQcmu38Of8gOD6t/6EaIjqbGB41VTJYMRyJxzWdHzWl405ay/67is2PitY7mcdivorkz36ntPWyK5abRbvzXv9OumhutzZVjlHGc4Iqax8TKs62erRfY7rO1WP+rk+h7fQ0k+jBp7nR0yUfun+hpwPA96R+Y2HsabEtzIbrmpLQ4vYD6SKf1FNbpRCcXMJ/wBsfzrI3ex3mtDOmTj/AGDXCaTzpsPsCP1Nd7qo3adN7of5VwGjc2Cj0Zh+pq0Yx6mjo0mZ72P+7ID+Y/8ArVrViaQ2NU1Be+UP6f8A16280lsOW5l6noFvfkTxs0F2nKTR8EGs5xdq3l30qSToNpkRcbh2JHrXUCsLVV23pPqopNWKi9SiMq4PoRXU+Nl3aEH9GU1ypJHSuu8UgTeF3Yf881P6CkgnujEkx9ntpD081SajvtBliuTf6PILa66sn8Eg9CKjnc/2FEw6hQa6KJhJEjjowBFJIcnYyNM12O8k+y3UZtb9fvQt0b3U96j1ZcXat6rV7U9GtdVi2zIRIOUkXhlPqDWPLDfW6rBfTrcFM+XJjDFf9r1PHWm30YQWuhZ0R/L1u0b1k2/nxS60Ps/i+4PQTW2PyqtZv5eoWz/3ZVP61f8AF6+X4js5MffjYUug38SIPC+pQW95dWMkoRpCGiDcbm7gH1wRW9dT5OAa5aysre/t7u2nUbg4dGHBBI9fwFCahc6TKINRYy254S5x0Ho3+NJEyWpdvhi4VvUVe0KbGrRLn7ysv6Z/pVG8ZXjjkUhlPRgeCKXSZQms2h9ZAv58UnuWvhMa0X7L4xuozxtuQR+NehqMYrg9YT7N41uSOA2167yM7kVh3FWtzKWyJ1zgVItMHQU8dK0IHL1FSZqIHpT80CLYPyg+1LnIpkZzGv5UqnkiosMkPK0q/dpuQOtOUjB5oAw/E1ib7QpVQ4liYPG391h0P61zAtk1a0hmniKBky4xgk9x9OOvvXc3cYltbiIjIK5xXFvcTWuupHM/+jXKBYx/dcdvxH8qqKVtSru2hxWrwXOn3Ze3i4UZEQ4yB1A98cj6V2fhDxfBeWyWt1JuiPCueqH0NO1vTvtVo0kQAni+dT6kdq4O/sJbKYappqkpIN0kXTeP8Rz+VZtcj12LaU1dbntRDW8gZTlfXsaz7rSYpb+DULaNTglZY+mAe9c74R8XQXlsltdSZiPyq7dUPoa7i2g8qTJbcGGM+oosmSm0Xo40hjCRqqovACjAFOo7UUxXEopaSmIKKKKACkpaKAEooooEFJS0lABRRRTAKSlooASkNLRQAlFLSUAFFFFACUYpaSi4jHUVKoqNalUVkMcOtSDGMmmqKp6xerYaZNMeoGF+tNITdjM1K73JI5+6Dge4rl5rxvOi2ZD+YNpB71Y1O9MemxITltuW/GsnQc6jrtpEDkGUMR9Oa6PhgRFOUz15CTCpPXHNNpzcDFNFc5q9wrB12TdNHGO3Nbx6Vy+oSedqT85A4FAtzX0eLZabj1Y1pZ4qC1j8u3RemBUkzBIXY9gTSQ5HP3d5HJqEis20g4G7jNdHaJ5drGPbNcnbr9ougGAO5u9dasYVRsyuOw6UPcfQr6q+202/3jiodIj4d/wFRao5MiRtjjnir2nJttQe5OabBGN47u/sfhC+YHDSL5Y/HivD7NeRXp3xbvTHpdlaKeZZCxH0FebWa/LUTZpSWjZ03huHfqG/HCLXZqMCuc8Kw4hllx1OK6dRW1L4RVPiHpXS2g8nT1J7LmudhTc6j1OK3NUl+y6RKQcEJgUpsjocHezeddTSk/ecmqDtUjNwc1Wc1wve53pWVhhOTW54Si36y744jiP5nisLqa6DwneWdo073FzDE80gjjDuFLYGcDP1qt2iZu0WdmxqMtinF8jIORUTNXScQMaifmlJphNKwFW5tYbmMpNGrqezDNclqvgy1nDNbfIf7rciuzYjmoHANJwTKU2tjxrVPB0ttLloiuDnI5B/Gucl0G7d2YKeSTX0LFbpPdRRuoZS4yCO1a93pmnrHgWdv0/55isZxa2NoVI9T5Wl0W8TP7kn6VTkgngPzIy/UV9JXOlafIxBtIfwUVj3nhbS7gEGDb9DUc7W5paLPM/CHizUdOkMUdwxiHWJ/mX8u34V6ppXi+zvAq3H7iQ9+qn8e1cFr/g1bC6hfTpF3upJVhjP41j+fdWL+XcxPG3uODW0ZNoxnDU94SRJFDIwZT0IOQaca8Xs/FV5pw321wygcleqn8OldJo/xW0+ZxDqsZgfOPNiBZPxHUfrWiZnY9AcZBBHWsbUtGt7tflzE24NlfUVp219a39uJ7S4jniYZDxtuFJJ6VSAqAbT6VZhPIqu/WiORkPWrvoTY1YzwKnSqUEqsAM4NXYzUsCULWhYL8jn3qkozWhZDELfWpkNDbheDWRcr1ranHBrIuR1rllubwLeigrbyHBwX/pWlwRVPSBi0J/2jV1lGM9D6iuqHwown8R53rmDqs/P8ZqiBVzVcnUJSTnLH+ZqqBilF+8bfZRoaIuUuT38wfyFaRjqj4fGYZj6uT+pH9K1yoq1IxnuUXjqu8eeorTZOKrvH7VdyTnZ/D9jJfR3whCXEbZDpxn6+tWLhcZrUZKo3KYJ4rGpZPQ2pvQyZV5Ndp4d/wCQHB/wL/0I1x8orsvD4/4kdv8A8C/9CNVBiqLQ5/xn1sv+u4rMQVp+M+Gsv+u4rNStovUiK90ktDnzhno/9BSXum2uoQGK5iV1PqOaZYNuluxnpL/7KKvU7JoTbTOVFpq/h3myc3tgOTBIfmUf7J/p0rY0zW7PVEIhcrKvDwyDa6/UVpHmsq+0Kyu5kuShjnjO4SRna35ips0F0xG6UiHEiH3FDY980mOhHOOazRt0PRL8brGQf7J/lXnujf8AHu49JGFeiXI3Wbf7ted6RwJ19Jmq0ZR3Ibmz1NNQnvtMnAkQjdCwysgwOD+VaGk+JLe+m+y3KG0vhwYZD94/7J7/AM6tWbZup1z1Cn+dR6podnq0WJ0xIOVkX7wNTqtRys3qbKmsfWVxcRt6rj9ayYtR1Xw4wi1FXvbAdLhRmRB7juP1+tad7d29/awXNrKssRzhlP8AnFNu6HHRmce9dfrIE/g3d0JtVP8A47XIkV2OPP8AB6r1zb4/LIoQVDkt/meH4xnnyh/Kug0mTzdItH9YlH6VzFu2/QYx3CEfqaltjqmg28U8G69051DNEfvxZ67T/SpTswaujrh0rJ1pPmif2Iq3puqWmqW4ntJQ6/xL0ZD6EdjUWsLm2VvRhVPYUdzDU7ZFPoQa1/HAxdaZcdixH5isdq2fGI8zQNOuBzgoc/UVPQuW6MrSn2ajKufvJ/I1qzRpMhSRQynqDWDBKItUt2JADHaST69P510GaFsTLcx1097F2WKc/ZGOREwzsPsewp8RMF3bzDkLKrZHsc1duRmE+1ZcuQMg4PqKl6GkdUWPF6eX4qicdJIB+hrr7F99lA3qgrlvGYElzpNyBy8ZB/IGuh0V/M0mA9cDH5VotzGWxqKeKeORUa/d54p4Bz6CrIFzgepqQDJ5/KmgdqcOgNAixF8yEdMU/o3FRw9WqRuCKkaDHGe9OUYY+9J2paQDW/1hUjhhzXH6zYm7s5IlO2aM7om9GHQ12DH5kPvWFeALeTKOzfz5/rVwV9AvYztNvBqFhHMQA5G2RP7rDgisd7NYtQmsHOI5wZYMjof4l/rVqL/iWa80XS3vvmB7LKP8R/KrN/Al3LDhyj27iQyD+Een402uZajT5Xoef6ppUmmXkuoW8ggiT/W5+6x/xr1nwrJMdEQTzGV1PUjoPSuH8SpFqegt5GPIeIlMD9fr1rqPA1wZ9Dt2Y5LwqT9cD/69ZKNrpDm7tM7NWBHB6U6qW7bKrIcSMMlT0f8A+vVtHWRNy/l6UCHUlLRQAlFLSUwCiiigApKWigBKKKKBCUUtJQAUUUUwCkpaMUAJQaKKAEooxRQAUUUUAZAGKUSx7gu9c+ma5VPEU1wPLdVQAZLCuZ1DxbCl3tjdwoON2Mg1HL1Ytb2PVx0rjPGV95t9Z6ah+84Z8elZNl46WGLeJlfDAbM9ayrPUG1rxHc3r52xqce2aaQNa+hJ4hvBhwDjtWh8M7Y3GpzXJGREnB9zXL65KXkbr1716N8M7H7NoD3DD5pnPPsKKkruxVNWTZ2bHmkFBPzUZqRDZn8uF39BmuWtV8++XvubNburS+XYPg4LcVl6LFm53n+EUPYcd7nRIMLVPVpfLsHwcFuKuisXXZOIos+5oQmV9Gj33ik9F5rph0rF0OPiST8K2JGCRsx7DNJDl2MS5mWe+fawO07cA9K3YV2QqvoK5W3hW5v1Zl+YvncODXU/vFGQwYDs3X86b3H0PIPipdPN4kht8HZDEMHHGSa5e1GFFeg6w632o3DSorKWI2sM1iS6HbPzDmI+g5FRJXZtTdlY3vD8Bh0qLIwW+b8611FQWE9uLaKHdtKKFw3FXvLU8jvWsZaWM5bk1hHvuox75p/i2fy9OWMHl2qfSoiJyx5AFYfjC43XUUIPCjJqKj0bCCvNI5p24NV2PNSO3FQMea5Edwo61uW/hGx1vw+ou1ZXeRnR16jt36jisEGvSNLQRaXbR+kYrSKuzGq7ROBOi+LvC5B0i8+3Wg/5YSfMAPoeR+Bq3p/xGtWkNvrNnNp844LYLJn+Y/EV3TjmsrU9HsNUiKXltHL6MRyPx61pZowunuT217b3sImtp45om5DxsGB/Knlq4W68CXGn3Bu9A1CW2k67N2Afb0P4ioY/FuuaKRDr+mmVAcfaIRtP5dD+GKpS7icex3hIpjEVlab4i0vV+LO7RpO8TfK4/wCAnmtDdmrRLLumrm/Q+gJ/StC+k+U1R0kj7S59Fqe9bORWFR6mkVsZD8uaryVYcfMarv1rA6EiKTSH1DM3llkT5cjt/nNZF/oAMbI0YdD1Vhmu/wBDTGnhsfeYn/P5Vdnsbe5H7xOfUcGt4wurmEp+8fOviDwskePs5eEuwXb1Bya5HWfD9zpUp+XfHX0J4q8MusUdzDh445FZgeCADXG6pZR3MBR03Aipk3FmtNRkmeS6XruoaRcedY3csD552twfqOhr0jQvit5gSHWbfnobiEfzX/CuB17RGs52eIHBP51kQFyrEA/KcGrjO6IlCx9I2OqWGqwedZXUc6d9p5H1HUVZHWvnO0v7iymWa3nkikXkMjYNd3ovxMuYcR6rCLhO8seFf8R0P6VoprqZ8rR6xGeRV2CRlPqK5/R9e03WE3WV2kjYy0fR1+oNbsR4psVjRilVuvBrWtB/o/1NYK1ct7qSAYByvoalisaU3Q1k3Q5NXzdpKuDlWPrVG4rmnubwNHTF/wBCHuSauN0qtp4xZR/SrD8IT7V1Q+FGEt2ecakc3rn3qsBxVm/5vH/z2qDFRDc6GvdRSj1y98PpFJNpkk2nSZ3zRHLRnc3UeldRpmsWGsQ+dYXKTKPvAHDL7EdRUtjGradErDIIOQfqawNT8GWs0/2zTJX0+9U7lkhOAT7iqTa2MXZs6k1Ey1yEfiXWNAcQeIrMzQZwL23Xt/tD/D8q6ix1Ky1S3E9lcxzRnuhzj6jtVJpktNbjtmWFUryPBNaca5kX61Wvk61lUeprSOdmXBrsNBGNDt/o3/oRrk7gYJrr9CH/ABJLcex/9CNXTFU2Oc8ajmx/67isuMVq+Nf+XL/ruKykraO5nH4SvpL7rrUB6TD+WP6VrVyDyatpd/dXlrClxau/7yLo3HOQfxrb0vXrLVRtgcpMPvwSDDr+Hf8ACqi1sKSNSmvypHtS5oNNiW5kNwKZkjkU9+pph6Vijd7HpMjbrP6p0/CvO9M4lvB/03b+legjD6bGTzmMH9K89sAUur9Tzic1fYxW7LtjJ/xNpU/6ZhvyP/1611Nc7bOV8RKOzwt/PP8ASt9TQhvcfIiupVgCCMEGsC40y10+VntohGZuXx0JFdADWfqi/LGfc0pLQcHqZJ6V2WmfvfCyj/Zcfqa45hXYeHzv8PlfRmH9aUSqmxxNj/yDXT+67L+tdNozCTSID6Db+Rrm7QYS6T+7Mwra8NSFtPkQn7kxH4YH/wBegT2ItR8PE3Bv9LmNnejuv3X9mHeof7ae4iaw1K3a2v1wVwMpKB3U/wBK6Wqepxg2bMB8ykEH0oa7CT1OdatrXP33gOCT+4q/ocVjs+fvAEe3BrdmUXHgGZVydqv19jmki5nKCGK8nt4phlJFI/HFWUurvR28u73XFn/DMBl0Hv6j9aowy7UtZc/dYZNdO6K6lWAIPUGkkKbGCSO5tt8Tq6OMqynOazJfummvp1xYTGbTWXYxzJbuflb3HoafJ0ND8yoFzxUvm+GtHuepRlUn8Mf0rY8NSF9Mx/dY1lakPtHgBe5hm/L5v/r1b8IS77SRc+hqo7mUtjp0GM09cVGp5p6mtDMfSr0pKF6mgCeI/PUzdKrx8OKnY/KaljQ71pBQDkD6UgPX60gBvu/Q1y+q3DWnigQyYEN3CGjPT514I/EY/KuoIyH+lc74tsGvbW0aI7bhHBifH3SOefaqW41bqZ2q2y38K2wbbKGWRXH8GD1qxZTQXNuWgcOm9lLerA4Ofyp1sYmRmidXyx3MDnJHB/L0rMgxpevvAci3vvnjA6LIByPxH8q1diVf7ilPbfZbi508r+6kzNDz6/eX+v51c+HdwVsBA33oZniP5nH6EVNr9sXs1uIlzNbt5i+/qPxGay/Bs4j1TUI0ztd0nT6MP8VrFqzsVLWNzqPF+qvocFlfYJhE3lS+gBHB9un61r6XqsOowJcW8gYsPX73t7GqfizTF1nw5eWRBO8Bhjr1ryTRNR1jwhfSxXEckljGwV3xwuTxn06VDkk7Fcrauj31HDrkfl6U6sTR9Yt9VtkubaRWLDnnr7H3rZRw65X8R6UyR1FFFMBKKWkNABRRRQAUlLRQAlFFFAgxSUtJQAUUUUwCkpaMUAJRiiigBKKWkoA+aU16+uYjBJIFVvvMowTWcZDvIJPpmq6zMF4AzTRLkncwJ7isLs2skWnkaKMlexzXYeElMeiTXf8Az1f9BXFK+flHIPrXocEY0/QLeEAD5ASPc1dNakT0XqYGpsZbjp1Oa73wL4ug8u20WQANyqNjHPXHvXnN7N++kk/hA/KqHhzUhYaxFeHLCKUMQDzQwj2PpXNFZ+ka1Ya1aieynDj+JTwyn3FaFJEtWMbXZc+VFnryal0WPEDP3JrP1V/M1EjsoxW3YR+XZxjuRk02NbFyuZ1aTzNQIHRRiukY7VJPQVyrt5927dSWo6Erc39Kj8uyQn+LmpNSk8qykOeSMVNAnlwovoKztckxHHH6nNJA9yDRY911uP8ACtbd3KIbSWU9FUms/Q48RO57nFZ/jvXIdA8LzXcwZlZlQKvU5PamtRyOTZi8jN1JJNOFYml+J9J1Uhbe8USH/lnL8rfkev4VtKc1NzckFWYLmWH7jkD0PIqqKlU8UBa50ela0iMUnQgtxuXmue8RO8upySlW8vgK2ODUtv8ANMgHrWyyhlKkAg9iKiWqsEfdlc4ZmqEnmuuutDtbnJQGFvVen5ViXWgXsBLRqJkHdOv5VlytG6mmZ8YLyIg6uwX869PQBEVQMADArzSxid9asoSCD5m4g8dK9IB4rSG5jWeiFdqhY05qjNamIxjUE0UcqFHRWU9QwyDUzVG3Shq4LQ5XVPBOl3reZChtphyGi6D/AA/DFZW3xX4eGEkXU7VT92TlgPY9f513Tc5qNgDSUexXN3Dwhq39r2s1w1rLbOpCNHJ2OM8eorVuTnNN01FjtSVGCxJPvSyjOa55t31NEkZ0nWqz/eq7KuM1UYZaszVHU6YuzT4V/wBnNXhVe2XZBGvooFWBXbFWRxy1Zi+KJhHo8vq3FecSfNwa7jxlLizjjzyW/wA/yrhjnNZz3Oihsc/rdgssLccGuXt/DMs1jLMqso80gNjg4A/xrv7yMPCQR2rb8OWSDw/GjKCC7E59c/8A6qySd9DSclbU8Pu9LuLckPHx6iqOxlPBr3DU/DsEu4om3PbtXGar4SwWZU2+4FXdrcjR7HE21zLbyrLHI8TocqynBB9q7vQfidqFjsi1FBdwDjfnEgH17/jXI3mj3FsTuTcvqKzWjZDxn6GmmS4n0hofivR9dUfY7tRMesEnyuPwPX8K6FR2r5RiuXicEEqwOQQcHNd1oHxQ1jSQsV2wv7cfwyn51+jf45p3IcGe7YprLkVzug+O9C1/ZHDdCC5I/wBRP8rE+gPQ/h+VdIR3osmTqjQsryIQpEx2soxz0NW5mxA7DkbSa596FuZYkZFc7GGCDVqXQTRzN2c3cn1xUZFXLqxl81pE+cE5x3qm3y5yMYqIbnQ3dHR6eAbCL6VMRVfSznTLf/cFWWrSOxzvciliSaMpIoZWGCGGRXKah4MRLhr7RLqTTrz/AKZn5G+orr6aelHKmCdjmdD1nWE1WPTta0/Dsflu4P8AVtgZ5Hat6/wc4IP0qzbr++GfQ1Wv1ALGsaj1Nqdnsc/dcZrr9DH/ABJLc+x/9CNcfdEgmux0E/8AEjtvof8A0I1dIVXY5vxqOLH/AK7islRxWx42+5Zn/puKx16V0R3Mo/COtMMZhjo/9BVDVPDlpqB85cw3C8rLHwQat6c+64u0/uuv8hV/HanZNA3ZnKJquraEwj1WJru1HS5jHzj/AHh3rorK/tdRgE1rOkqHup6ex9KneNZFKsoIPBBFYFz4ZVLn7Vps72Vxnkx/db6joaS5kLRluX77fU1FTzux85BbuQMZNMPNZp6m9tD0W1O7Src+sKn9BXAQDbq2pp6Sg13mnNu0a1P/AExX+VcKBt1/Uh6sp/nWi6GC3ZTuNLbUr1/KuZbeeJA8To2MHNLDr95pMottehKpnC3ka/If94dvr0q7aNs1hR/eQj+ta81vDcxGOaNXQ9QwpNO90U7bD4J4541kidXRhkMpyDUOpDNuD6NXPyaDe6NK1xoU2I85a0kOUb6eh+lWIPEEOoxPazRPa3wwWgk746lT3FJu6BKzENdb4Xbdo8y9xKf5CuSaup8JMDZXS+jg/pSiXU2OWjGy+1KP+7Pn86foOrWlpf3FncSiJ5WBjLDCse4z0z04omGzX9TT1KtUunabaapZ3ltdwq483OSORkdvypsnodODmortd1nMPVDXNA6t4abB8zUdM/OWIe394exrestQtNXszLaTLIjDBHdT6EdjRe5OqZzr10OlfvvC19F1ILjH1UVz7DBwRW/4ZO+x1CM+x/Q0oms/hOJjHm6YoAwR2rqYJPOt45P7yg/mK5VFKWdwo6o7j8qvQ6hc6Rsjv182zP8Aq7hByg9GA/nQnZky1N888VmzDBYVfjlSaNXidXRhkMpyCKp3IxIwpS2CmX4F8/wVqcXUoWb9Aag8Fy/My5+9GD+VWvD/AO+sNUtT/EgYD8CP8KyfB0nl3iIT2ZaqPQmS3O/H3qeBimDrTx1rQyHg0DgmkpR97HqKAHq2GBqyelVR1qyOVH0pMECdKO5pE6/jSk/NSGO71S1BS9kP9lquZ6VDcgNbTr6cimtwOHsv+JXrs1ieILvM0PoH/iH9at61ZPeWDeUdtxERJEw7MOaZrlpJcWQmg4ubdvNjI9R1H4irlhdx39jFcx/dkXOPQ9xVrsw63Ira7TU9KSdR99cMvo3Qj8653R4vsXiWSMAgMhKn2zkj88/nWlBnS9antAube7BlhA7OPvL+PX8KzNZum0rUNPZNpL3KrO3XAbjA/MVD1sx9Gj0+BvMt4z3KY/KsDW9B+2x6ntC7bq2Ckdz61tafIHs4yP4TirJAyoPupqJRuEZWPBdKvdW8F6qylZJrEfebGQq+/p9a9o0XW7fVrRbm1kDEgZGevsfeqGsaTai0lZYjvmjeByBkEEHBP5V5Nps+reCtWbYsktkOXwCQq+/p1qU7PlkaSin70T6DRw4yPx9qdWBoWvW2s2cdzbSBmIwQT19j7+9bqOHXIqjMdSGlooASijFFMAooooAKSlooASiiigQlFLSYoAKKKKYBikpaKAEpKWigD5LkSaB2jmiYMpweMEfUVLZRLKSW25+lew3kumazHs1fTYpW6CaL5XH41zt34Egfc+jahG4PP2e6+Rh9G6Vz+hsn3OOsdPW41CGNSylpBwRlcfWu11m4VF2BcqoxisnQrBrfU3DrJHJASsiOQQD7EUzXrsQpJNK3yg4x3rSF1Fszm7ySMO+l/cvjILHpWPaB4nZgep5Bq9NcLcxIyHKnkVVaQRqccn0pNlJW1Oh0rVprO5SezmeGZf7p5/8ArivfdPnml0q3nuABK0YZ8DAzivB/B3h6717V4SsTraxsGkkxwO+K94vWFvp7heAFwKmLuwqKyMBc3F6T/eeupjUKgHoK5vSo990p7DmumU8U3uS9ivfyeVZSt321gafH5t3GMd8mtTWpNtqqZ+8araLHmct/dFN7CibwGBisLV333oX+6K3ugrmZyZ71z1y2KaBas3tNj8uyQeozXlvx0viNN07T1J/eOZGA9hj+tetRLsiVfQYrxL4pXIvvFfkHDLbxhfxPJpXsrjUeaSR46InU5DYIrotF8Tarpy+XHdMyA/ckO5a0E0yF1+ZAfwqvJ4andjLasm3+43FZKVzolGx1+neOreUqt7A0RPV0OVz9OtdRZ6haXybrW4jlHcKeR9R1FeOS2t1ZtieB0HqRkH8aWK5eJg0bsjDoVOD+lVck93sFzcA+gzWrXiOm/ETVNHcebsu4uhEv3sezf45ruNG+J2gakypcSNYyntNyv/fQ4/PFJgdvmlFQwXENzEJYJUljboyMCD+IqUGkIQwxNKspjUyL0bHI/GrKzH+IfiKgpRxQnYGrlncG6GmHvUINO3mqUieUU9Kjanbgaa1UmKxCaYwwKlPWmsODTA0bVSLRPcVIy/LU0MYW3RcdABSuoVa5GbIzJk61USMtcIo7sB+taMwyCags03X0Q/2s1K3L2R0ajCinZ4oHpQeld9jjOJ8Zy5uIkz0Gf8/nXKZya3/FcpfVWX+6Mfyrnh96ueXxHXSVoIWZcxn6V02hR7dFg/2hu/PmuYnbZbu3oDXX6YoTTIEB4Rdv5cVS3RNR+6MmQHPFVJLdX6qPxq/LzmoMZrWyZimY11oFvdg/LtY9wK5TV/A0gVnSLeBzujHT8K9IjHNXIkyOaxlT7Gin3Pnm60C4gmA2l0zg8VmTWzLIwETqATjHpX0tceHdP1N182ELISMOnB/+vTT8MdG2/NJMT6/L/hWb5+iNFKHU+ZfnjIIcgj1GK7Dw38Rtc0V4oJJjc2gOPLny2B7N1FerX/wp0mRTsmdT7oD/ACxXEaz8KJrcM9nMjYBOAdp/Wp9rZ2aK9nGS0Z6DpfizTtUjXc/2eU/wSHjPsa12II46V4Es13p4CXMTp2DHofoa3tL8T61ax5sVkuIgeUZSy/8A1vwrdSOdwfQ9caq81vFOpDqPqOtclpXxJ0q8nFrqKtp110Il+4T9e34118cscsayRurowyrKcg/jV7k7EtqUt4Eh52oMA1Y3A1TzTlYr0NNC3LWeaax5qITf3qeWz0piJbc/vvwNVb89ant2/fD6GquoN96uerub0jAuzya6/QwV0W2wf4Twfqa467bk12WiH/iS23+6f5mtKIVtjm/G0oxZqeCZxxWSpytanjXn7D/13FZSfdrdbmUfhINJc/2pqS56GPH5GtfNctZala2XiG7jup0iM20IX4BI7Z6d66gMG5ByPaqi9BSHChulIDTu1MkyJep+tQmp5uJGHvUJ71h1OhbHe6Od2h23+5iuLn+XxNfAd1U12GhHOhQfRh+prj735fFlz7xD+YrVbGK+Ijjbbq9v/tZFbwNc1cOItVsmz1mC/nxXRg0+o5EtUdRhTyvN2rvBHzY5xVwGoL4ZtH9hmk0JbmISc+tdJ4QbLXieyH+f/wBauaNb3hJv9NuVBxmIH9f/AK9RE0nsZepDZ4pux/ejBqfQZNuoXMfqiuPwNRa3lPF2CMb4DUWlsY/EMY/vxsv9f6U2SvhOpIzx2NYt74cVrv7bps5srzuyDKuPRl6Gtung0NJkpnIuzMSzYyTk4FbnhQgzXkeesYP5H/69Y1yuyeRfRiP1rR8LyFdXZezxMP5Gpjuay+E5qRNl5qEXpMxrYswlxpsQdQw27SD7Vn6ivl+ItQTsWDVb0Y/6Iy5+654p9SHsio2n3OlytNpjBoicvbMflP09KnS6W9iEyxvGejK4wQfT/wCvWpxVS5BV8jAyKTWg4PUu+Fj/AMTO4Ts0J/QisbRCbfX2j6bLhl/WtPw9MItehXABdWXP4Z/pWXL/AKL4tvE6fvg4/HH+NOOwS3Z6KKl9KhByoNSDtWpgPBpe4NNzngfnSkcc896BDg2fu8+/arEbHaO9Vs1PF0/GkxocMhjmg7jg9BSk/PQ33RSGHzEYxjB6mkZd7Mv95cU4dKaR86E/SgDnldZIww5Vh+dYllINI1i4sXbbbzgzwegP8S/1qxZzNa61qWlznmOVpoM942OcfgTj8RReFZVN+IfO+yhngUHBdsdfpWi11C1m0PuxcGznuokU3IjPkqwztH+JrlfE7i+0MX0QwcLKB6MDkj8D/KuzsbqK+sYbqM5SVd309Qa5bVLQW017p+P3NyjTw+gOPmX+R/OpntccTvvD8y3GmK6HIZA4Na7cjPoQa434d3Jm8P2YY5YR+W31X5f6V2QyUx7YqWTHYzPEUEk+i3QhJWVAJEI7EHP8s1w9jfpfzSRTQYuXgeKQAcHI616Sw8xNpGd6Fa4DWdDy32q1/dyoc8cYrOUW9TaElscPpx1fwbq0jwpJNYpzJjkKucc17HoPiC21m0juLeQFmAyM9fY+/vXE2d8L6Sa2uIgLiWB4H7bs9CP8K5Swi1fwfqc0tury2EfzSgc7F9xShPoxyhfVH0AjrIu5T+HpTq57w/r9trNklxbyKWIGRn9D/jW+rh1yPy9KsyHUUUUAJRS0lMAooooAKSlooASiiigQYpKWigBKKKKACkpaKYHkOyRDyDS+aADuGKv9OoprQxv1GK402jeyMmGzggjluY0KvLndg8GuU19Bcr5bEFSexrsdQxDBtXGPyrjbk+derGqgMWxxXS9IpGK1lcnsPBy61YLNpt9CJl+V4JwYsH2J4NYmoeHNY0+5UXlhMqg4VimQT7Hoa9LtQIIEQLjAArQt76aEbY5iB3XPB/CsW7muqZ0Hg7SI9G8PWsATa7oHkz13HrmrOvSbYEjB+82az7XxHKBtniVwO68Go76+W/mRkBCqO471cLIzndsv6LH99z9BW12qhpcey0U/3jmr3SgHuYmsvuuETPCirujR7YC3qayLuTzb2Rs98V0FlH5dpGPbNN9hLYmnfy4Hb0FYFgnm3aZ/vZNa2qSbLJh6nFUtHjzOzf3RT6CibZO1C3Ycmvn3WPtGteJ76e3ieUvM2Aqk8ZwK901q6Flot7cE42QsR9cV4vFezvaeWyyw2rSAKYfk3epZuvU0nG6sVCXLK5XXRdRjAD2cw+iZxW3HoksCjYc+xGKypNLaOOLGplpdvRphkHJOBzn0qxpGsalp+rW9hqDNPBO2xWf7yHtz3FZOFtUa+0cnZlySzOCssXB9R1rHvvDFhcKWRDC/rHx+lekm2UrgqCKzdR0yHyHkUFSBnilqUzxq88L3JupUikEqou4cc81zlzZS2shWRSjD1Feu2cP+kXMh7tt/IVT1bR7e+jIdBu9RWbqNSNVTTiea6bruqaM5awvZoCTkhW4b6joa7/RfjFdxskesWiTp0aWH5X+uOh/SuG1bRpbCQ8Fo+xrGIwcitU0zJxsz6V0fxpoWtqPs16iS/wDPKb5G/DPB/DNdADXyvGxUAEYNdJpHjPW9GCrbXrtEv/LKb50/Xp+GKLCPoXNJmvONI+K1pMVj1W0eAngyxfOufp1H612+na1p+rR+ZYXcU6j7wVuR9R1FAGh1pDxSbs0hNK4CE0qDfIq+pApp65pPenzO1gsdKFAUe9VbwlU4qhBezxgDduX0NST3YmXBUg/nWUkNbjclk5qTS0zfA+ik1F0jq7o6Zmkf0UD/AD+VTT+NFz0izWIxTW6VJUcpwpJ7DNdxxnmWvyeZq0x9D/jWSPvVe1Jt95K3vVIda5r3kd0VaKIrxXe0dEGWPQVLH4qvtFme21fTHW3Vjsng+bgnuD1/A/hT0GZox6sK6m5gimj2SIGUjBBFapO+hjK2zKdhrWn6tHus7qOQ9SmcMv1B5q0RXMal4Msp5BNZlraZeVKZGPy5H4VQW+8TaCSLhP7QtR3f72PZgM/mKfNbcjl7Hcp1FXYO1cnpnjDS75kjlkNrcNx5c/GT7N0P511UDA4IOR602xbGxaAedH9a2WrGsTmaP61sN0qegFWfoax7uMybkUZLAjFbE3Q1mF0S5QuQqhuST2rknubx2OE1LQI7Zdlwo2k48px1/Cq6W8Vvb4QJDEgznhVUevtWj4omh1TxAl/FO4it4jEoH3XOSc/r+lcB4jstd8TOmnaWshUuP3QONw9WrdJRdjWN1G9tTs9C0Pwv43t5ftF3bzSAlFVSFkXHf1qpc/DvxR4SkNx4X1Frq0U5NpKeo+nf8OaXwd8FJdMnhv8AUtSkW4QhgkB24Pua9lUbVAznA61olc5py111PFrD4gxwziz8Q2UumXQO3cUJjJ/mP1+tdnb3MF1Cs1vMksbdHjYMD+IrpdV0LTNbgMOo2cU6n+8vI/GvO9T+GdzoLS6h4X1h7JV+ZreY5jYfTpT1ROj2OlHNB4xjivOtJ+JgjmFp4gsntJQSpnjU7Dg9cdfyzXeWd/aajbJPZ3EU8TDho2Bpit3LcMwSUF+B0qvfSA5IIIpzd6hkUMMEZFZzhzalwkomJctkmu10U/8AEltf9z+prkbqxY5MRz7Gut0X5dHtlPBVMEelOmmnqOq01oc341PNh/13H8jWSn3a0/GZ/eWI/wCm39KzYvuVsviM4/CVjpdrqEM8dxEr5bPI9qyjp2saBltLmNzagf8AHrOcgD/ZPaugsDme5X02n+f+FXSuaduwX7mJp3iezvZRbzhrO77xT8An/ZPQ1uZ4rM1LRbPUoytxCCfXHIrGW21zQT/okpvrQD/USn5lH+y3UUczW4WvsbNyMTuPeoD3oS5a8hW4aCSBnHMb9VNJWV9TZKyO38OnOhRexYfqa5TUhjxbLx1h/rXUeGTnRQPR2Fc1rI2+LF/2oTWqehhb3jM1Gy+3XEMAleLcxw6HBBwcH86iXVNW0BgmqxNeWY6XUI+cf7y9/wAKvzN5d5A57SCtpkV1KsAQeCDRre6G7dSKxv7XUIBNaTpLGe6np7H0qacb7eQf7Jrnr3wyI7g3mkztZXXfZ91vYii38RT2ri01y2NvIw2rcRgmNz/Si/cLa6Ck1t+FGxqzj1iP8xWJWp4bcrrUS5+8rD9P/rVCZpJe6N8UDZ4mtG/vIw/SsiV76LUoZbCBJpolZ/Ldsbh0IHvzW34xXbqunyf7ZFUrFtmt259Qy/pVPciOxqaV4gs9VLRLuguk+/by/K4+nqPcVrVkaroNnquJHUxXCcpNGcMp9jWdHq2p6Awi1lGurMcLfRLkqP8AbUfzFK/cXL2JdSXbfSj1bNSeH2267B77h+hpmoTwXUiXNvKksUiAq6HINM0qTy9atD/00A/Pj+tJbmu8Sv4gTy/Fc3+3GGqjYanBZ3stvOxjErfI7D5c+mex5Favi+Mp4kgf+/ERVO0toLuG5gmRXVmBIP0/+tQ9yFrE1wQelQXQ4U1jCO+0M/uN93Yj/lkfvxj/AGT6e1aMd7b6haebbyBwDhh0Kn0I7U27ijow09vL1m0b/pqo/Pima+pg8XyZwVeMMM8f56VHvMNzFIP4HDflVvxmgTxDZzDo8ZGaUNmVNe8dlbSCS2idecqDntVpeQM81naRJv0uA/7OPyrQTpWxzkgoPQ0Cg0CFyKliPWoVqWInfQxkzcEH3pf4aRugpR0NSMEpr/dB9GpUPNI/KsPTmgDk/ElnF/bMeoSMYo7eJmkfH3lII21YhaOa3jkjKtE6grjoR/nFaOsRLMqBxlXQqR6iuU8Pu1nPdaNLnNsd8BP8UZP9Dx+VaJ2E+4umf8SvWbjSzxBNm4t/x++v9fzp3ie2abT1li/18Db4z6kdvxqTxBaSS2aXduP9Js286P3x1H4ipzcxX+kJdR/6uRAwyelJq6aKTs0zN+H0+0TxJxEJy6Z67W5/nkfhXow4Yj0b+deaeGQllq8tvvw02ZVjPUDOP616QDkbh3UGs+iFs2hwO0D/AGWrzxvEn2HxTe6PqfyDzj9nmIwGU8gH/GvQjjc4z1G6vPfG+jQ3WrrKwwZowSccccf4Uczjqi4RUtGT6zoqzKbm3ysy85X+dZ1pdm+a4sLxFEs0BiZmON44/WqWieLBp+oS6Rqch8qJ9iTt/D6Bvb3rodZ0dbyMXFtxKvIK9/epnBSXNEqMmnyyOIsrfVfB13cXtsfM0+Fh5qE8qCfT0r1vQPENtrlmlxayAsR8wzz9D7+9cNBO1+txpl/tDyoIzuGN+Dx+NYEFtf8AgkvqkEu6zWcRSQnORnnPuKmEujHKF3dHu6sHGRTq5/w/r9trVlHcW7gswG4Z5+hrfVgwyKsyFpKWigBKKWkpgFFFFABSUtFACUUUUCCkpaKAEooooA5uXTrWfnYAfVTis650MojPFICBzhutc3bahd2pHkzuoH8OePyrWj8STzW7xyRo2RjevFYRV3YttpXOW1qYZZTxjg1haJD9p1xOMqp3GrutzBTLKzAL3JNbfw30qC++13kihlGEUg1pUdgpLqaxiRuMYqJ7TgkGumm0FesMn4MP61mXum3VvC5MZPGAV5rnszTmTMe3iuygPByf0rZt4QuB1NNhhMcaqRyBV20i8y4jX3q1sDSN+BNkKKOwpZn8uF2PYE08DFU9Uk2WbgdW4q0jFmJAplnHu1dRGu1QB2GKwNLj33S+3NdCOlPdjeiMrWnz5cYPuam0dMQM3941Q1R/MviB0UYrYsY/LtEHtmmxLY5r4k3v2TwlKgOGndU/DvXlctyI/COZV8zEoATPJGc4rs/izeZNhZA/3pCP0FeavaXEke9I5HVRnaq5zUuVpFRg3A1U8ezpBGjaJAYlAG7J3HHrXReHr3TvEupR3UFmbdoCXkhzld3Z14/TiuXttEN1pMt88xtkXgxyRHLfnXd+DvDbeH4J/tEttNcSkMHgbI2Y4HtQ9tCkrM6fbVDVSEs3z34rSHWo7/Tlu9MmdpCm0Ejj2pWG2cHbptiz3Ylj+NNmXINWCNq4HbioXrie53LYwtSs0mjYMuQa4LUNJaK7RUXKuwHH1r06ZNwNVdJ0eLUPEdpBKuY9+5h9AT/SqTaJkk9zhp7UGRg8ZHPpVR7Mj7h/CvdtT8CafdKTD+7b0PIri9U8AXlqWaJN6+q81qpdzCyex5sySRn5lp0N1LA4eKV43HRkYqR+Vb11pF1bkiSI8e1ZslmhPK7T9KpNMXKdLpPxJ1nT9iXMi3sQ4Ky8Nj/eHOfrmu60n4j6JqOEndrKX0m5U/Rh/XFeLvaSKcocj9agYuhwwIpiPpmKeKeISRSLIjDKsjZBp4NfOOn63qOlSB7G8lhPUhW4P1HQ13GkfFS5jZE1S1SZOhlh+Vvrjof0osB60ppwOZBXPaP4w0XV1At71Ek6eVN8jfkev4VvxNmSpAvAArgirVlcC13DZkN1x2qqp4FOFC01E9TbiuoZeFcA+h4pt82y0mb0Qn9Kx6c80jwvCznYwxWinpqZuBwF0cyyH/aNVe9dDe6DMCWgcOM5weDWFNDLbvtljZD/ALQrGO513VhsbAXkAPeQAV1bPmuMhkL63ZR/7e4/hXXE10RZzzFLU0qH4IBFIealjGeaogyL7wxp+og+ZAFf+8nB/H1rKj0DxBoOX0W/MsQOfs8vzDH0P9CK7RRU0Y5FZtdir9zM8KeKrm91mLTNS0ua1uiCQ45RsAnvyP1r0FjxWTpcSm43FRlV4JrWfgUa21E7N6FS4PymuJ8SXhaf7JG2QPv49fSut1O6W0t3lbJx0wMmuJsbOTU792XOCckketc99bnVSjfVlRLUymO3UbnchQB1Jr0LRdDttItgFUGZh879z/8AWrO0+OwTWorWDa8sCNIzdSO2P1NdPW9NX95mdeo/hWxXvL220+3e4upkiiQZLOcAV5J4r+OljYs9tocP2mUcee/CD6etd94v8JxeKrFIHnaMxkkD+FvqK+ffFPwm8Q6NM0i2/wBotS3LwfNgepHWtea3QwUE1ueq/CHxdrXilNQk1WYSKCHjwuNuew9q3fHUsg+zQq5CEFioPXmub+C1sbeHUhtKgbFAIx0qD416tdaY2nG2bG5H3c4zyMVKbaNFZTRd0Hw5B4iklaY5to/lcEBsn0Harlx8KrO0drjw/f3WnXY5BD5Rj6EdMVk/BDxIl/pt7pdy+LyOTzlB/iQ4H6EVlfGPxP4k8PeI7FtOu5bazaHKlOjMDyDQo33Cc5OViW68Xan4Vvxp/iyxwC2EvbdflYepX/D8q6Ww1aw1a3E9hdRTxnqUbkfUdRXO+FPHmn/EGyXQ/EMUUepgfuJio2u39D7VzvjHw7Y+CrqzuzdXGnXc/P8Aoh4PzY9cdOfx6UPQSSfkemNxzTY55YG3Ruyn271zI1DxBpFpDdXtqNV0uVA8d7Zj59p6bl6fyrTsNYsdUiD2lwrnHKHhl+qnkU00S42WpLraz6mLZhs3wvuPbcKpqGRcMCD6GtLPFMZQwwQDV9bgtjM05v8AiZ3ieixn+f8AjWrVOCxW3vZrhXJ80AFSOmKt00xMDzSEDpS0U2Iy7gYlf61AW9eas3YxM9VTXO3qdKXunZeFiDpDe0rDn6Cuf8QDb4ptj6xsP0rb8Kc6ZLzgiU8j6CsPxNuTxLYk4wQwz+FbLY538RRvzs2n0YfzreDZANc9qrbbct6EHP41uwtuhjb1UH9KfUJE+M1DPCjxsGUHg9alBoblTQ9STnjV3RW2a3bN/t4/MEVUcYYj0OKn01tuqWrekq/zrKJ0S2NHxuuGspPSYVj7/K1C2kPRZRn6Zrc8drjT4pB1SVTXO37BU3ZxyOa0kYx2OzHIpWVXUqwBB6gio42yoPqKkzxQI529s4LGYx28EcUZG7aq4Ge9V4HVbyBxlSrqeee9aOtgiWJvVSP8/nWOxIIPpUdTZao1vHCbdQ0+XsSV/lWXprFb51/vJn8q2PHI/wBE0+bGVEo5H0rCt3EepQEHhsqfxqnuZr4TaIFZ8umW0d19sRCkuMEqcAj3HetGmSjMTD2ptCTszKnHy1oeL/nsdIuvoCfqoNUp/u1f8QYm8FWMw5MbKPyJX+lTE0n0ZveHJN+koM/dJFbK1zfhKbdZSJ6EEflXRqea2WxzPckB4paaKdQIQVIh+cVGOppQelAy2eUpE5FA+6aRKkAU4JpSPmI9RTcYY0/+JTQhlG/XdZo391sVx/iCJ7SS21mBSXtG/eKP44zww/r+FdneMqWMxYgKhySe3NY8kayxNG4BVgQQe9WloGzEjkSeFZEIaORQwI6EEVh6fZPb3N7aEk2KzeamDxk5JT6ZwfzqPSJbiy+06L96W3bMDH/nk3Q/8B6flVjW7KaPSkms2bzrNxMo/wCemPvA/UZp7q4rdDnpJZIfHljc9POSSJvyyB+Yr1i0ffbQseeCteQa7cRiTTdVgOYhPHKD32twf5mvVdLlD2QAPKkGs1sEviNAD5146riuZ8Wwk21rcY5Rin4H/wDVXTNxg+jVleI4vN0W4B/5Zsrjj/PrSexpB2kePeJ9ND38kq5/0q1B47sp5/TFdH4P1c6d4bA1GV2jhmCb2Odit0z7ZqprSYgsbkYIimMbY/usP/rD86dYWy3Gm6jYkf6y3OPqpyKUNHcuaT0Z1Gq6TFqUAngI8zAZXU9RWNC4vI59L1JiHkI2lhwxHr71zfhrxdPoN6NO1DfJZE4VgMmP6e3tXf6tpUN/EJ12hwMhvX0olBTXNEmMnF2ZxRSfwObS+tJJJLed2WaI8hcH+Veq+H9fttZso7iCQEkAEE8/SuT0zR5NX0+S0vsbdxVH6k/UVzepfaPBWtwz6dGRZOiiWNTld3Q/hUp23G0pax3PblYMMilrntA8Q22s2S3EEi7sfMpP8/8AGugVg6hhnB9apmYtFFFACUUtIaYBRRRQAUUUUAJRS0lAgpKWigDxgPgHepHv2qtY2aaaJ5Y7l3jkJbaxBAJ9KtSsRHgdTwKivtPhmtBvXcxX+8RWVNXZU9I2OV8SFLy3aEsRuPY1veBbgWOmtFZ3JWVG+cKeRXGajYSxX5FnM3X7jsSp9vavQdIsIrC2XbAqSOAXZe596Uio7HX23iS5jIE6JKPXGDWnHr1jcNGjM0TE9GHH51yKsG7/AIURHdKXHQcCpuKx6AYbe5XdhHH94c02Kwihm8xCR7GuOhnliYNHIyH1U4rUt9du4yBIVkX/AGhg/nVaC1OnrG1udV8uMsBnnrU1vrltJxKrRH35Fc1r0L6hq3mwzL5SqFWqWwrO5q6fqNla73nnROO9OuPG2i2/BuQx9qz7TwhbX0CveTSup/gU4FX/APhFdF0+2d4rGPcF4Zhk5pXfYbXdnPSeLrGe6ZoY7ibcf+WcRatD/hKdXuFWOx0a6IxgGQBK6q10+2ihjxAgYAc4q4qgDAAFPVhZbHk2ra3dPeH+0P7MguE+U7wZXX2xisaXUt7ZOqXDj0hiEdexy6BpFxO082mWkkrnLO8QJJpV0DRlHGlWQ+kC/wCFJ8zKXItzynTtIa/kW5kuLjyjyqyHOfb3+tdRYafa2E0ksEZV5MbiWJ/ma7mPT7ONQqWkKqOgEYFSC0th/wAsI/8AvgU1ETl2OZgImcIp5JqfWAbXQZQSATxW1JBChykSKR3CgUyREdcSKrD0YZFPkuLmPKmHFV3ruv7Isr1XlkhCl3Ygrxx2rLuvCbctbTg+iyDH6iuR0ZI7VWizknHFa3hC2D660pH+riJ/EnA/rVa80u9sxmeB1X+9jI/OtjwRHl76ftuWMfgM/wBaXK1uEpJptHXMKiZM1MTTG6Vo0jnVzNvNKs7xSJoEYnvjmuW1PwHaXGWgO0+jCu4IqNhU8pSkzxvUfBF9aElEJX1HIrm7nTZ4SVliJH0r6DdAcis680eyuwRLApJ7gUrtFXTPnySyQngFTUMllJHgbwcjNewaj4EtpsmBsH3rEHw51adiVtW2dASQARQ6hSimeamCYDpn6GtvSPGmv6G6eTdO8SceTN864/HkfgRXZ/8ACrdWK58tV/7aCqrfDPVm3CMKxHYsKXtktyvZJm7oPxbsbvbFqlq9tJ/z0i+dfy6j9a9CsNTstSiEtpcxzL/styPqOteGXvw91q1DSNZFgg3Ep7fSodP1OS2ZSrsjr3BIIq4yUtUZSi4n0LmmmvL9N8e31vtEzrcx+j9fzrprLx9otyAtzL9jk6fvfu/mP60ybnTvyKpXUaSx7HUMp7EZqwk8U8SywSpJE3R0bIP41BK2aBpmEdFtV1BLyPcjoCNucrV4g1Kw5pmDTUmhtXGgc4qzGBgUxEB6irKRgCq57kuNhQtSIORSqlSonNFxGlpH+sf2FaUh4NZ+krgyn6VfkOAaTfuk21OY8XXj2ejyTIxUhgCR6GuYuPEcOiaKoiIE8wBLegNTfFLVxp+hLbDHmXUgA9lHJP8AKvIL3U5bqzjUsS0a7fwHT9K54xctTrhK0WjvPAPiUP48RZ3wlyjRgk/xdRXrviK8uLDw7f3dqAZ4YWdMjPIFfI/9ty6depLbsVmjYOj+hHNeseH/AI3G/gNhrWneaJEKNLB6EY5FdcdNzCquZ6FLQPj3fW8wj1uzS4i3YMkPyuB9Ohr1vw/488O+JowLG/i80jmGU7WH4GvkzVLSNdQuTbZMIkbYfbPFZ8c00MoZJGRl6FTg/hVXuQ4WPuCCztbZne3gjjaQ5coMbq8Z+PB/0nTO/wC6Y4/Gup+Dl9qF54ScajcSTvHJhTI24qMdM1zHxumtk1PTI7hWOY+MHHGeaL3WgRTU9TyjQ9ZuNF1G31WxkMU0LZHoR3BHcGvoO1ufD/xc8INFKFEy8OoPzwSY6j2rmNe+FnhaLwi2rxm5gCW4mby3LZyAeleN+FfEl94Y1uPUNNlZdpwyE8SL6EfSpitNTSo037po+J/Ceq+BNbCT7tgbdBcpwGx057Guo8Rar/wsPRNEkMmy5tQ0d0SOp7EeucV66j6J8UfBwZo1dXHzK33oZB2rzfxQg0m1lihgEH2ZBGsYAAU5xWc5SjouppSjGd3LoemeBrdbfwbZ24JKIGVc85Ga8v8AiHq2gWWtMkafZL2FyN9q3zk56kdAK9U8DFm8FaY7nLNHkn8TXzj8RIzL4/1bau5mn7fQVqvhVzG/vysenxya/p9hBfJGus6XKgkWWHiYKR3Her2meINO1clbacCZfvQyDbIv/ATTvhG06+Dvs87lvKlIUH+EHnFbmueDNG14+ZPB5NyOVuIfkYH6iqSbVxOydmU6OfWue1Gz8ReEYZLhpl1jTYhk7vlmRfXPf8al0bxZpOuqotbkLORkwSfK4/x/ClqLQ293rSgg9DTc0zoTjg1SkFipej98foKpt1rQuIHl+YEZx0qg4KNtYEGsXvc3jblOr8JH/QrhfST+lZXi5dus6c/+2R+laPhA5iu19GU/zqh4yGL3Tm/6bVtH4Tnl8ZkaspaycDqVqpBrd/ooSDV7TfbKAqXNuuQB23CtDUBm3OPStMIs1upZQyso4IzTd76A7dRbO8tr6BZ7WdJYm/iU5qznArmLnwz5M5u9IuGsrnqQv3H+q9KW38S3Fg4t9etTAeguoxmJvr3FCl0YmuxZnG2eQf7RpbVtl3C3ZZAf1pLiWKaZpYZFkjfDKynIIx61Du28+lZX1N+h0/jdd2hucdGBrkr9TLYrg4LAc+mcV2nixRL4fnYc/LurjGO/TYT38tT+layMYFtNY1HQSkGtQedagBVvoF6DtvX/AAro7S8t723Se2mSWJujocilTbcWsZYBldAcEZByKwLnwzJaTteaFcmzuDy0R5ik+q1N2txWTNPWlzbxv6Nj86wX5FWjrFxdW7WWo2MlrdoQwYAtHJj0Pb6Gqp+7SbuzWGxu+Kf9I8H2sw6qkbfjgA1yksctzJAkE3kyMcq+AcEDI6/Sutvh9o8A5/uxn9G/+tXKW7hTaSejD9eKqXQiPUtQa29tKLfVohBIThZl/wBW/wCP8P8AL3rZyGXg5BHWoZ7eG5jaOaNXQ8EMM1j/AGK+0gltPbzrXkm1kPT/AHT2o1Jt2Ls3Q1fkX7R4CuE6mJyR+YP+NZrO0iByhUkZKk8j2rX0cCfw7qlv6AnH1U/4VMNGaT+Eb4Ll3B1z1QH/AD+ddgOtcD4LlxcoM/eUg13o61tHY55bkop1MWnUyQ7/AIUvSmlgCOaPmI/uigZbQ5H4Ui8H8aZGSFUA9eOaMEEnJJpASN9+lP3RUbZIBJ6+lO+YqQTwO/egZBeW4urS8tW+7NEyH8RiuQ0TVTNpDNdsBc2pMVwP9od/xGD+NdoWCzJk/eWuImtray8QXt/K4it3ZImVujyhuD+uKavcN0JqE9xp1k+qeQrylk85SOUhzyB745rajkjnhWRGDpIuVPYgikeJJoXjkAZXBVgfSsTw9K1o9zos7ZktDmHP8UROR+XT8qvrYXS5y/iG1NpDqGmfwBTcW3H8JILL+B5/GvRvC10t3pqSLyJIVcH8P/r1y3jC1LwJdRqDLCdwz3GMEflmtX4fvt0q2jD7kTKKfVcnH6YrLa6HLoztCSyH3UGoryL7RaTxf89IWH44qVeQB9VpFPyofQ7TSGtzyfUQx0W9UJlkUSAf7pB/lml0aZV1SBv4JMA/8CHNaNzAI9UurRx8rM8X4HIrm9PmaOO1k/ij+U/VTSibTLWvaHGl+sir0atiXWJtK+yXM4aTTpoFWVcZKMCVyP04q7rAhn5RlLBQxHcZ6Vl6tanUPCFzbqfnj3bceuNw/kapLlvYj4rXOw0VomUz28qyQSYeNga09T0qLUUh3YVo5A6nFePeHdfuNAaBmJeymRSyHse5Hoa9n069h1HTobqB98ciZB9waTtJEawZ51Y+GPEVh4xmn0jy1spJGd1kbaqjPQDuK9Zj3eWu7G7HOOmagjGJeBxnn8as1PkNu7uFFFFMQUUUUAJiilpKYBRRRQAUUUUAJRRiigR4qreZchey/wA6bqkhjXoQFFJYAs+/uTuqprlyfIlPtippLS46m6Ofsx9q1aL1L5rvUOABXFeH4s328jG1c11yyVlPc0S0LeVbqAaciBBhGK+3UVVElSCWpCxaVnHUA+4OP51Kkq5w2VPuKpCbnrUgnHSgVi+rgnAPWrEdsTg5rJEidRx9DU8d5JH9x8/71UmKx3Nsnl28a+gouoWuI1jUgZYE59BXN2fiNoCsU0ZYHpg9Kmm8XWiXohiAZwnzKxwRVXQmtTqAQABinAiuY/4SgH/lkPyJpx8UMP8AliPyahNCszphS8YrmB4pfP8Ax7n/AL4amSeJp3XAtyP+ANVJoLM6VrpFOAM0n2wf3P1rlP7buT0gb/vg04axecYtz/3z/wDXquaIrM6mR8qDis+7uSEEa4DSZUH0461lvrOouMfZ/wDx0f41l3urahFeW7PAduWH3Ac8expc6Hys6GFBHEiA/dGKlrIttdhkOJFKt/s8/p1rThuIZ/8AVyK3tnmkmPUkKhhg9KhS2ihLGKNE3HLbVAyanxRim0mFyIhqYc85qc0mM9qhwRXMViaYastEre1RNbt2INRyNFKRA1MNSMrL1UioyamxSGEZGPWtsNtiVfRQKxhyR9a0Wk4/Gsp6FodJKBG3PaqVpJuDN6k0y7uAsb89qgsH/wBHHvXPJmsYk9+x+wzkAlthAA+lcHcaLa3ce25tVzjrjBH416FAgnuI42GQzDI9q0bjw/byA7D+DDNbUYu10ZVHZ2Z4dfeEHjBeyuSB/ck/xrj7+x1Nbh7cwMSiFyVOeM17/qnhySCJ3RG/4DyK4aC126rdlhyEC8+5zWs5OMbippSlY8qstc1bRbjzLG9ngdeqhuD9R0NdvpHxfu4yI9Xs0nXvLD8jfiOh/SofEvhqK5DTwKElHoOtedXEDwSsjrhh6inCakhzg4n0HpfjDRNaA+zXqLIf+WUvyN+vX8M1uDtXzJEWRQSDg810ekeMtZ0lkEN40kS/8spvnXHpzyPwqmibnvydqspyK800f4p2Uo2apbPA/aSL51P1HUfrXf6Zq2n6pEJLG8hnUjJCPkj6jqPyqXcdzTUVKmAQcZqMHpUg6UhGnYTRAvkhSx4Bq1MRtJrEFPEkijCuQPQ9KTlpYSjrc8f+MN47+IILfOFjtwQPck/4CvNYZJZFkWNC7JzgHtXs/j/wXe+JLpL60liWVIxG0b5AYAk5B/GvM7HQL/SdSubfULd4ZAFwG6Ec8g9xRBq1jTVLQwJY7S8miDuYGHyuJB0/Guy0K306wQRwiP5hlpdwOTUd1pUEw+eNW+orivEFpHZXQjiXaCM8GtnC/UmFXl6HX6TYaXrF/qzou52m+Vs9F56D8Kxta0fTvD+pRtLcpdHG8QJwQewY+lZGh6q+m3RkViFZdj46ke1T6vBHegXcEwl5IOD8w+o61HLaW+hfPeFranuXgD4leEotPjsCG06Y4LebyrH6isb47WX9oWuma3YzJPbIDE7RtkDPINeK22n3c7MIVOQMnPFaTXV5aaY0BuJTCxG+Et8p/CtVJLRGfI78zPof4a6vB4s+Hq6bdEGaGI206HqVxgH8v5V4R4t8IXnhHW5re4jb7PuPkyY4Ze1M8KeNLzwtrMd9ZkFekkRPDr6V9E6X4h8KfEXSljmEEj4+e3n4dD7f/WpWbQXUZeR5d8FL++tvFElqFYWVzGdwPTI6Gu5+Jei/aXjli2gzDL54yV//AFiuu0bwjpOgTPNZQEORgFmztHoK5f4g6vb+dDbLKuYQTI2eBnHB/KokmoO5pSalVVtjpPCtubTwrp0DDBji2kD6mvDvFVpE/ijUJQo3tM5Lfjive9GZX0S0dTlWj3A+oPNeF+IjnxBen/pq386Jt8iY6KTqSO4+F8Jh8PTAncTOTk1W07x6w+Iuo+G79kEW8C0cjGGwMqfr2rS+HQx4bZvWU/0rw34gvPbfEXUZ4y0ciTB0bpggDBFawfu3Mai99o958X3mpWNkk9naR3lsSUuYWbaSp7g180XjpHfzPbCSOLeTGG6qM8V9G+B/E0HjDwyGmwblB5Vymep9fxrzLxZ4G/s/UpktyQjHcmRwRROVtRRWljM8NeONft3W3EMmpwr1Q5Lgezf45r0TSPFemas5iEht7rPzW842uD/X8K4jwleWGm216ryojRkbz0qDWPFGi32o20ctgs9uHUSTsMOF/wBnFTdmns48u+p64PSmvGkgwy5HvWKNB13SbdLjRb5dVsGUMkNy3zBe21xz/On2niS0luvsd4r2F7j/AFNyNuf909Gp6EW7HSaJPDpkkwbdslx0524z/jVPxjLHL9gljdWXz15Bpc5pkkMcq7ZEVhnPI71V7Ilx1uUbzmA/Sr2nP5mnQH0XH5cf0qC5t2kiZUxkg8Gn6Ujx6fGkqlXBYEH6mnfUHsXsVHLBHMhSRFdT1BFTUUMgwJYI7aRo4kVEB4VRgCoz79KuX64uW464NVG6GsL2Z1W907LVB53hcnrm3B/SuIg+fR4T32Y/nXbSbn8MLt5zAOD9K4XT2ZtITPYsP1NbvY547s6rR5fN0uBv9nH5E1oDkVi+G33aSq90cqf5/wBa2VPvQT1KOrpusif7rA1zxFdPfpvsZh/s5/KuYJzmolubU9UdHaDz/Bc6enmDH6/1riIju0+M917/AI13Hh7EuhXkXo54+qiuGhGLSZOhVmFW9kRHdnURP5kSP/eANOqlpdxHcafFskVii7WCtnBFXKaIKE2A7exrS8MyZlvoCeHhz+X/AOus25GJj781c8Nvt1rZ2eNl/r/Soj8RtL4DP8Kt5OqBCekrL/SvRhXmdqTY+JboKv3Z92PxzXpK5ZVJPHoK2ic8yUN82ACT6Cn4J9vpTV4GKfmmQNwFH49adSP90n0oJoAljPy/Q1Ixw9QxH71Sv1zSGKfuD2pUOc/SmjlWHoaEOCPegBT1jPocVzviLTI9St7qzcYEgyp9G6g/nXQyf6s+zA1Q1Jf3yt/eWn5DOd8Pag9/pgE/F1bsYZx/tLxn8RzVbxAjWM9trcK5a2OycAfeiPX8uv4VHdf8SbxPFeYItdQxDLjosg+6349PxrfnjSaB45ADG6kNn0qt0GzM3Vis9nH5REhk4TH8WR1/Lms/wZfwQ315p8QIFrIo/MZJH45p+lWz2uk7XkDtEHW3JPPlZ4OP0+mKxPDrfZvG93GTgTwq/wBdpx/Wpe4P4T13OGY+hBpp4Dj0bNIhDqM/xx0v8bDB+ZM1IHD+I08jxCz44fa/14/+tXISRfZ7y9g7JcF15/hbmu78Yx4e0uB1KlSfoa4jUFxrEjHpPaq4+qnB/QCoRvurm1f2r3emWl7av5dykWwN2OOx9ql0qZ5rG4jkUK+wMyjpkHn+ZqTRv3+hyIeTFJ+hpunKFvwh437oz+IrTqZXMbw5p8Mp8meMM1pctH8w/hzxXq+mqsdssYGApxj2NeYaW/k+I9Qt8HMiJMM9z0P8jXpliwZMg8MgP9amKQT3L8Rw659MVZqqDhs+jA1apCCiiigAooooAKKKKAEopaSmAUVDNcwwKTJIqgdeaxrjxVahxFZpJdSH/nkNwH1PQfiaLNgb9V57y3tlLSyqoHXmuP1HX71FeW+vbPS7fHy+ZIC598cAH25rir/xtoEMRCLc6xKDkNMcRn8CMfkKrlFcntrUWqswZ2AGAGNc/rD/ACqB3bJrpbsmOE+9cfq02bsIDwo5qErRQ95Gp4fsRJDJMzMMnAwcVtixT+/J/wB9U3RbbytMi45YZrSWM1zvc2Ki2Uf96T/vqn/YY/V/++quiM08R+1ICiLJPV/++jThYof7/wCLGtBYxTggFAFAWCf7X/fRqRbCLuG/76NXcCnKMnFAFL+zIHcHyyW6DBOa2dN8NwKTJJEIyemDyfrU66ROFDDaeM8HFTrb3cXTeMehppXJb7FhdGtQOjn/AIFUq6Va/wBw/iagFxcpwSfxFTJeyAfMqn9K1UURdko020H/ACyB/GmXVrBFGCkK9eTUyXat95CPxqUyxOpUnGfUVSihXZkBU/uD8qkjjVmA2jk+lTGJSeBx0q5BaqhDHk1TsIimhjVeFA/Cse/gWa8gHUIpb+lb8yAisho83sp7ABf61DWg1uZs+nRyj50V/qOapvpzxnMUjoR2PzD/ABroTFxUZTnFZ8nYvm7mIl5qNscMDIv+zz+h5q5b69C52SqVbuB/gattbhv4arTaekgIZFb/AHhRdoejL0V1bz/ckUn0zzU3Fc6+lsg/cu6EdOdw/WlSfUrRcf61fY/0P+NUp9xcp0GKMHsKyodcTISeMo/cdP0NaMV3bzcRyqT6Hg1d0xWHkZHIqFreN+2D6irNJgUNXEmUDaOrAqQwBpJnZeoIrR25phGeCAaxnRUjSNVrc5m8uP3bc9altZdsCjPatS50i1uQdyMrHupxVJ9GuIV/cyCQDseDXNOhNLudEasWaOj/ALy+jP8AdBP6V1Fcz4dhlS5lMqFSF4yPeul61vh4tQ1Ma7TloB6V5z4niij1ydo0VS23OBjPH/169GPSvNPEUvm6xP7Nj+n9Kdf4AofGYFzEroQe9ef+JdJDMzqvI6GvRJKwtZt1ki6VzwOqXmcQmmTLZQl4dyFAQcVTlsVOSpKmvdINHt/7Kt4HhUhYlXp7Viah4KtrgEwjY3vVqpYycUeONbyxdRke1S2t3LaSrNFK8Ui/dZG2sK7LUfCF9aZKoWX8656505kJE0JUjvitFNMhxOk0b4oa1YFUu2S+h6ES8Nj/AHh/XNehaN8S9B1MBJ5WsZu6zD5fwYcY+uK8LexI5jY/Q1CwliPzKaLCPq2GSOaNZIpEdGGQynII+tPxmvmLSvEup6LOHsL2WAjqob5T9VPB/Ku+0b4xzxAR6zZrOP8Antb/ACt+Kng/pUOLGeukVn6lpVpqUYW4iDMv3XwMiqmkeMNC10KtjqERlYf6qT5H/I9fwzWz3qGgTOD1XwwkDER5xjgjoa8x8TeEtavLx5bSwknRF58sZI/CvollVlwQCD2PNV47SGF2ZIwpbrVKpKI2ovdHyI8MkMxjkRkdTgqwII+tSFhlNvB9R1r6S8UeB9M8Rr5skKrcAY3jgkfWvLdY+Ft5Zys1rOGwMiOQdfoa1jWT3IdN7o5C01e8tBhWSRfRxz+dF1qTXUoZ4I41Iw209ajvNMvdOcrdWzx47kcfnVQnNacsXqhOcloxk1syHcnKHkMOlTaeb4XS/YjIJgeChII/EU2OV4GDRtj2PIP4VqWPiH7IwL2ULH+8h2k0nzdBx5G9T0nw5r3i+S2Fvd6rPJkYSIH5j7E1k6rbfa9Zh0+91GKJ5X3OPNBy3oT2rmLnxXc3cTW9nE1vvGDh+T+Nc1OJUnJdmZgep61nGEm/eZ0SqQUUoI+ztHhjt9Gs7dZEkEUSruQ5BwPWvAPETGPxFfIwIIlbj8TXL+FvGniTRp1j0u5lkUdYX+dcfj0rpdZ1u0vL46pqUcSXEijzEhYlS/r7/hTqbWJoKzcmeofD1f8AilUPrK39Kt674U0PxGrC+tI5JMY81eGH41N4IOmSeHIY7K9guT99jE3QntivDfF/ibXPC3xE1c2F5LCpmz5bfMhGB2Naw+FXMJO820z0HQvh7eeEPEqXuk3jS2UvyTQyDnb2/Kur8Tael3YGbblocn6r3rzvw78brecpBrloYnPBnh5X8RXq1tdW2pWKXFtIs1vMuVZeQQapJWsS5PRnzZ4g0nGu3Mlm6iGUbmQHnd3H9afpmiRMpkucHYeE6/ma3vE1pb6TqotIYRGfMfc3Uscg5JP1qnbtiOXnuDWc97HVSStc9o8H4HhOwVfurGVAz2BNeS+OPFtle3k9tNZLeTI5T94MCMg44PWvWPBZDeE7PHIww/U18/8AiW2c+JtQAUqpuHyT35PSm9kZR+KR6poul3sui2uqeHb5p7SSME2Vy24I3cK3UYNWo9fginW21OJ9PuWbaFn4Vj7N0NO+EYCeFJowTtSc4BPqBTvFVlb61dGK/hDwwsdg3Fce+RQ9FcEuaVjSBBGacDjmuYsfDmtWsSyeHrhhbg5NvdkvGw/2SeR/Krra6LC4W21u3bTZmOEaQ5if6P8A44oTFKNjeWUj71SqwYZFUwwdQykFT0IOQaUEryDiqTIsV9SXbcA+q1ntWndRvOAeNwH51myKUbDAqfeueV7nRDWNjs9PPneGYQef3ZH6kVwmnjbZTJ/cmYV3Ggtv8PIv90uv6k/1ribYFJr+Mfwzk10/ZRzL4mNsP7a06BruyVLu2d2MlsRtYEEjKn6Yrf0rxFY6o/kqzQXSj5reYbXH09fwpnh9wbOWP+7If1qTU9BsNWUGeLbIPuyxna6n1BFTqtRuzZrSDfCynoykVyJ44qxG+v6Gyo6/2tZDgFcLMn58N/nmq7srMWXgHkA9qiTNKS3Og8KNkX0XqqH+ea5B12XN9F/dlauq8KN/xMLhP70Wf1H+Nc5fx+V4h1CPHVg1abxI2kRR6Nut4b2wna1uyg3MnRz/ALQ71NDrklq4g1eL7O/RZl/1b/4Vc0l82RQ/wMV/rVme3iuIzHKgdSMEEZo9CWV7shmVlIII4IPWnaNJ5WuWrer7fzBFUk06LTgUgZ/KY5CMxIU+3oKdBJ5V9byf3ZVP61L+I1jrEdqi+R4uux0DAPXokDB4I2HdR/KuC8Ux+V4oR+0kXWu00p/M0u3bP8IH5VvHqc8ti+DUmajWpB0pmYHoR7Unalzimr0oAkj+/ipj90H2quhw4qxnKfSkMEGWP0FIOGH1oQ/Nn2prHGcdetMCRxkOPUVSvxmGF/wq7kFh7isLxJdSWXh971FL/ZZUkdB1KZw36E0IZS1fT01TS5rVuCy5Vv7rdj+dZ2l302q6ZDBKGWeNjFdn0K4z/wB9cH8a13u4VsxdBw0RQMpH8WemPrWR9qTRrm1E8GDqMx86XsjkfKP6fhVdbi6EfiGI2M9prEYOy3/dTqveFsZ/I4P4Vz8xNn4002XI2yl4sjoQRkfyFd9cQR3NtJBIA0cilWB9DXl2ovLYvDBKx87TLpPmPJaLPB/Lj8KiWjKWsWe12T77aFvQ7asdJIz7lTWZo7hrBgCTghhk5rSc4Vj6EGhomL0MDxVbmTRxJzmGXP4GuA1IAtpsvfe8JPsw/wDrGvUdaj87Sb1AOfL3j8Oa8u1P5tHkYD5oJVlGPrg/oTWb3N4fCaXh65lhhu0VPMbyt2wnGcf/AK6W2vop7gTQEgqwLI3DKR2NQaFME1lQThZCVP0YZFPv7BYNVNwg2yEFGx0b6irWyItugv1Wy8Y2kg4EoeLPr3H8zXf6TIWtoc9vlNee+Jdxg0/UFHzRtHIfw+U/0rttFmDQOFPRgw/L/wCtQlqKetmdCDkfhj8RVxDuQH2qnnkEHvn86s2xzHj0OKTEiSilpKQBRTJJo4vvuB+NZNx4lso3aOFjPKOqxAtj646fjTSbA2aikuIoR+8dV9s81yOo+I7uK3MlzNbaZEf4p3BYD6A9fxNcJrPxF0C1fIkudWlX+82yLP04B/I/WmoCuepXHiizV2it99xIvVYl3YPvjgfiRWJqXiO7itzNeXNppcH96ZwW/AA4z+JrxbVPilrd0Gjs/KsLduAIVwQP948/kBXHXN5eXshmuJpZmJ++7H+ZqrJBqevaz8RfD1oCA11rEgPWVtsWfocD9K5DVvilrt8DHZmOwgPAEC4IH+8efyrhjJFEeXBP+zyfzNQvdYb5EC+55NDY7Fy7vLu+kM1xNJM56u7ZP5mp9GjkvbpLT7VHFucDc3IUHvWI0rufnYmrOl3It9TtZm5Ecqk/TNTcT2PoC9+SAMDhhzgjg1w0pN1qhz/E+K6vULwxwy7hxt6HtXNaHGbjWIs8gEsamew4K7PQYIxHbogGMKBUy0wHinCuY2JRinZqMU8LQA7NKCTShKnigZzhVJPoKAIlQmrVrBvnRcdTV+20h2wZTsHp3rVgs4YANqDPqetUokuSRIq4GKeBTgtO21okZjNoPUUht4zyUX8ql207FUIrm1jPYj6Gmm1H8LfnVqlAp3GUjaye3508RyKwXnirWO4pQMD60XAhl4WseNtzyv6uf8K2JziNj6DNY0AIhXPUjJ/GkwW5Lnio8fNTj0pBQMfgUhUUZ4pKADYtRvCh7VJRS5UFylLZpIMFQR6EZqjLpirzGWj/AN05H5GtoimlajlKuYSy6jatiNxIg7E4/Q/41Yi18A7bmFoyO+Mfz/pV9oVbqKry2SspUAYPUEcGi8kGjLUF9bzj5JVz6Hg1Yz+IrnZNKVR+7DRkd0P9OlNDajaMBFLvUdjx/PiqU+4uXsdMNv0+tGMjisOPXSjhbqEp74x/9b9a0Yb+2mxslAPoeKpSTFYtcqcjg1NHeSpjJ3D3qHdn3pQQevFMReW/Rh8wKmvN9TWX7bM8qMu5ickda7rHPHNVrtFeEo6hgSBg/WsqlPnVjSnPkdzz1xWdex7yq/3iBXolz4dsbgfKhhb1T/CsC+8J3izxPbukyLIrEZ2nAOT9ayVOUUdHtYyNpEAgQDptFM2CrBjaONVIIIAFNAGamxNxggDDBGap3nhnTr9T5kIVj/EorWRKsIvSp5ewcx5pqfw2fDPaMH9hwa43UfDN/YsVlgbA9RX0GEpzWcNyuyaNXU8YYZo95BzI+ZpNOlkkYiBiCx7VE2izH/l2cfSvqWDwrodsoEemW/H95d386sHStPjXCWVuB7RCm4zWo/awelj5KbS7qJtyJKhHfFdx4a8X6tp1ukUty0gXjZL8wx+PIr2280ywdSGsrc/WMV5p4k8L6fd6vO0KG2cbRmEYH3R26VMJuTsxzStdG3YeO7KZQLyNoW/vJ8y/410Vtf2l8u+1uI5hjJ2NnH4V4xf+H9TsVLQstxGPQ4b8q5KXVdTtLppYDLbyxHBdSVIrTlRmmz6ZNQXFvDcLtlQN6e1eI6N8W9asAsd/HHfxj+KT5XA/3h1/EV6Jo/xJ8PauFUzm0nP/ACzuBgZ9m6fniolApMuaj4btrpGG1WB/hcVyOt/C3T7uJZLAm3mA+ZVOQfzr0jzEkQOjK6N0ZTkGozzUXki7p7nztq/gjV9K3N5QnjHePqB7iubaNo2KupVh1B4Ir6kurKK6XDjn1rktY8D2eoE74EY/3lGDW0azW5DpJ7HgrsVII61Ml+HIFyglA79Dj6iu21v4ZX9qvm2b+Yv91utcRfaVe2Dlbm2ePHcjg/jWynGWxDjKJvya5YnTUg09Rbt1kRx1/GsC9E7y75Cxz3PT8KpYI6cVtpYzrbxSRPgMoYqeRT5bbA6jluGhHW47tX0qSeGQcl0YqB9e1XfFd5qOr3cZ1MpNeRRDdcKuC46c+uMVYs/EUumoI7i22rjAMR4P4Vk3mpte6lNMy4jddqr6AUvevqV7nLpuZ9pZyTyYQADOGYnpX0/4H06TS/Bun28gOfL3c+/NfMjPOP3UKtgnOFGSTXqngXW/F1pZ7bq6U2CrhY7kbnAx29Pxp8yWrFyOWiM3x/crL40lCkYWTbx64FZ0PMcv4f1rDupbm68Qz3DlnEtwz564Gf8A9VbduGxL9B/WiW5tR+Fns/w/bd4PtPYuP1rnPFHw1kvrua+02YM8jFzFJxyfQ10Hw8yPCNvnj53/APQq4+/+Lc+g+LL/AEvUbMT2sMu1ZIzh1HH4GqsmjDmcZto6b4c6Xe6TpV5b3sDRP5+QD34Fc5rEk1/8S49Fywhdg788bcZP8q7/AMO+JtN8T2Bu9NmLqpw6sMFT6GuHdli+Ocatgb7fgH12mi2gRn7zZ1/ifxFZeEND+1TJlVwkUS/xH0FZPh3xVo/xCsJYDAI7qHD+VKASvow9q5L46NI76VCDiMLI5HqeBXnngzV20LxVY3qMQolCye6Hgim30JSe6PYJLW7PiCGxsLgwTqczRlMxsnuOx9xU93qzaXfNbatayWiliI7jGYnHb5v4fxrI+MUF1Z2llrmm3EsEufIkeJiu5SMjOPpWN4A+IGq6pqdtoOtBL62uMxiWUZdeDgH1FSo2LlK+tjvjcRfZzcK4aIDduU5BFOZY5RhgCPSi98I29tbtHpEy2PmHPl/wNnqMZ7/nU32d44ylwGiYkbCSD0zk/TpSd7jSVr3LulXkVlbtbsG2FiwYc4zXLBSuq6iMEKzhlOOvWtvy5VA3KcetNdFcYYZ+tPm0sTyNO5U8PsRcXaH/AGWxW+KxrG0W0vnnDEo6YK+hrYVgeRzmmiJDu2K5SZNsjL6Eiusrm9RTZeSj/azWVQ1o7sseGpPK1lRn76MP0z/Ss7X12eKpsdGjBqzor+Xrdo3+3j8xj+tR+LYxF4lgcDHmREEjv1q4axJmrTIdIfD3EfowIFalc0upRabqDSTLL5TLh3VMhc9CfbiugguIbmFZYJFkjboynINWmRIjuwNin0NZspwQfTmtW4XdC3tzWTN901nPc2p6xNXxlzeaZcDpIuM/XBrpfD0vmaTH7EiuY8SZn8M6Vcjqm0E/hj+lbPhObfZyJnowI/EVvHc5pbHSrUgPFQr1qRTVGY40g4z9adTf4j9BQAvcGp06MKr1OnJ/CgYIcMPrSP8AeoH3vxpX4agBwPCGq9zAlxaXdvIoZHUgg9xipx9zPpTf+Xhl7MtIaZwfh+zmjjeyuGLW9jcMsDZ4cdQP+A5Nams6cuq6VNatwxGUPdWHIP51na+k+kW1peWjP5NlLm4jHPmIeGJ9+prehmjniSWNg0bqGVh0INUuwXs7mdoGovqWlJJPxcxExXC+jjr+fX8a5XxxYDzTc9EZDHMQP4T3/A81tP8A8STxYsoAWz1PCOegWUdD+IyKk8QQi4ZISAwKlpM9lHX/AApSu16Djozd8KO82lx7mBcxDdjkE4rfzvTvyv8AKuL+H2qpe2ihF2hJXix7AkD9MV2qn9GI/OkQhrIJVCt0kQof5V5VdQl4b21I5eN1/HB/rXqgbEQOfuNXnurxi08R3C4+XzN34Hn+tRJWaN6ezRzul3fNncd9qk/UH/61ddrcYEolHIbnIrirZBF5kQ/5YzvH+GeP610OrXV3DaW14oM9o8K+ZF/EhHBK/pxVJ6aia94NYiNz4VljUfNHvA+v3h/Ktzwnci4tLeQH/WQD8x/k1l2E0V7plwFyylVkAIx7H+dReCpzFbpETzBcPEfpnFMl/CemRndEp/2f5VZt2+Zh681St2+THo386swNiRfoRSZKLh4GaTIIyKrSTMLoRHGwj86N5SIdgDye1SFzI8Vac9xp0lzBbm5niUlYDKVV/qO5rwTW/idrfmPZ28cWnhDt2wKM/wDfR/oK+liHljwSArDHHWvmLxp4VfQp7uZ90ivOVWQ9qtOxVk0cpc6he6hIZbmeWRieWdif1NVHlhj6vk/7HP6mqckkgcrKST71GWGe9PzEWmvDn5EVf9o8mq8kruf3jk/Wo8Ej0pTG2Mn8zSuMbuHTvQSTx3p+Y17kkelNMp/hAX6UmwsBQgAnP8qBJj7qgH1PNMZixyTmkGSflBP0pAe26xcbbF1PVj1pPCEG66kl6hVxUGtrG2xFc5Azg1ueEbbZp7y4++9ZzehUNzfCmpFQmnrHVqCzkmOEQn3rKxZXWOrMNs8rbY0LH2rXttHVcGY5P90VqRQpEu1FCj2FNRJckjKttGwAZjj/AGRWrDbRwLiNAKmC04CrUTNtsTbSgU4UuKoQgFOxSgUtMYmKMUtFACYpaKWgBMUtFFAFe8/49pB6jFZjJtwB2Fa043IF9SKz51w1FwRXNAFB60tAwoxRRQAmKKWigBKaafTDmgAxSECnUUAR7RTGhVuoFTUuKTVwKT2atnjrVCXSkzuVSp/2Dj9OlbeM0hWp5CuYwEF9aE+VOWHZX4/+tViPXJIgPtVuy/7Q4/XpWoYVbqKiexUg44o1QaMWHUrWYDZKAT2bip5tpTeeQvzfXHNY8+lITuCYb1Q4rPmjvreQRwXB2uDkOO38v0o5+4cvY60FWA7UbfTmsGLXJogFu7ZgP76citC31SzuR+7mGfQ8VSkmTYukAjBA/GoGtIycqNp9qnDnHUEUZB9qbSYXtsVvs7L05FSIMdamAz70hXNZumnsUpsVatQj5hVVcg1PFKoZd3HNQ4NFcyZrmopDwacHDDKsCPUVXmbGaKkrIUVqUrphiqs3h6K8j84Eb3GTkYpl5Kwat+0/49If9wVhQtKTNql4xR59rHh+4toWPlsVx1xkVw1lo8M41BJ4g+9xnI9Aa9/YAqQRkHsa8z1iCKPU7sxKFDStkKMDg1pWjyx0FQleep4b4m8OPpc7PEGMBPHtWFAJAhcAlc4r2fXbKO6tGDKDxXA2vh65MNwYYy6JIcnHqOKUJ6amk4dUZ+k+JdU0ZwbK9liHdM5U/geK7rSfisdoTVbPcehlt+D+Kn+hrhbnTShIliZCPaqL2Tp9w5FW1FmWqPoPS/Eek6zgWV9FI2M+WTtb8jWg2D0r5oEskDgjKsP4q6PSPH2taWFT7SbmEf8ALO4+bj2PWodLsNSPcGUMMHmsfUNDtrxSHjVgezDNYGk/EzSrzal9HJZyH+I/Mn59R+Vddb3ttfQiW2njmjP8SMGH6Vk4NGilc831f4bWVyzNbhoJD/d6H8KqyeHLmxs0jKiQIoUlRXqUiA1RlhVz0q4zlEHGMjwvxFD5fljGDmshED8H869y1Lw5pupLturZW9COCK47UfhyyMzafcjHZJf8a2VVPcz9k1scnpd9Pp9wD9nS6UDr0YfjXUz+J/M0mSGKOWKWUYZ3x8o/A1zsmjajpUzi7tnRcHD4yp6d6qyszIy54xWijFu4nUnFWH2GoRxahOjndGY9qn3yD/SnXHiIQh1gjyx4z2H+NYzf+PCnBLeXAYmJ+5PK02le4o1HblR7B4Q+LOkw2MGn39q1n5a4MkfKH3x1FcJ8Sba2k8VSanYXMdzaXw8xHRs4PQiq9roWn29u1zNcrcjYSoQ8Z/nWLLcJFICIw2Pug9BSUr6DcLK7PbPgjDt0bU1wciRGGfoawfHGo/2L8YtOvySEQRFz/snIP6Gs/wADfFd/DUP2K70+OW2Zsl4htcf41D8TNU0bxLNaa3pd2C+3yZYWGHXuDj9KfQndnbfGHSWvtGsdQiwwgcqzA8bWH+IFeOWtribOOQeK9y8AatZ+N/Acmg3zA3dvH5T5PLL/AAv/AJ9K5mz+GWq22trb3EY+yrJlpx0Zfak9y4NW1Oq8e232z4ZOrrl1ijcfUYryTwPZva+KdNmPGJ1/U4r2P4i3Mdp4PkhBwZGVFX1/yK8k0CXbrenN6XEf/oQpy3HCN43PQfjQ88XhezmgleNku15RiD91vSvOtO+IOtHS7jTb2eS4DREW82P3kb9ue47V6n8Wdo8HeY8ZdFuEyB78f1rxNoGEgWBdqHGT3xTbexMI9T3vwxNLrPhuy1BuJyp81GPBccE/pmrUp8qIeevl7FySeNxHH05rL+He4+CBHk7keUD8z/jXlehfFHXNGm+zXu3ULVWwVm+8Bns3+NFkxczVz2swYVmXtTAxU5BxXC3nxRsibI6fbN5F0374O3zwcgEYH5g12Fw93pcQk1CEG3Iz9oh5UD1YdR9efwqbNDfkaSXA6Px71j6qB9rLA53AHirlvcQ3UKywSpJGw4dGyDTniSRdrqCKmaughLlZj2LbNTtW9JV/nVrxvHs1Cxl9ytNl050cSQNuwc7T1q147KvbWk6kECUcj3p01o0x1WnJNGFYhGvJEcAh4+h9j/8AXqObQ3t5mudKnNtKeqdUf6jpSWr7dRgPqSv6VuGrSM2YsetPE32bVIDbSkbVlAJjc/Xt+NOlwVNaksauhBUHjvWXKuBxWVR6o1pbGrfjzvACMOTEx/Rqs+DJc+apP3kH+f1qvZET+DtStycsjMw+mAf6VW8GTlLyNc/eQj+v9K3j0MJdUegg/NxUi1EvWn7gp5PPpWhiSUwn5ge2OaMsR0x9aQgBlJyxz3oAXd/dG76VPG5BAYHp25qIdKkjPI+tAwLEE5X8M806Ri2Co6jOTxQ/3qU8oPpSAYrMyMNpzmjcfOiOPY05O/0qOZVZY2IzsemgMu/gSR54JFDI+QVPcGub8MzPZyXWhXDkyWbboC3V4T938un5V1d+uy5+qg81yXiVW0+5tNfgBLWrbLgD+KJuD+XWn5j30NPXtPTUtGnhZtjgb43/ALrDkH9Kz1M82hfariMrdXMaCQE/dAHb2PX8av3My3zw2sTbopAJZGB42dvz/wAayNSaax8RbZHZrTUYhHGCeI5UBwB6ZBNErbjTK3w/Zbe/1CDoUut4H+8Af6GvUH4aXHswryHQ5PsvjG7jYlUngVvxU4/9mr1pH8xYX7SR1HYT0bQ4gEyr/wACFcP4wj2axHMBxLEp/Hp/Su2BIlTgkMmM1y/jOHNnZzgcqzIf0I/rSnsXSfvHAzKY9VvBn5ZNky/iAD+ua6q0xc+HVHUxOy/gef61y98SNRtpMfLNA8f4qcj+ddJ4bdZbK7gZgAQrDP5UR1dhy7kekR7btol4EqNHjtnH/wBaqGhSG31vUoBwGKTge5HP6k/lV+Bvs+oK3TZIGrPnH2HxqmRhJkeI/gcj+Ypi7nqVpJvXcOjKGFXAcPn0bNY+jybra3OOxQ5rUHIHuMflTZmh92dlzDJ61Vv7tfKurfaRvRlV/Q4NTXySyW8ciDcFOSO+KLqa3SMMWiEjKU2nALEjp/OktB2dxdJuDJpVuc+a4UAlTwPxNcV8RNKS90q/QpkjEo/z+ddPplzc21rsnhgVtxISInaBVDVHN9PcW0mDvgGAPfcKOpSTWrPlbULIxybSDx0/wrOEu3IChT9Mmu61zTgs8qFehINcXeWzI/T5h+vvSuNlcuw6HBphYk5PWl2gn5n/AAWjcq4KoPqxoEADMflUmjZjJZwPUDk0GQk8nj0ppIoAd8i8Bcn1NIzseCcD24pmc8UAO/AUk+1AHq+pTGTUGxjA4GK9M8N6TP8A2TbqqYyuSSMV5tYQm/1uGLGfMmA/Wvf4o1jiRFGAqgVlLV2KT5Ymfb6THHgyHefTtWnGgQAKAB6ClxTwKEiL3FWpAKRRTxTEAp1ApwFMYgFPoFFMAopaKAExS0UUAFFFFABRil6UUARPy6j0Gaq3K96t9ZD9AKinXKmkBmHrRSsMMaSmMTFLRRQAGkoooAKbTqTFABRRRQAlFFFAAOtKaSimAU8U2lHWkA8xBl6VSltwZwcdFP8AOru4gYqMEPcOPRQP51LSGig9ojdBiqc+lRuxYoC394cH8xW0y4NMwKlwHzM55YL20B8i4fg8LJyPzqwmtXEGBdWxI/vpzWu0YI5Garvao3IGD7Ue8g0YW+q2dz9yYA/7XFXlkyM5DCsO40uOQ7igLeo4P5iqotru1bMFy6j+7J/jQp9w5Tpwyn2p2ARwc1zser3cHFzbblH8Sc/yq9baxZ3C5WTaf9qtFK5LTNVSyHKkg+xp7TSMuCc1XSYkAqwYGniVTwRilKMZaME2ijdRTnLL8w9q6a2I+zxjPRQKycK3Qg05SyHKkqfaohRjB3RcqjkrM2TXmerOTfynsXb+ZrukvZV4YBvfvXH6hpF4ZmkRRKpJPy9evpU14trQug0panO3i7oW960/Bluo0i5UgENOTjHsP8Ko3kTxqyurKwHQjFbPhAAadOP+mn9DWDWiOiT00Gan4Z06+B3wKrHuoxXGan8PM7mtWz7V6nIoNVnQHNTZrYhM8Gv/AAzfWZIkgLKPasObT1BIKtG3uK+jZbWOVcSIGHoRmsO/8I6deg/utjHutUqjW4WXQ8EezlUDDA5FPtLjUtOm861mlhkH8UbYzXqcvwzmkuC0LL5GOGZ8fpUMvw5WEHfOM+2aTrpFqldHO6X8TNTtAkWowLcoODJjY/8ALB/Ku5sPE+lamFKTeUzDO2b5f16Vy1z4GiAI88/lWZc+H9RsU+SHzYh0MfXH0qoyjPYiUXA9UCq65BBB6VFJEMHivHo/E+p6O+22uXjwcGJ+V/I10mm/FG3crFqto0THrLDyPxU8/lmm6bEpnZywLIpSRQ6Hgg1zWqeB7C8Ba2zbyHsvT8q6PT9X07VkL2F5DOB1Ct8w+o61e8vNT70di9HueI6v4M1bTS0gh8+H+9Fz+lc46MhKupUjqCMYr6OaIelY2p+GdN1NT9otELkffAww/GtI1mtzOVFdDwYu8WNjkA9cHrT1nidAkydP41PNd3rHw0mUNJp1wH5z5cvB/OuM1DQdS0s/6ZaSxD+8V4P41qpxkZuM0aGmadpV0FVrk+a3GHwoFZ19afZbqSASI5jOMocg1Bp6k30KnoTjB+laM+mCCIyRkh0OcHoRVKNtRuelrDND1y+8PapFf2EpjnjPXsR3B9RXvnhv4rpq9gXutJuIpkXLNHjyyfYmvFdGvNBIzewlJweGI3Ka6e68U2cVuIrV1chchUXAFQ5PojSMIWu2P8f+KZta16G2AEUMURfylPQnpn34/WsDSJAmq2ZHRZ0/9CFZkVyt3c3d3Ocys/Le1W9I1LS4NWtvtjSCAOGkeMZK4p2Y1KKWh7V8UlD+BLs46Mh/8eFeO24yEPqgr2TxnfWPir4dag+i3MVyVjD7UPzYUgnjrnivGbM5ghPrGKp7ipbM9h+HBL+GrhPS4YfoK8i1zw4bPWjbz2r28zu5GMsJQTwR7+1ev/CuJrjQL3YfmS56f8BFa76rouq3d3pyXNvJe225GiON6nHbNDV1oTzJSd0fPFmEtbtFhi+ZW++R0r274iXd1B8N7ea0laNnESuy9SrLyK8qlthG8hCjIkYGvatSshqvgCzgYK26GI4P0FK/ulTVpI+ftM13UNHl8yyupIjnJUHKt9R0NehaJ8TLW4xFq0X2eXIAljBZD9R1H61h6v4LaMs0Ssh9MZBrlbnRr6ByogZj6qM1KmjPkfQ9/t7mG6iWa3lSWNujI2Qfxpbm3hu7cxTpvQnOPQ+teB6fqGtaDN5tq09v/eG07W+oPBr0rRPiFDcW0f8AacQhYjBljB259x1H4U1Z7A7rc27rRpY5I5bZi+xg209ausNpwatW93b3kCzW0ySxsMhkbINMnxgnHNNOwnqVieKzJxgkelaJbFU7hfmNRV2TLpbtGh4cUTWepQMMqyDj86wvDErQX9uFGSsm3r+FbXhaTbqdxCf+WkJx9QR/9esDSgbLV5Ynct5dySSeD97NaU3oiKi1Z6kEYgbmx7LUyAKBtAHrioweBUinitzlZIKawPB9CKO9DH5TmgaHU5DioyacvWgaJpTzRn93SSdAaF5Q0gEjPzYpsvMUntzSD5ZBT2GQ49Vpj6lDU5FEluufmdW2++Mf41mXvktZTLcYMJQh8+mKh8aC4j0O11O0yZdPnExUdWTBVh+INVTcx6u1skJzaui3Dt2K/wAI/P8AlTTC1tRnh6BdPsIbKSQNciLftb74i3HaD9OlT+INOOp6PLDGSs6fvIXHVXHIIrM8Sq2mX9n4giUnyD5VyF7xMev4HmuhV1khDqQysMg9iKrfQWzuec2moLL4j0u9ICtcB4Zh/dfHI/MV7BYuG0+3b+622vF9Xg+x+Jhg7Y3uFmQ+jqefzGa9e0iXfpsgP8JDf5/Ksk9ByVpGkTs8s/3XIrF8T23maHcEAkxSK/4dP61ryjMb/wDAWH5YqDUk8+xvIxz5kBI+uM0S2HB2kmeTaicW1pMcfurgZ+h/+uBWloUaTXM9lLzHNE8RH6j+VZmpJ5ulXSE8qBIPqpB/oataPdCLVbabszIxP16/zqIPRG01a4kf2yxv2tp2863I/dyk/OOeh9frVnxM4jvtOvhjbvjkY+xGD+oFX9Xg8u8PHBP86oeIIvP8MJJjPlBh/wB8sGFXaysQtWdxosn7h1z9x/0NdB344G7+dcb4XuBLDGd2RLArZ9SP8muvjbdCD3KfypmQycu0Ij3sqkEEA471XMagg4yR0pb/AFGztVPnXEatnIXOSc+1YsniWAkrbxsx7F/lH5VLTNIysjbHNc3e6rBH4xtLISjzZLeRWQ8HIKsD+RaopNVvZzzL5a+icfr1rjNTlS08Z6LfrIC0d15Mpzn5X45/M1UY2YSndMq+LbApq90qRsQMucKTgeprzvULdZM7SpYdK941mLGrFQvFzAyn3I6V5NctFeSyQSxAOvGCeR/nFTNWJTvueezoYmzggfyqLJJwOa3tXsPIcn7yHqaxGLIxUnH0pDYiwyycKhNS/Zkj/wBdMoP91fmNQF2C7dxx6ZpuSegpgWDJBGf3cRf3c/0FMa5k/gOweijFMWN2PAJ+gp/lKo+YgexOaAPbvAdp9q8VQEjIiBc/0r2wV5h8L7T/AEq9umH3QEBr0/dWS3HPZIUCpBUYqQUyBwp4600c08UwFUU6kBpc00MWlpM0ZoAWikzRmgBaKTNGaAFxRS5pM0ALRSZpJH2oSOtADVOSx98UjjIpV+QYpSQRSQGZMmGNQ1fuI8jNUytMY2kp2KQigBKKKQ0ABpKWkoAKUUlFACnpTaXNJQACiigdaAFp3akFLQAVFFxLK3q39BUtRRn7x9WNDAlYZWo6l7VGeDQAmKSlPSkoAaVzTDGD1FS0YpNDuVJLRG7Y+lUrjSklBLIrH16H862KQqDUuHYakc79kubYg288iY7NyPzqaPVr2FsXFv5if34+f8/lWyYweoqF7VG7YPtSs0PRkFtrNncHAk2P6NWjHPuXKMrL65zWRcaWko+ZVb6jn86qfYJ7Zt0E0kZ9zuH+NPn7i5UdOJVP3hinja33SDXMx6lfwL+/hWZR3Q81cg1q0mYBmMb+jCr5iWmjUntobhSk0SyA9mGarWmmW9grpbKUVzkjcTU8c+4ZRw4+uakEinqMfShxjLcfM0VpUKgsegGSarN1q9cYNrKQc/If5UrRqwwQDWUqPYtVO5n0bc1ba1U8qcVE0LoeRke1ZSptFqSY5BttiPc1i33etn/lgfrWNe964Zr3jqpmFc9TWk2gyLZpMhJDIGwR7Vm3HU16DbJu0q3B/wCeK/yrfDq7IxDskeDeM9MRriHfEAfMALY965bxD4ebT382EZjPJFet/ECyj8uCQLhjKOaw9XtFubAqRk44rqaaehjFpxPI7d5YSZYndCDgMpIINdZpXxA1iwEcc7reQrwRKPmx/vdfzzVWz0aecXSQx7tjAkY+tUrnTGjYh42Q/Si6e4Wa2PTNM8f6NqGEuHaykPGJeVP/AAIf1rponjniEkTrIjDhkOQa8Ae0kQZ+8KnsdX1DS5Q1pcSwEdQp4P1Hek6aew1Nrc93aMEcio3tIpkKSoroeqsMg159pXxNnQrHqlssq9DLFw35dD+ldrpXiXSNXA+yXieZ0MUnyP8Akev4Vk4NFqaMTUPh7pdzcrdWim1mVs4XlT+HasPWvCN9b2rtFF5+BnMfJ/KvUtoprIDTU5IUoxkfNDwtF8rIVcE5BGCKkRZ9wXOSw9e1e96p4a0zV0Iu7RHftIBhh+NcVqXw3nhnWbTbhZFUf6qXg/nW0aqM5Uux581tLbndgtG33tvUUWemG/uPLhmjBP8AfOCPwrcv9Ou7Albq2kiPTLDg/j0rClQFycYI7irvcnbdHVPof/CPaFNfLe3C3akKSjbF5OMe/GetU/tVpAAPMGAuPpWHNeXUtoLeSZ2iU7gGYnpUCxrdRgiQeaP4X4yPY0KLW5p7RfZR9A/CXV9KGkXMMd/EbuZ/MNuThlxx0PX1rnPFfgK8svE17r9tLO7vOJo/JGNvrk9a8dP2i0kVlLxuvIYcEfSu38PfFnXdIVYLxxf2w/hm+8Po1NrzJUrSu0StHdy211ceSxjjfMjkYwSele26TJ5/gfT2HX7PHn8MVwesePfD/iTwLdwW3+hXx2sY5ExuOex6Gu68PwTQeBrCOTDSi3CkDn3FSkypy5rMqvCkgIZQR71j32lwQ4mjQLuODWrJdwRf62RYyTgBjgk+gHWm34DWTMOgwazmk4jhdS1OeNrEwwyAj3Fcn4n8OssEt7aqYwFyQB8px/Ku0FaaWS3fh27RgCfmH6VlR3Na3wnhmnarqujmK7t5nhDeh+U/UdDXdaR8RYp0WHVYvLfoZ4xlT9R1FYUunq+gbSoyhIrEutHuLYCQIShAIK1037nM421R7HBdQXcImt5UljPRlORSyKGBBrxew1K80yYSW08kTDqF6H6iuz0zx/DJiLU4vLb/AJ6xjIP1HanZMSbR3GjqLXW4pmcCIhlJJ6ZFY98Fj8SXygjBfcMe4B/rVyC6guoRLbzJLGRkMhyKbJEjvvKjd/e71UVZWE3d3Z6DZyGWyhkJ5ZAfzFWRXP6RrVqLaK2mby3RQoLdD+NbyEMoZTkHoR3rZGDJaQgnigGlFBIin5RnrinqeaYv3fzpQeRQUWDylJH1P0oU5jPsaYjYcfXFIAbgjFSE4kHvUUnWnyZ8sEdcZpgUL9o10W6MibkjViVx1HpXJ6H9n0oQ6MZGFz5Rn8tv4VLfdB9s12KMGhnRudw71wvimCS3W21y1BM9i2XA6vGfvCjzH5HQ3MEV3ay28oDRyKVYH3rB8LXMkdvcaPckm4sH2An+KM/dP+fatu1uY7q2jniYNHIoZWHcEVz3iDOj6vaa6gIiz5F3juh6H8DVvTUW6sZ3iWGJ753lHyRgSE+mP/1V2vhDUEv9LikH/LeAN+g/xrlNdiI0uXzdrTXLliQcgIMhRV74YXavolvE+Mxu0J9sMR/LFZ2s2gk9jv0O6MA/xIR+VCkMsJPIIKGmICj4YjCyEdOgPFRmdYbYs7BRHJyWOAKb2C9jzK8t/Lu7q0b1eP8AmKybCQ/ZLV+4XafqD/8AXrqNftnHiG4aEbo3bcHB+XkZ61jRaWsG8GTKmRnUDjAJ6fyrCEWdM5JnSaxPb3BjEcqmby1coDzg8g1n3E9u2kS2ssgDs4ZV6kggg1lXTySld8pJjXYnsvpVSWVLUFppUjHUmRgv862ZgjW0fVLjR7C3iVVeSFSu49MfSp5/Emo3QEctyVjGTtj+UfpXFXHimyQlIWkuG/6ZrgH8T/hVKTX9QmA+z28NsP77/Mw/P/AULQTO1F6EZmZ/l7sT0+prLuPFen2jFluVkcdEi+cn8uP1rjJ2a4bde3k1wf7u44H4VGLhIxiGJVFK4HR3fjHULpdtrbGEH7zzPjP0UdPzNVdK03VvE2q3ErXOFgi3fukAGRkr7de9YTyyyHG4/QV3Hwxiu7fXZlkgkWC5gZAzDHzDkf1oC51/ibULiPw1baxaCPzkVXG/pgjnuK8rN0urFmZljvF/iUbc8+leqNbG88GX1iRloPMiA/3ScfpivDf3kT5QnAPPqtKV2NLQsSu0l6ttPGVO3YQe/oaxNQsXin8vB45De1dRHPHfRrFJtEwHyt70sWk3OqD7G8EhuuQpRc5qdRrTc4kIOADlj0UDJqUwzRuE+zsXPTIzXZW/w71k3ZOyCBUb/WSPkn6AZrdOgaNoMfmapem4mP8AyzUYJ/D/ABo5kPlZ5xFpt9dEDaVHp/8AWFbNt4NuCokuAUTu0jBBW/ceImC7NLs4rSMf8tGXLfr0rnb3VUeQtdXUlw/cAk1V+wmereEfGNp4e0+S3ltJZHd925GGP1roh8UbL/oHzn6uK8mDelPD+9Y3sU1fU9YHxRtO2mzf9/B/hS/8LStu2mS/9/R/hXlQenB6OYFFHqY+KcI6aZJ/3+H/AMTS/wDC1Y+2lN+Mw/8Aia8t304P70czHyo9Q/4Wp6aV+c//ANjSf8LTY9NLUf8Abb/7GvMw9OD4o5mLlR6X/wALSk/6Bcf/AH+P+FB+KM56abH/AN/D/hXm4enBqOZj5Uei/wDC0Lntp0P4yGk/4Wfd/wDQPt/++mrzwPzTt+KOZhyo9A/4WbfdrC3/ADb/ABpP+Fmagf8Alxtfzb/GuA3+9LvHrRzMOVHff8LM1HtZ2v8A49/jQPiVqZHFnaD8G/xrhFbIqQHmjmYcqO3PxH1Ttb2g/wCAt/jUFx8Q9YeM7YrQYwfuHn261yWaQnFLmZXKj0Gy+JO/b9ssRg9Whb+h/wAa37Txnot2QPtJhb0lXH69K8ejOxih6dR9KkBoUhOCPdlnguo90E0cq+qMG/lVSTKtXjMNxLbkNFI0beqEg/pWvbeKtXgAH2syqO0o3fr1qlMXIz0zeM8ijKnviuKtvHRAAurQE+sbYz+B/wAa2LbxTpVwm5p/IP8AdlGP16frVKSJcWjd20hGKhhniuEDwyrIp6FGz/KpQ5xVXEJiil3A9qAVPQ0CG0U4rTStAxKKWkNABRRSd6QDx0opB0paAFqGHmJT68/nUrHCn6UyMbY1HsKAJBTG608dKY3WgBKKDSUABooooAKWkpaAEoxRRQAm3NIUFPFFKwFaS2R+StU7jTI5VwyqwHIDDOK1DSEe1S4ormOfbTZYJPMt5ZIj/snI/X/GnJqGo2+RLGs6joRwf8/nW4UHpUTwK3VRSs1sF0yjFrlo/wAk26FumHGKvW10Joy6SBxk984GaoX2nRywFSoIJAwRkdapPpDQsWgd4z6o3T8KfO+oWXQ6QSD+IY+lSAgjgg1zAvNTtFBbZcAevyk/5+tW4tetzIqXCyW7t03jg1SkmTaxtuisCCKzrvShMpMcm0+hq3BcpOu6KVXX2Oak3DPIINTKnCe6LVSUdmcbf6RfW+WMJdP7yc13NsuNNgGOkS5/Kowc9CKcGZRjJqIUFB3Q51XNK5wnj5P9Hg/66isK4H+j/hXc+I/D8utwIsUyRujhvmBwfyrmL/RL+1hcvbsyL1ZPmFW1qOD0Of8ACtuDqN6PUCt680i2uQRNCrE98c1k+FhjV7keq/411rKDXPOPvG6ehwl/4KhfLW7mM+h6VzGoeFr62yXg8xP7yjNevtGDULW4PapTaG4pnhMumgAg70YHoarPYSLyrj8a9l1vSrYxRy+Sm7dgkDGeKxjp9uP+WS/lQ6zTHGkmjkNI8Xa/pEqIbk3EAwvlzHeMex6iu/0/x5YzKBfRtbv/AHl+ZT7+orKfSLOU4eBDnjpzVLVPCWyFns5yABnY/P61UZKe5E4uGx6PbXlrexiW1njlQ90bNTMua+e4bjUtPlee3mlhaNtpeNiK6rR/ibqVsQmowpdxj+IfI/8AgabpvoJT7nqU9rFcRNFNGsiNwVYZBrkNY+Hmn3m6SzY2kh6KvKH8O1bGleNdE1ZEC3Qgmbjyp/lIP16H8DXQFcjPbtU2kirqR4RrHg7WNK3s9uZof+ekPzfmOorkxuQkcg+lfTzxA5GM1z2seDtH1cFri0VJT/y1i+U//XrRVrbkOkuh4ZbXco2xcMhOArcitIGzFqySWphmL5EuNy49B6V02p/DG9tHE2nTrcoGB2EbWx/I1k61Yy20AjmjZGXswxWqcZEe9E5+WGfAlDl0PRkOcf4Vt6B4517w8US1vHa3XrbynchH07fhV7SdCtb/AEKGYF4rjBBkU9eT1HepY/Bt+kdtfvYf2jaSLv8A9GbDj2K/4VTdhJcx6P4X+KOla88FtqemPFeqfklijMqj8uQK0J9ctjc3GmzRTxSEsI5GjOyTuMHt+OKg8L2trb2Ie3sHsh08qSHy359a1b9A1nLx0GfyrGTumaqKTWpig10WiYk0+7Q9sfqCK5pTXQ+HWy1ymeqA/ln/ABrKj8ZpX+A878nEF5D/AHZGFalhZRXejwFlG7YFJ+nFV502apqMfTEp/mavaAc2LRf3X4+h/wAmuhq7ME3Y5/UvCscm50TB9VrmJvC980pWBVbb1JOK9ZZAR0qtLAineFGTwaid4q6KjaTszzCCx1zQ5POhWSPONxjbIP1Heuqs/GEW9Yr5NpwP3ievuK2LyNWiPyiuQ8W+H/sk9jdQ/Ilxgnb06Zop1G1qKpTS2O5huIbqISQyK6Hupr0HRSH0e2b/AGMfkcV8+aMmqC8MdqSjKcZz1/CvevDaXFvodvFdurTAEsVGByc10wdzmmrGx0oNICKdkVoZ3GqMbh75oNAPzEfjSnpSGiaM8MPUZpg4fPvmnw4P5UxuHoDqOl4anDmLH1ps3IpEceUxJAA6k0FGVPf29rMI5mKluRx0qKe0iuIWCbWjdSCAcgg1X1KwTVf39tOu5MhSDlW56ViJc32kTbJAyg/wtyrfSpvYor+HTLpV7daFchlELGS2Y/xRk9voa0dVYXTRafwVlO6UH+4Of1OK0bfUbHUgizIqyr90MeR/utWNrGk39vcSXtqxmV+oA+ZQO2O4qlKy1Fa7Mi91MX8F1BJGsMtncGPYO6fwn8hUPw+naG41G2QEmO5EgHoCB/8AEmsG/mki1FL5skN+7m+nY1o+Ebj7N4zuYc/LPCH+pU/4MahSuwkrI9VvryRLSeWLhvvZPsM/0rkX1tmBEtwzg8kFuD+FdNLiW0mjx95Npz78V8+3p1CeV47vUfKRWKlIz6dqq4rXR6LqvirToEMct0g5BO35j6Hgc9M/nXN3XjeJjs0+ynuD6yfKB+XX9K5iOCxhORG0zernOamNy2MKAi+iilcdi3PqmuXT7/tCWSdhF94fjyf1rOm0PUI4o9Tu286CdyFdzknHr+RpWcnksTXXwIdQ+GkuOWsrjP0Gf/sjSDrY48MIwFRVUD0pMySHaNzHsB/hV3SdKudYvRBbrxn5n7KPWvUtH8O2elERxxq8m0fvGHJPf+lUotkuVjzSx8K6vf4KWpRP70vy10lj8OxkNe3RPqsQ/qa9B8sdqUALWigiHJmLYeGtK08DyrRN/d2GSa1vlgaKQAARup47DPP6Zqrf63pWmD/TL6CFv7pbn8hzXJap8TtJhDw2kE1yWG3cTsH+NN8qQanc2qBdT1W0H8e2Ue+4Ff8A2X9a8F1mE2Ws3cQG3bK3Htmvdra5S5vdL1FDgXtng898Bh/I15H8RtPki8WTspCrKofA9ayexqmcqJGV0lgkKSIwYAHBBHQg11+nfEDUJ9NSwu4oHmiYtHclNrgnvwQM/hXL2fh3UbqNrm3t5WhT785G2NfYseB+dXYtHhdT52pQee3At7VWnlb3+X5f/Hqm7WwNXOmvPGWpNarBhVuz/rJx6eorjrvUB9oO3ddXZJ5znmultdFvJ9OAtfD+o3bN0lvXEKsP9lAQf/HjWWmoX8W22hij052MkRjgURncOnzDk9upqWramkYuSMw6Frd8nmXeyzt+ubqQQrj2BwT+ANSW2jaOjGN7u51CftDp9uzA/wDAmxj/AL5NekeEPB+kXlhHd6pbtd6j1lM77lVs9AM4r0C1sbWyjCW1tDCo/hRAB+lWo3M27Ox4gMeuPrTgOeoqHfnrRnmuc2LABz1FOwfUVXDU4GkBI8TsMo4De5NXYrGZrNpzNbjb0Tf8x/CqAenBqALXzKcHGfrThn0qqHp4fjrQBZG7FPAaqof3p4b3oAs80vzEcVX3e9ODe9AycK3pUVxFclQYZPLI7dM/jShqdvJGCaBWLQtXSxWRr63abIIi6nHfJHApEc7iOw71XB5qRWpDSLO6lzmoN1ODUDHOduGHUfyp+7NM6imRnqufun9KALAajfUYNMmi85NucH1xmgCwCc07NU7KxO5vNuIo8Hrt6/pUyCRDhmDfSgCzHNJCQY5GQ+qnFatr4o1W1AUXPmKO0o3fr1rFzTScUXCx2lr45bAF1Zhj/eibH6H/ABrYtvFOlXGAZjCx7Srj9eleaA0u6qU2S4I9fiuIp13QTI49UbIqXea8cjmkicNHIyMOhU4Na1r4n1S2I/0oyr/dlG7/AOvVc5PIenBh3FOwpPBribbxydwF1Zrt7tG3I/A/41sWvirSblgvnmJj2lUr+vT9apSRLizdK0gWoYriOYboZo3HqjBh+lThyOoBpiAelLik3r6GnAg9xQBHMdsMh/2T/KgdMU25H7kj1IH5kU+gByjimsOakUfLTGoAjNFBooAKKKKACiiigAooooAUUUUUAJRQaO1ABRikpaAIplygH+0v86XaD1pZOQv+8KWlYdyJ4VYcqKqS2ETgjb17VoGm4pOKC5gS6PscvCWRuuY2x+nShLrVLQAF1nUdnGD+fet8qDUbQqwwRU2kth3TM6LxBAGC3UUkDHuRx+datveQzqDFMjj61RmsI3B461my6MEyYsxkc5jOP06U1JrcOVdDqd47inDDDiuUS61SzYBZVmXoVlGMfjVuHxFGGK3cDwt2YDI/OrU0ybNGnNpVlNL5ptoxL/fVdrfmKp3GjE5ML/g3+NXre+guADDMjZ7Z5/KrG/PWk4xZSm1scvNZXEH34jj1HIqICut4NV5rG3lB3RgE914NZyo9jRVe5xOtD/QQfRwf51zp613mqaFLdW0sVs6lgRgPx+tcffaVe2DkT27qP7wGV/MVy1INM6qVRNWKkZxKnpuFd14h0mGaFiqBTsPQYrgc4Oa9W1FQ8GfVKuir3IxD2PC7DS43Gp28ijIk4yPrXIXGmeTfTRHIwuVx25FekwxhNX1Nf9vNZtvZxS+KoVkQMj5Ug981s9NUZ7qx589vInT5hWppXinWNGbFvduI/wDnnL8y/kf6V6DqXge2ny9uTE3p2rkNS8J3toSWh8xP7y81KmnuLka2Om0r4nWs22PVLZoWPWWHlfy6j9a7Ox1Kw1SISWV1FOp7IwJH1HUV4LJYMj4+ZTnoRSRR3trMJYHeORejI2DQ4xYJyPoFosN0xVe6061v4jHc28cqEYIYA15bpfxE1rT18u+jW9iB6yDDD8R/UV3+meMdJ1EIGlNtI4yFm4Gf97p+dTy22L5l1Ih4Stre3MNixhTkhG+YAn9a0fD9jc6bo8NpdbfMiZxlDkEFiR+hrUSRJFDKwZD0YHOalQgCmpPqJxQwMaJPmhdfUEU8hajbjvT6CtZnMq2DXQeGmzeuvrEf5iublzHM6kEYOOa2/DMuNWRSfvIw/TP9Kxp6TRvU1gznNUTyvEt+hGMnNV7K7urEyyx2Znt921ijfMpHOcd+tX/Eq+X4qmPZ0Bo0Y83Cf7QP5iut7nKtizZ6raXwxDL846xv8rD8Kmm/1RP41WvdJtLz5pIgJByHXhgfrVWO31CzfZ9qFxbHr5o+dfoR1/GpltqEd0S3HMTUniaAXHg/TZ9uTEwXP5rRKcxmrl2PP+H0ncxSH9Gz/Ws6FjWt0ZV8J2UUl1O+0ZyD/OvR7cbI1Arz/wAGMPtbrnrGK7SbVbKzwJJ03f3VOT+Qrrp2SOSd2zUDU7dXM3HigA7bWDP+1If6CsyfVb26J8ydgp/hXgVXOieVnYXGo2tq2ZJ1BI+6OT+X41mz+JE5FvCSezScfpXMA07dUuQ+U3oPEl1A5eRUkT+6Bt/WpJ9bvHYldsYHQAZrn2OYjV9myqt6gGp5mVyo0x4iupoQFjjRhwzdf0rntalubzKPcOOMjB4/GrFseZF+hqrqBwyN6iht2uNJJ2Ofg1HU9FufMjkYDv3U/UV12n+LNO1WMW9/GkUjcZblD+Pb/PNc/Iok3BhkEVkz2Cklo/lb2qVPuU4djub3QzH+9spA6Hnyyf5Gq9prlxaHyJlZgvGGGGX8TXLad4g1HRnCE74R/Ax+X8PSustdV0rxAgjfEdxj7rHBz/snv/nirTM2rbi6no+m+I7diG2TFSNyjB/Ed64+DR9Q0LxNpc10mY8tbmZOVYEfLz26AV1Nxp13p5MsO50H8SfeH4VZs9ajkKpdqMcfNjI/EU1vcHqrG5GBgqDncpxXgviqxay8R36j7pmZl+hOR/OvecoLkGJg0ZxtIOa8m+IttJHrTyxcswRivr1X+lNvqJdjhhNg4qdZQRUEgjkVcfJL3XHFVXkkt32yKRipuBp7h613XgMm80rW9OKkrJAXQdMnBB/pXKeF9CuvEdz8oMdqh/eS4/Qepr2HSbC10iW1htolRBmMkdTkZ5/EVcYtq5DkV/D+mWun6VD9mQDzEDM2OWyM1HruvWOgiG4vJdu7coVeWYew+oFV9R1+18PaVsPzzxs8UcIPJ2kgZ9BxXlOoXN3rmqGe5cyzucKnoPQCrcrLQSjd6nW3/wAU2bK6Zp5z2eY/0FcvqHizxDqwKzXrRx/3YvkH6VYs/D4uAwjW4uJAdu21iygPvIeKv6Ro0l5LPClvb2r28nlyvOTM+cZGP4OeeeBx1qHKTLSS2OXh065vXLBZpj3IBP5mrg0qG3P+k3NvCRzsDeY/5Ln9a7iXw7bOQk15eXMSjgMwjXPsi5/9CqxY6XbWrkWtvEjngALj/wAe5NKzGa3h2Yz+FNJkj8zNlciMGRNhK5x09NrVT8dv9l1i2lSWCN5o9o3xqzn/AHSeRj29RWvbXKyW13ZR584W6TqCOO4/mtYvxGWG68P6Xq75Ro5FxgZ4cDI/Sh3cWVTS5kmTaV4R0e/Ilu57nUJUwT58zMoP06V1lno2m6ec2tlBC2MZSMA/nXN+AJ/N0qVJCGmikKs2ACR2z+tdjmqgvdREt2RzRLLEyHgMCDjivGfF1hPZa1MkjO8cZSSAt029wD9a9oZuM1yPiq3tb6I287L8wGRxuHPaoqrS5pRb5rFb4azhdLu7M43QTtg+qnkV3Ga838NrJoeszwgmaKYIm4A5yO/5V35uY1XJcYq6ck4kVIuMmeEj61YVcpzVfYwNT78JXIbDT7GgMR1OPwqPdz1p24GgCT/gR/KnD6/pUOcfdP505ZM0ASge9PAOPvfpUIb3pwf3oAmH1p6/WoA49aere9AE34j8v/r0oOP4v0qEvzRuoGWQf9oU8E/3hVTfinCQ+tAFsE+op6ls9qpCYjvxT4rljkgAr65qZSSKjFy2LoLe1ODH2/Oq6XQb7ysv6ipVlR/usDU8yZXJJbk2TjoPzpjMysHwMdDilyKCN6lc9RincViQSe1PWQZ61WjcmMA9RwakJoAnyKM1Dkds/nS8+ufrQIlzSFqZuNIXHrj60wJd1G4VEGpc470DHk0cjsefaoyaiEEIfcy5+vX86LgWd4/Kl8z3qF9ucJkD0zS5oQi1DcSQyB43ZG/vKcGti28U6rbY/wBJMgHaUbv/AK9c8G5p+4mquKx2tt47IIF1aA+8bY/Q/wCNbNr4r0i5xm4MLHtKuP16V5jmguF7/hT52S4I9ga5hnt2khlSRQNwKMCOKsRsQo3DJx1rxhZHByHZO42nH54rdtfFmrW6hfOWUD/nqoP68H9afOLkPUlZSPSkIBPBrjLbx3HsAurNgR1MTZ/Q/wCNa9t4n0i5xi8WNj/DJ8pH9KtSTIcWjYZDmmYxSxyiRA0cgZT3ByKC+ewpiGminZQj0+tBXjjFADaSnbT6UhBFABRSUuKAFooooASiiigBKWiigBj/AMP1paZKcFB6tj9DTqAFpKKM0AFL1ptLQAYphXNPJooAhaENwR+lV5LFD0BH0q93oxUuKHdnPzaMozsXaevycfp0piT6nZHCT+Yo/gkH+f6V0LKD2qJ4VbqB+VTZrYd0zOi8RBAPtdu8Xqw6VqW+o2tzgRzoxPQE4NU5LFGzgYrOn0dd25FwfVDtNPna3DlXQ6UYVix/ix0pxRWHYiuOWTVLGciOctGACEk9f5fyq/F4kKKPtls6HoWXpVKSZNmW73w1pl7uL24jc/xx/Kf8P0rQuI2eAIP4Vx9ait9UtbkDyrhGJGcHg1bBHcYpqKvdDcm9GeT3un3dlrV689vIkbkFHK/K30NZUf7vxJZuf+eqg/nXtckauuCAw9DyPyrDvvCOk3s63HkGGZTuDRHHP06VMosuM+5TMeVxiomt1bqBWtJp8iAlCGH5VTeJkbDKQfQ1zuDRqpJnP6h4asL1SZIFDf3l4NcW/h+2hmeMoTtYjmvUGHymuN1JdmoTj/az+fNZT0N6erOfbQ7JhgxD8DVPUvDckVm09rICAM7GHI+hrfPWunGlxXnhiJwvztEckd+SKqk3cmqlY8V07XdZ0g7rS6kiQMcp1Qn6dK7bSPiiCAmqWuPWWD+ZU/4/hXPrpqm1u4mX5kc4rB+wME3AHqRnHFdGnUws1se42PiHTtUTdZ3cchxkpnDD6g81Ya45614CFngYMjMCOjIcEVu6f411axVY5JBcRL2mHzY/3utLk7Bfueq3DrJwwB+tR2E8djqMFx8xRCcge4IrlbHxtpt58s5NtJ/t8qfx/wAa2hOkqB43VkIyCpyKXLYfMO8Tzx3WtRXVvlo2TBOMYPPWoNIlxfypnG9M/kac7ZHNRwqkVyJ1X5wMfWrvfUVtDdNQyjKN9Kjju0cc5U1IWyDQ9UJaMz3OUOav2H7/AMG6tB1KMzf+Oj/CsuRsZBrT8LnzrPV7c87owQPzFY0NJWN62sTmbJ2WSMq7DIIOD1rXhPNYdtlGjz2fFa/nJB80jhFHdjitzA0UqQcniqCagshC2sEtwx/uLgfmavwaRrd64J8u0jPtub/D9KtIzbHFggLMQAO5NU21S3DFIt07/wB2Jd369K3oPBduf3l5LLcv1+duPyrftdHs7UAQwIoHoKpRZDkjgpLnU4ofObTmWE8Hc2Wq9Bd397AotNPbgY3ytgfkK7iW1jePYVBFSwWccEQVVAGKXLqHNoecWmo3/wBoeB9Pdp8Y+U4FM1L+14GR7m0XyyM4jySK9DisIhcmQIN3ripp7WOXCuoI9CKXI7Fc2p5hDOk/3T83TaeDSMor0G78M6S8EhazTe3VxkN+Brmr/wAN3VsDJZsbmL+4fvgfyP8AOpcGi1O5z726upBGQazptNkRt8LY74rWLgMyMCrj7ysMEfhTd1JaDeo7SvF17p7CG+Vp4xxlj8w+h7/j+ddMiaV4gjM1nMEnxyBww+q1yE0EUwIdQaoNa3FnIJrWRsqcjBwRVqXchxfQ9EtdMuNPmQSy5yc4X7prmPiXZgG3ulfazKUIAznGCP51LpnjiUskOqJvx8okUYYfUd/wq/4ojh1rR4pbfNyElBXyvmPIwff/APVV7ohaM8kuLViQ8qA448xf61q6F4YuddmC3aL9lXky/wB72FbFj4YuUnWOe4gaIAbkj5K+oz613FpDFbW8cUEeyNRgCnGnfcmUh+n2Vvp9rHa20axxKMACklvYhqVtZRPC12zB/LaQKdgPJ9z7U25knEI+zp96VImlI4j3MBnHfr0rzrxL4S1Gw1H7ZNcncz7vtBY9fX/AVc5W0JhHm1Oj8U+EIr7W9Qv7rUpoofKEqICACeAQWP48VhaHp1hZyyNFAZnjfbiVf9aP9rPRenHfv6V12salGJdFmuoPOjvbfZEWHypMcYZl/i+9gZ6VnCLy1HA+YZznJPuffisuprurMnHn3ZQyzEkttXjhc+g6AYPasuELBr92MAxz2kcjqQOSrbf5YrSjfbH6bWzn/P0rH1LULeHV7W6Do4PmQS+U24KGGV7f3gfyqhHQtgMQowO1RLIIZlYnPOcCsFtdl8oG10+4udoOXkbaoI4wfSoLe51bVIS32pLc7uYrSHzSBj+9nAP4jpRewbnX2cqJr9mw3Ks8UsAVhg8EMOPzqPWPsuq+FLvSC264jcqsYUk5DZXp7YrDsdN/s+9h1CcTLIkgO+7u8kDuQoyOmeM/hW1beIIbTxELQW0pN+26KbAVCQB3Iz2H50k02Gq1KnhKC7sdUmtnj8vGDKSeH44wMe9dw84UckDisMvZQXk17e3sduzdt4Ufr1rOuvFOgWwYRNLfysf4FL/+hcD8KqKsgm+Z3Ok+2pIcRZkI4OwbsflVK90l9QmDeREhIwXlOTj2Arn5PGOq3EYTTdHEPo87Zx+Ax/Oqlw/ie9hLXmqi1hHJEQEYH1br+tDs1YItp3R0baZZaRGkt1qS2yKeg2xqaqXPi/w1a48t3vJPSNC/6niuAf8AsW2mEuo6gbgeY2fmMpz7EZ/nUieK9MgXbp2iyyt2aUhf5A/zoTUdgd3uZ+RThj0FRg807NcZuShU/uj8qcAv90flUQan7qAJBj+6Pypflz91fyqPdShqAJBt/uj8qUYz0H4io91OBpASZHTav5ClABblR+VR5pwbpRcCUohH3R+VASP+4v5UmeKbuxQMeY4/7gpQkefuCmb6p3d4EGxD8x60XGlcdezRj93GB15IqNJ3iG3IIqpGDJKAT+NWnjwD371hPXc6aatsTJer0ZSPpUq3ULnO4Z96obcDlefaoNu7n9DWfKa3ZurIcfI/61Kl3jAdCfcHFc+hZASD+VPF1KpGGJHuM01zLZiai90dCtxb5J+dC3XIyKlQpIMpIjfjiuc/tJlOGQED0NWIb+GXjDA/Sq55dSPZR6G/5bAcqabk5waz4rraMRzFfbNTJdzKCGIkB/vCmqqJdFlrdQW45qJLuM8PER7qaf5tu/SXb7NxVqaZDg1uLkUZPZqQRlvusrD2NNKsvUGruRYeWPp+tJv/AM4ppNJuoESbqTdzTOD2pDnsx/HmmBMDTt2KrlyuM4P0p25m6jA9KAJt/pyaF4OT1qIHjjFG7FAE273p4aq+6nBqBFoN8tRF+aQPxUIjmmnCRbMHkMzAD9TQgLkF7cWzBoLiSMj+4xFa9r4z1a2OHkSdfSRefzFc/LGYSQZI2+bACtn+VR5qkxNXO/s/H1u4C3lrJGf70Z3D8jit2z8R6Te/6q8jVv7snyH9eteSbqN9UpMnlR7gsu5dysGU9CORTt+eq/lXi1nqV3YEm1upYc9QjkA/hW3ZeONUthtmMdyPWRcN+YxTUyXFnp3ynvilC/jXF2fj+zl/4+7aSFvVCHH9DW9Z6/pd7jyL2Pcf4WOw/kaq5NmauKSgSnAOQRS+Yp6r+VMQlJTvlPQj8aCpoAbRS4IpKAIZf9ZEPV/6Gn0yb/XRD/aJ/Sn0AJRRRQAUppKWgBCaXPFNPWloAWlpBRQAUlLSUAGKYwzT6DSAqvEGc5HYf1qCSxjbOBj6VdP3z9BSgVLiUmc/PoqMdyqA3XK/Kf0qJG1Ow/1NwzKP4ZBkV0ZQVG0SntRZrYd09zMi8RvGQLy1Zf8Abj5H/wBatO11azulzFcISf4ScGq8ljE/VRn1FZ8+iRsWYAbj1I4P5ijmfUVl0OkBBPPFNdFcYwGHoRXKgapYLiG4ZkU8JJyPp/kVbi8ROhAu7Urj+OM5FUpJis0acunRODtBT6VymteF7+S6kntgsqEDgHDcD0NdZbapa3QHlzqx/ung1cDKw54NTKnGRcasos8duLee2YrPE8bZ6OuK7fQB5vhePPON4/U10tzaQ3ULRzRpIh/hYZFQQadbwWgit4xFGedo6ZNRClyyLnW5o2PFpIgmoX0eP4z/AFrQ8L2Nvc2N1DPErgS5+Yeora1XwZqkWoXNzAiTxSNuAQ4b8j/Ss3w9FNZ3tzBPE8Tcna6kHt60TQ4NFPU/B1o5ZoCYmPbqK5S/8NXMBPyB1Hda9SmIbNZs8StnioV0U7M8rfSGY5RZAe4x7U63TVtNffayTJz0AOD9RXeTQKkpGPeoSi9xmo9o7mns1Yy4/Fhh2reRBx3ZOD+VbVnq9lfD9xOpb+63B/KsbxhoyJp0N2sAVn2neoxnNcrPZyW7JtycrkGt0row1R6sh4qQSFe+K82sfEeo2JCmQyoONkvP5HrXRWXiqzucC5DQOe55X86dib3Ny4G7cVYZJ6VpeDSyapdxOpAkgP6EVmxNFMgeJ1kU/wASnIqeMmNg6MVYHgg4IpRik7lSm3Gxz81tPLftDHM0QEpBx1616DYeDLCHDyqZnxks5zXLm1QzGYZDsdxPqa76w1uxuEVDL5cmPuycfrW0UupjNsu2un29uoEcaqB6CryooxgUxORUo6VqZAQcGgHKj6U/tTAfl+nFADhzVjH7oH2qqDiranMP0o6h0I4l+cikk4YfWnRn96KbNx+dIY+YZhP0rh7jUtSsdSuQIXntlbJyp4B54NdyeYR9MVjrHl3B4yAfypWGmYJbS9eXa6gTY4JO1x9D3rHv9AvLIl4f9KhH90Ycfh3/AArpLvQbC/DtERHKHOXjI+97j/JrNMuraG2Z0F3bdA69QPr1/OoauWmzmo8SE4+8DgqeCPqKsCDI5FdMyaJ4iw4by7rGA4+SQf4/rWZeaNqGmgsq/a7cfxRjEg+q9/wpWHzGBc6ejnJUZprWSyX1u8FxPBCiDzIVcje4OQcj8Pyq95qTKShz6juPqO1QOuD3pp2Bq5rwYRR2AqzbypfqwhnTyo2xI4b8wD6/X/8AV5z4k8XSRB7CwZlf7ssvQj2H+Nc5ouoX+mSteR3UkEZBVivJl/2cHhvfPFa86MXBnuutX0Vnp9xb5yk0YNrHCu4gjkEDv65rNmvY5X8+eaG5vpF47xwKf4VHduetcraa/dPaeYYDFcSgBpy3IjwMKox8oxx+FXbVl2hgyoAuDk4A4P8A9aiU7jUbHS67o5vtH0yO32q8Nwjx+3BwPzxWHqNyllFI9zhI4iRkHJY5PAFdVC5k8NRybctEFfA5LFGz/SuG1zUotb1dbDTrfAd2YSuOWJPrjAweg7d8nipt2GnpqV5NeNzYLbQWUsc0oPmAN8+3JwM4+UfqfYUmlaLqkk/lw2KxoQCTGMnPbLtkdPQ102geErzT9QhumlRnU5cHOB/9fj1zXdbAvI6nqafKxcx51/wr25ublZLq4IQtuxLKZCvtt6frXQw+FrWAKJZJGBb5lixGvPsvP61p6lrulaUCb6+hhZeqs3zfl1rjdU+K2jQqyWcc1y3+7tU/if8ACk0uo1c7A6XY20YMdvEpU9QOemOtcT4+j8mysru2YRvb3S5I4+RgQ1cvqnxQ1e8UrbQRWyeuMn9a5S51jUdakCXF+03PCl+P14qdL6FK52APhvTNq3929zdD7ygNIwPv2/WlPiu2j+XS9EZ+weYhf0H+NV7Q6JPerJdSoJHVdxI4DY55rRm1vwxpwIE3mEdo0/qcCnuIoyar4nv+EdLVD2hjwR+JyahHhq+vm33lxPKfV3J/nSXHxEto2IsrAEDo0jE/oMfzrFu/HGsXLkxzCBT0WIYx+PX9aAOjk8MW9nbjzAACyk7j/n1qZrjw9pigSXMbMByI/m/lXnk+p3dxKZLmd5WPUuc1DNNBNHhuD7dRRdBa51m0+lJ0NaskEIBLAKPXOK5+4vNs7LGylQeK4nKx0pNlwNTg1ZgvW9Vp325v7yflS50X7NmnnNLnBrOF+R/Gn5Cl/tFh/Gg/4CD/AEpe0Q/ZPuaWaUGsw3xI/wBaPwGKj+0r/wA9D+Zo5w9l5mzmlDVii6TP38/nTxcof4v50vaDVLzNvtUbHBrL+1oo4ZqY14nJyaPaeQ/ZeZeursRptU/Mf0rOVi7ZPWoTNvZm6g1NGQRine4krF+wj3yjngDOavPCdhxjJOOlRaUufMb0wOlaDMqKpIB59cfzrOT1NorQz5EK5+UnAzVYxbME8E1qtNC/ygNuPQYprxqVPzL171JSM0Qnyxkds0LBuXPINaTWYILY/EVAIdqAAnkfWgdjNe2LscEde4pYoSjNn9KvJG3Xg5OelKIiWZivei4WKgAWTDDBx3pVch+GI47Gp/KDOwPGKabYbiRQAz7XKjdQR7043+TyhP0NQyRMGwD0FRbGJPTjFFguy9Hdx54Yofyq5FfSDhZd3sTmsdAA/IPTrSHaZeD0FFg0e50C3+R+8iVvdeKUXNu55LJ9RxXOvPJG3yOQMU6O8lOdwBxVc0kQ4RZ0i7H4jlRj6ZpriQNtCH/ePSsNbxSeUIPtU8d/tb5ZipHYmqVTuQ6S6Gqg2nOMt60/dVFL6Ru8b/UVOt4h+/EV/wB05qlUiQ6cizwRzSECmLLA/STb/vCn7SeVIYf7JzVqSZDTW4n407J9Kj+YdQfxpd1MRKG45qNm5p4YEVC2MmgQpek30w47E03kUwJd2aXNQ5NG6mImzRmot1BegCUmgNg5qLfRmgDRtdYv7Ij7Ndyxgdlbj8q3bTx5qkJAnSG4Uddw2n8x/hXJxxzSZKx8L94ntQx2nBHNO7FZHpFp8QNNmYLcwzQZ6twwH9f0res9d029cJbX8LueihsN+R5rxjIoz71VyeVHvIkI64NBdSORivFLTXNSsXDW17MmP4d5K/keP0retPiDqMJAuYYbhe/8Dfn0/SquTyno8mGuYyCMAMT7dKkKsK4xPHmm3cLRywzQOwxnG4D8v8K6Sz1vTr3H2a+hcnou7B/I0JiaZdIxRS+Znrgijcp4IIpiEpT0pQAehBoKkUAM70UppKAHDpRQKKAEoopMUALSGloNAEf8Z/CnCmfxH6D+tO7UAL2pDRQaAGmkwKXNFKwEbRhuoqvJZRvk7efarnakwKOVDTZh3OjI53KMH1HB/OqynU7AnyZmKD+GQZFdIVBqN4lPbNTZrYd0zIj8StEub22ZAOsiH5a1rHVrO8IWCdGGBgZwc81WmsY5B93BPpWZJoaEBkABHdflP6Uc7WjDlTOq4PPSoZrWG4GJIkce4rmk/tOyP7qdmQfwycj86txeIZIsC7tmHq0fI/KrumKzQ678N28oJgdom/MVg3nh+/gJKx+cvrHz+nWuwttUtLoYimQn+6eD+VWTtPtScE9h87R5DfIUkwQQehBqg3Fex3mmWl9GVubeOUHuV5H49a5fUPAlvKN1lO0Tf3ZPmH59f51zyoyvdHTCvG1mYfiG1F14Et5MZ2xKenpx/SuGe1WdLMEcNhSRXqt9pNxB4MaylXfLGjA7OQeTj+lebpGwgt8jDK4GK1toZJ3bKN14ZlUEx4Yeh61jz6ZNCTvjZD9K9LVQ0at2IzUUltHICGUEe4pK42kzzKJ76xmL28rIfVWx+ddBp3iy7EixXsAkBON6cH/CtK+02COckRryAelVY7KBpVRoxtJAOKn2mtivZ6XN211eyu2CRzKJD/A3Bq6QD16V53rWmSafrvkRM+xhkBuorS0K51hyscTBl3bdsnzf/XrZMwktD6AtWElnA69GjU/pUwHFUdIEkekWsUxBkSMBiOmavZrcxQtNHf60tNH3mH0oC4tWYTmNqrVYt+QR7UmMaDiSnTd6a3DipZRn8RQII+YfxrNcbbn8xWhbnMbCqlwgEiuM53c8cCgZ5Pr9/qmh+Kb2a18zymcPmM+ozyO9bGkfECC8VEvlAZWwZE/kR1Fb+u6LHNMJZkOWGAQRniuH1bwoG3TIhyvO5eGrLntozRxT1R2V1pmlarGbq0lSOUniSHpn3H/6jVb7brGhnbdILu2X+MHkD6/4/nXBMmr6EY5YGkLgAuEPI44+tdDpXxAjuB5WoRAt0Z1XBH1X/CqTT2Jaa3N4Jo/iOYPGfKumUnKHbID/ACNZNzYX9gNzwG7gB5khXLKPdf8ADNaL2Gl6wvn2cipJ/wA9IW6H3FNhuNY0qcQSxi7hLYDjqPxoaGnY8g1+G2/t25uY3WS3kIeNFPLkqM/QZzUtpajfBdzHLRyRkoPuqmcEAfXFb/jqwWLxVPcCMKZkVsdgcYP8qyrcf6PkYBKspx3wQ3+fpSQ2bcUKtGgzzt4PuOMfyrR0+1kVnmkkWG2i+/I4zz12gdz7Vgtc+XvZHIXccuTwoxms2Jb283W9ss7QsweRmyDK2OuPTGKaRLPQtC8RpqeqS6XbgpZGFtqnkseOSfz/AKdMnV0PwVYWaJOzM0mMqwOMD0qTQfD+mtp9rOLLy325bORz9P8A61dOoWNAqgKoGAAMAVol1ZF+gqKqJtUYFcV42+IFt4dieztHWXUTxgHIi9z7+1Znjr4jx6ar6bpEge6PyvOpyE9h7+9eQuXnlaediztyWY5pSlbYpR7jry6udSvXu7qVpJZDlixzk/jVKSdopSu0j606WZxIFjGVP61I0OV/eHn09KzKIxcMx68nsKjMDO+5F2n64ouNwI8rBX2609I32Aux+goAlivzE3lzZ9AcYqC5WKVi6YDH0706SJXXbgfWrUEAa2LgDMbcn2oAzoopXOEj/E1ZWwmY/M4H0FX4VSEHce/FWhLAoyWFIDOTSl/iLMfc1ajsI0HEYH4U99Sto/eq0mtgfcjz74pjOi1+Upabc/eOK5UjrXQeJ3xJFFntmsHjFcbOqC0G4496XHAFL0I+U1JtIHIqWaDcHilAHoc/Slzz0pRuDbsUgDBHGD+VKCemCacnLHPpQB1OKQwHJ4HSpkXPU1GvGeKkGQo6fnSGBi756duKjOVUsBxjnmpyh65qGQEIRTQmRx9KtxHiqy9q0LO1e6k2jhRyWPamTsjd0eMrYNJx8z4ANTyR+acYGOuc06yt2isIORgjdT5Hw2BGSAByOazNlqip5GyVX2ktnipFCk4Y4+venGVckAFSKYwDAkHI9KLjSsPiG4Nj0Oe2KjYkDg/mKkSMlOHK8djimkY+7kHtmkO5GGRSAV5A59KsKodQNhBPOKjkG9MrGoI5JFWoWjDqSCuABnGf5UAQRWnmEnOBn+IYpHsz97HfqK14VjeKJo5lLsM4JwRSNblYA7AZbJzjGaBGG1izEsC39Kqm2ZS/Hf0x2rQuboxNiNjuLZ2nkCnxb5YxI2zc2SRjFMZkiIoXJU+nFQGMuxODxx0xWu4GWDKevOOajMa9uhJ68UxGUbcHPFM8koTgnn1rVFsDyB1PaoZodh68+9K4WMzDAnIFRk8kkHrV8x+oHPNN+zkdqdwsVYhxkNj9KsxySKnDn1pVhHl9OMelRrCQpx0x2pbi2LAunVcsAaUXiAZIK+4qs24JjsPWowxZgNtPlC5rw3z8bZ8j0arS3pP3okb3HFYWMMuQQPpTlY+b8rdvWjVdRcsXujoluLZly29D9Mioz5bn5JUP1OKyBcSpuXdkDHUVF9qJPzIPwqlORLpRNtkcD7pphJHUVkx6gqDh2T8atR6hIRjzUcehFaKoupm6T6Mt7qMioheIf9ZDx6qaeJ7d/wCMof8AaFWpxZDpyQ7APekI96eqb/8AVurfQ01o5F5KnFNaksbkijPFJk0ZpiFDUu6mcUhYetMRLuoLADrUOW7dKMnuOadwJd2elGAevNRBjTt1MCUN27Uu6od1BZu3PsaQjVtNd1OyAFvezIo6DdkD8DxW7afEDUYlC3EENxjvyrH8uP0rjgHZQ2EHsX5oDHGcAH2oTYrXPT7Px9pcyKbmOa3f+IFdwH0I5P5V0FnrWn3qBra+hfP8O8A/kef0rxIMcUu84p3E4o97356gGkyvuK8Ws9e1SwAW3vZkUdF3ZA/A1u2nxB1KIAXMMNwPUZRv04/SquLlZ6aAD0NBGBXIWfj/AEucAXMUtufUjcB+I5/Sugs9b0++wLW+hkY/wbxn8jzTuKzLuOaKUSeoz9KNynvigQlFO25HHNNK0ARn/WH6ClpCP3v1WnDpQAh6U2lNJmgAxRRRQAUgpaSgBTTSKWkoATFMUDb+NSUidCPc0AM8sHtUElpG55UE+uKtCgjmk4juYtxo8TtuA57f/rqBU1OxH7qd3UdEf5gf61vkU0oD1FKzWw7oy4vEEkRC3lqy/wC1FyB9a0rfVLS7H7qZGP8AdJwaimtI5PvKPyrNuNFjkJZRg+vf86OZ9QsjoSFI9Ky73Q7C/mb7RaxucAhgMHOT3FZK/wBqWP8Aqp2dB/BJ8w/OrEfiN4yEu7V4znl4+Vqrpi1RBceFAkeLSY8dFk7/AI1jXWk3lpzJAxH95eR+ldrb6naXYHkzo/t0P5VZ+Uj0/lS5RqTPI9SXBQ47EVlZIbI6g17Df6DYaip8+3Uk/wAa8H8xXKX/AIAYEvY3X0SYY/Uf4VjKm+a5vGquWzOd8Z2inVNPugOJE6/rV/wfp0e6WTAyJP6Cp/GWn3CaRprtExeDasm0ZA+XBq34OIK3GeBkHn6VtGOpjJ6HcQHCAelTBqqRSggbQW+gqcM5PQL9TmtznJg3FNLBX5IGR3poQn7zkj06ClCqrgqoGQQaYDg4Y4AY/hU1u5DcqefTmoc1LA37wUmCFmLAghOM8809pC0SlUOccZ4pZ+9OH+pB/CkMgtXclldMHn7pyPzqtfSOsgB+WMYPX3q5DxOwqpqmQEI9SKGHUzbmVVu4hwUkyueuD2pJYlYAEZB5P0pL2MzfJ3IBH1qNZnVVWRSGxhqixpfsZ+oafHJ87KNr8P7A1y+r+EUk+aMbiOh6MPoa7xtksZXggjGKrxjKmNx8ycfhUuA1LueUeVrGjXkZt5HLZxknawH8iK7vwxqt5rFs8l3GgKAbXXq59x0q9fWKSJI235ghVTjoSKz/AAivl6dGucEDa34cf0qo36kzstUYnxBtmW+t58fK6lc/Q5/rXFiRYkaTeEC9W7/hXovxDjDaJbzfN8kgB2jk5BGP0rh/DeijXb8LdzeUq8oijj8PX60W1G3pcXTdEvtdheeKPbaREErkZb6g4r1Hwtocmm6akFwI2IYkMozn2z6U/RtAtdIBW3aQpJgtvOckdPpWxNcw2ds888ixxIMs7HAAq1Ezcr6FncsSlmIVQMkngCvKPHPxGMxfTNFYmPO2WdTgt6hfb+dZ3jLx7Prkkmn6YzRWQ4ZxwZPr7e1cO2yCM9z1+tKUuhUY9SJo8z+Zndnk561WuJzIQi5UZ796f5j3DdMEdCO1EgDL8/UfxjqazKJI1WGPc5G7v7VXkczEBc9aZOXK5BynqO9WLYKIwQMZ70ALFAE68t61as7G41G6W2tIjJI35Ae57Vc0rRbzWbgJbxkRBsPKR8q/4n2r03SNFtNGtfJtky5+/I33nPqamUrFRi2YNl8O7FFja9up5nwNyodqZ/nUus+C4RY40WJIpV+8jH74+pPUV1q5K4x09KUrnJBqOZmnKjxfUtMvrGc290GjlB5JHUex71nvaSH+Pd+Ne3XmnW2pQGG7iV17Z6g+oPauB17wdc6erT2pae36/L99Pr6/WrUiXG2xxJtmU9P0qKWJkQnrirbzXNu2TiWPvnqKa93bSL+8UgnsRVXINfXp/O1Nxn7vyis/aeBUt03nXkkhOcsaiBIauNs7IqyHFTxkD86eCT1H60wbmbJqRQeuKksQbc5H6mhuR2oKE9KVUbGO3rSAROlSfd6gULGQeakKl2GBQMap56dakOewxUvlbTgbc00xMD1496QDANvJNMl6AevNT7Mnn+VJHaSXE23OEXqaa3E3oNtLVrl+OFHVj0FbDMkVr5aHZGeBjguf8KhJjtYNpyIl6DPLn/CqtlLJf6tCvGNwAHYD0rWySuzC7nKyOvtVd0SEkZRQox9KnfysMjqd6t254/nToovKlZsBtuehqkLjaSdp5Ppniuc7ERnaZXYZ2dM9qFjEpO3BwODjmpI5QISo4BJNNjmVC3yde9Kw7jJIWjVWJPWoyeeMA+vapXLSYG4nHqc1HKjoV4Aye4pgSMAUYpz+NIW4bKsp7ZHX8qbypTI6H1pJHyOFJ3MORzSGW1kt0VQWAOOhGKcJHYYXG0AAY9KgESyRsGYA9OeKsyW8ccTNGoVQMEjjmi4rFSazyo+XcD6f41ArtEwXhsDFaDJLGhHzKVGajuLfyouUOQB8+MZprUTK0RycsOckkDmk8l8LI3CNzuwcCprby0mJdA4A6e/tTmug6KS+wKMbcYpDEiSJ4xsK5PNU3XIOckj3qQKcjBB4zxTZIduBjHHY0xEPlg+nTvSlec4PSnbWwVHXGBmhc5xjPWgY4xII/lYcDk+lI9gAxUMsgPQqeKlYbG3qxGeCD3q+jWm0ZCFmPBNFxNXMKazJHy5xnmq4tmWXnnHrXU/YA2XK/KeymmPp52iXagUqTg98Yppks5xkwcEcfnUexTIa1ngZsrsUDAwc1A9q8Q5Ug/T+tFxmc8JydpP4VXw65Gc/UVovDzn88Go3t/lJGRxQgZmumQSODTG45ORV9oD2A5NQSwMAMLTFYgikkUkiRvzqdLuXHODj2pIotqnIwfegw/IWBPfoaNA1JVvBwShH0NWU1HYcCZl9mrOKOAADwfUUyQPu6DpQD8zcTUXP3hG4+mDUq3kLN80TgH+6a5tTtY84p6zSgjDkjPSqUpIzcIs6LdDI3yzKPQNwaVoiuMENnuOaxDcupwQpFPS8UdmT3Bq1UfUn2S6GuVYHkEfhRnNUE1Buizfg1TC8Y/ejRvocU1URLpPoT96Ki+0RHqGX8M09Xjf7kqn2JxWimmQ4NDuaMmjDD6Ubh6VVybBupd2TTcj2pMZ6UASBuKXNRc0uSKAJQaA3NRbuKN1MCbcfWk3nPXmoiQeufzpcx4GFbd3Jbr+FAjWs9e1SxYG3vplA/hLbl/I5Fb1n8QtRhcfa4ILiPvtyjfnyP0rjN9G6mKyPUbL4gaVO4S5jntSf4mG5R+I5/SugtNZ0+9YLa30MjHou8Z/I814duPY0At24p3J5T3tnCuGYZ7cfUU/cp74rxG01zVLLHk30wA/hLZX8jmugtPiDqEW1bq3hnA6kZQn+n6UXFY9NK+nNNK4rlLPx/pMwAnE1sx67l3D8xXQ2mrWN6oa2vIZgeyuCfy60xFnFFOLL3BFKNp6H86AGUlPKEU3HNACUlKQaQ0AFNX7zfWlpF4dx75/SgB1IaWniMkZNAERFFPbHamUABGTQUGKB1p1AEBQHtVaezikYZUdDVz+I0jj7v1pWQ7sxZ9EhkORweoI4P5iofK1OyP7icug/hkG4f/WroABxTXUEc0rNbDuY0WvyR4F3aupHV4zkflWna6paXYxFOjn0JwfypktqknBQVnXOhRSHcBg+o60+ZrcVkbxCPkHjPaqw062jlMscESO3VkUDNYPkarY8wXLOn92T5hU0PiGWAgXto6erxfMPyppoLG8PlODmnqQT1qjb6vZ3YzFOjnptzhvyq4Njcg4PvWikQ4omB5oPb2NQ7nTnqPelM6lecg1VyWiU9KfEcNUeQwyDmnJ96mxItT85NEZzCR70kgzGD7UQfdYVIyNW23IJqPVRm3B9GFPk+WRTXNeKvE81pef2XZWRnuMKxLEgc8gADrTAvMwHlufSs1pHF15jE7H4+hqto2rXWp2s8V7afZrm3fYyZ6gjIOO3errx7oin5H0qHuWthSSKjZmWQSDk9D9KWNy8fzfeHB+tTRgJG8hAwBgZ9aNwI2cTOcAYBzWRoy+S95D02Svj8Tn/ANmrQs3LGRWGGyfxHaqVvmPXL2Jf41WQZ9wR/wCy0IUth2uQi80cRuhcbwcfRh/TNN0yyt7bBSFEOeyirjkmycMM4OePpisfUNbtNEtWubmQYxlVB5Y+1V5g72sdHe6la6XZG6u5hHGnc9zjoPU14r4v8a3niO9+yxloLFWO2MHlvc1V1/Xb/wAR3XmTyNHbr/q4geBWFcSpEVXl2B6+lTKd3oOMbEkk8dsu0csarrunctn5e5NRPGJPmVjuPOG709pykKrtwcdMVBRK7LGNi8A/rUKQvM5JPy+tJbqbg73IOKvjCjjgelAiHyEUYAwKuLpNzDYRXjwSJZyuUjlI4Yjk4rsPCPgr+0llvdSDLFHH5sUHeTBH3vQda9Q0bStK1MLa3lrDKkP+rideB9BVqOl2S5X0RTggs18AaTLZQRwoI0fCLjkjDH65rNZjuFd3qlhDFoE1tbwJDGinZGgwBjniuBJcrkgYxWE9zen8JYjPzEdqdgbqrxkhl5qXBzkk4qCx+Vz15oLA9cfjTQFxktSb4xnLZoEMFpaxlilvEN33iqAE1FJZ20oKtawurDBDRg5qyJlAGFzz3NNMh7ACgDw7hQORUkeO5FbP9q6T/wA8Yj/2xp66xpeRiCP8IP8A69Z8hp7VGNwOBilAI7g1uvq+nQvsaKIN6CDn+dA1/Tx0gH4QD/GjkD2qMPHqwzTkyejAYrcHiOyH/LA/9+V/xp48TWY6QN+ES/40cge1RjBeOG6+1P2MMcn8q2R4qth/yxk/79r/AI1Ivi2AciCT/vlaOQPbGIBJuDHr9KcFkJzhhjpxW2fGMWP9RL+S0f8ACZxgf6iX/wAd/wAKXsw9suxh7JS2QrH8K6az0dhosdyxO9gSUIwetUz40UHiCX/vpf8ACifxnut9jwvtPcsDj9KahYmVW6sYusiS3uRGzAnbnjtWj4Lsjea2p2qQi7jk4qGaWy1l955kx95DyPqDXT+B7L7JNcuuJht6jA/DmprNqJeHtzWNG+spLaKRwhIPGR0rFMa7s5xjqQP613RVXiIkjYA9VIzWNqekRxI8sDhf+mb8HPtmueM+jOpoxIkfaWDZU9Bnn8qGURtyqH1DDvUzwmNTuTJUdxUcMYeAHJzjLc1VwsD7Rt8v5cnleo/UGmz5dAzMAF6ACgJLztk+XdwCAcVPHYyXCuvmIAHx9007is0USu4rllA9c4/nTxENyA85P3hz/KrFxa+VIQw4AHKkHn9KgjdYpAGBww9KLBfQtiKMruYqeQMHoacLNWUsMqu4cA8Hmo1u0x5YO7HY8/pTJi0UeYyVJOeOOaLB0J79P3eQ0mQehOR+tSXN08liuVXJGDhSKyV1Cedtpbjd35zVyeaRrMHC4yOo6UCsUZR5e4lSoHbINM+6eu0H14pZZt65Iz83I9qsMUkjDKCTxxg0itCKcRbMKyHPTBokQeWSCQenXNJMI2AX5SSRxUbKAo6jJ7GlqULuZVOACfcUrfKRhBgnsaQqQV+Y/lVhoyI1J2nn6UgFZo1jUuCoB6sOOntmoHjDFSHjYHsGBP5daS+lb7MIzlef5Vhh70EfvUcf7af4U1clm9GZoydocLjpyBUz307BVMhZQMbeOOawRd3UCjCc9zFJjP54qddSmYHzUkGepdN36jNMRqGfGcAdsEHGKc10smAYzj19PyrIXUkeTbvj3DjaTg1ZScEcqefSlcaRHK3zsSOCSeRU00ak8Hg46GmtIvGWwOnzCmgBzlccntVAKY8qOeM9x9aYsJJ4AYepNSxxFySxIxU9tFI7EjbtwOCD70xXKTxkE5jIH0qHyFMRJHqa0JCyyMpQna2MjFGVKqWGFxzmkBlyWxONpI5qvLG2/G0ZxXSi2gkTcoU9wUPsaqS26KxKsPu9CKYmYIiPORTWixD0weOa2TZEpuBU5yfSoZIHX5Sp+g5oFZGUqt3Y4x3pCpyelaDQrnnrUJhIBx6mquJoqgYdTt6UpfLZ3EVOYW3KOKa0RyeD+FFxWZELiRejn8akW6b+JQRULxAc9OaGUj7v59aNALiXO0Agsv0NWEvWBwXR/wDeHNZibygHFKT82SCKevQLJ7o1xdI33oyP905p3nxE4Dlf94YrE3hVyGIOakSWQk4bP61XtJIj2cWbQPcFT9DS7jjkVjrOTgsozUwuyDxIw9jyKpVO6JdLszR3D1oqot5k4YK304p4uEPVWX9RVqaZDpyROfrTSSKRXVuBIpP5U4qw6rVKSIs1uKDn2+tL075qMtSZzVCJtwHSjfUOaQk0wJ949aC9V9xoLUCsTGQetIJADkHn1qAEKc4U+xpq7QeAB9KdxNHQ2virWbMKsV/KVHRXO8Y9Oc10Vn8Sbldou7KOT1aNip/LmuA3+9HmYNO5Nj2Gz8daNc43TSW7HtKv9Rmt63vre7UNBcRTKe6MGrwJZRkjPNWra7ML7kkKMO6nBFK4WPfAoakMZryWy8Y6xaY8u6eVR2lAb9TzW7afEzadt9Yqx/vRNj9D/jRzIOVnerESfamOmJ2AHYf1rDs/G+iXijbeGBu6zLtx+PT9a2ku45YhcxMkyNgBkYEH8RTEWY4wOSOac+NhpiXUbdQV/WnMyOp2sDSGV2plPK4FMxTEA60uaTFLigBnc0hHIPvT8YprEBevcUwEwTS7R3pScUhYYoAOM0EcUwtzxTSxoAVlXBzVWWCJxyoNTGmGpsNMxbvRYJpVcIob1/zzUIXVLH/VXDSIOiSfMPp61ukcj60MgPGKLDuZUXiJ42xd2zR/7UfzD8jzWnb6naXg/dTIx9AcH8qiltY5Fwygisy40aKQllG1vX0o5n1FY6AAZyrYP5U8Tyxn5huFcoP7Usf9VMZEH8MnzD/Gp4fEZT5bq2ePHVl+Zfr6iqUkLlOwjv4ZV2ElWXg7qsQEEtg5yO1c3a6jZXWTDLHJu5+U8/lVxHZG3RSlT6ZxVXJcTUuBgj61yvjfRbW7tjfXE8ttsiAE0DDc2M/KQSMjJHStiXUJlQ70Vz27VXso4L+QXOp3CSyg4jgYYSP8+pqr3ElYwPDOmW2n6WWtmuGWTaS1wfnY/TsOa2D0rM1nSLue4+0WswBA27DxnHcGsr+1NT03C3kLFR3YZH51LZVrHQN8koIzhuD9amu/kgjiHV/mNY9tr1pcn5iY29+RV4yiVBIrhwOhzmgBrHynWQcY4P0qtONniCCUcCSEg/gw/wATVvepyrjg96zr12EtjJnPlzGNiPQqcfrj8qEJ7Gpt/wCPiP2zXhevXVzc+IJxduWEUjIB2XBr3UHN1/vp/SvH/FGlN/b15Ig+++7H1GaUyoPucheXMmNseVT1HU0RR/uw8pBJ6CrE1my5V1IzVSeJ/KC5JUVnctoSSRWU+WeemRTo4JGXMnI7A02xVBuJGSD3Na1raXF9crb20RkkPbHAHqadySlZ2knneXEhd5DhUUZJPtXU6LpS22rRrfRgyjOEPIU4/nXZeFfDlrpEfmyKJL1usjD7vstY2uJ9k8Sq44BdT+fBpwfvBKPutnZaNOkUiFyNhDI3GeCK2fD9wsV5IxUE+UxGfbr+lcpYyFSwz0INa9lva8SONwrSHZnPrx/WumWqZgtDsbfVItTWe1JTzNuQq88dP8K4PyiC8bMQVYrj6VkeBJzaePZrZ0kyUkikcktgg5GT9VrodRj8vWLpRwC+7H1rjnGx005XukUWwoGD900/exGaiP8AEoHenAYHWszUefmGDSAAUIM9D+dNOcnJ4oAeSO1BGR2/OmheOuKQnHXmgDwgH3q5p/lG6XznVU/2jiqANOz8tVYxL2qNGb9jC2V/vA5zUAeoc0oNIEThvenA+9VwalaUMgGxQR3Gc0DJA3NP3VXVuafupBYkLUb6hLUySYKPenYRLJKFGScVG8hfGTx2FVMmSQE+tTseabQD1YqcgkH1FeteApCujs029mbHzHnP9a8iByRXr3huT7JotunzDIz904/PFc2IfupHVhlq2dbNKiqgB29eoIquJVdQrMCCRwDVRrkNjJXGM9alR0keNcZByT71xtXOxaINQ021u0Y7Aj4+8OKwbvT/ALEu0Bx265zXQuEIIQFcnHBIqWe2WSFgWJXGcEA01KwNX1OUEGIl/eHOOcr0NM+2NbkpkMWOMg4/GtO+sJ4Iw8SrKgHPGCOK59FeeQlkAySeDmtoyTId+pemuC6FXUht3cg1BDjczHPHqKXYzruYNsHPrmmj50YKwAz0JxTAikIZ2IwfepLf55QGyVAPAJH8qeIgY8hcnjkDNXbK1hEbmY7TtGPmx3NDArvbRhkAOOp6DOfrUcocKUO0gn0wRwatTwxRsGSR87TwTn0qoUmklBGwgLnmjULplZgqLs2Heehz2q7J5LQJGpCP3Yg46VBLFISDJtXg4weP6VGSI8Ln5j0yP60CaI5kCgDcGzzkHNMgVXlw4JA54p5GT8xUk8cVJDCrSd1x3HegZDKdroVJwCeM1OWdgjjbgE5zxS3VuY5R8xOVyO9RqHK7A3BU5o0DUpXs/mr0I25HrVMDn6VavF2IFxjA9evNV4QxkXapLEgDHNQx69SV43zypAHqKTa6dAa9aii8U3VvEkluoGPmV4o8AdutZd/4XuVtGuNSt7eMk4BjKR8noPlH41r7J2Ob6yk9Uebtlj8wB/3hmmGGJv4dp9UJX+VdZY6HaeINaFlp08VvaWi/6XdSSZEjn+Fc/lkf4Z2p/hom1jFqsIb+EZVgfxyP5Gp5JI1VaLPNjE68LPJ/wLDfzqN/tMeCGilHoV2n+tdnJ8O9dIZrcW1wo4+STH/oQFcxe2dxYzGC5iMcoAJU46EZHT2pardFqUZbMqxXUvnLG6NGSOCHyK62y0K5vrgJYzvxjzWlQALnPTHJHBrkUBa8i+h/pXpukx3kAkgAKecRkKAXPH6dep6fWrhYxqtqxiP4W1Xy3mxC67mUsHxk5Ixg96z5dPu7J44rm2mSQgMF254z7Zr0jSXiXUrS1kkMssaNKgXlEJJyS38TZP4Vhsgl8S3rsWZi5XO7B+8MYPtWigpPUwlXcDj2ji34eTyzz94YNVpU2sfm3ZAwQa9F1BcWjJLKZhsORNGGyccfMOOtcdrd7pek3ksM9gsju+5Qh27VBYYyP88U5UezCli+daoyfMdcKDwAeopZJSTkjk1FHrWiux823voAc48t1kA/PFR3eo6aDGbSWeQEHzPOjCEH2wxz+lR7Nm6rRJQM9ckfSmbUIPb9KhGo2+cbzz3wak+0QtGMSKc+9JxZoqkX1ElAGDk5+lNVNy54qYhGwCFb8aRUCggZAz/hUvQd0yvsyANvemmNCWyo6dxVvaVA6Hp1pu3I6UBYo+ThAVJ/nTXhJORjHpir2xWOMce4xQYRu2gnoO9O4WM7ZtABUn6UCNOexx6Yqyy/vAnWkKbTgj9aLk2KbApGMN+uaAGZCxxVt4l2KCPzFN8n5Dg/kadwsQbST93NLkqBgkc1YVCppCpZRx+tMViDewBPB5pwuniPO4fRqU7ArAjB9cVXnJVhg5+tFwL41BgBuIOf7wp4vI26pj3U1SKsyJnGev6VCyEAkAjmqUmiHBPc1lmhbpJj/eFO+Y/dw30NYwZgDyaPOZCf/wBVWqjIdNGszMOoI/CmGTiqC6jKnBY8evNOGphuHRT+lUpkOm0WWkHrUfnAd6he5tmHVk9+tZ186lAVlDDPQVSkS1bc05L+FOr846DmqsmqE8Rp+LH+lUfLZgm0ZGOvaniNQx3yAAdl5/z+dFxWLEdxNOJd7n7vAHTqK19MjDMM81k2rIrPhC3y/wAXfkdq6fw7CLq5jQooB7KKQ9jrtJt1FuCYx16kVo6jAjaLKPLXoe1OtbKNY8Feh9TVy5gT+ypOucHuawndM1Wx5LdK0F8cZAPap7e9uLdswzyRn1RyD+lSa2qiUEJgg9RWYWym0j8Qea6IPQya1Ots/G+t2qBTcrMo6CZAx/Pr+tb9n8RwVC3lic92hf8Aof8AGvNlfAp4kqxWPZLLxro91gC8MLf3ZgR+vT9a3re/huE3xSRTKe6MDXz/AOZwKmiupYHDwyvGw/iRiD+lFyXA9/8AMRvVacNvZga8XtPGWt2hX/TTKg/hlAbP49f1rftfiQ4ZReWCkd2hfBH4Hr+dVcXKejsDUMmQhPpzXO2vjrRrhgv2l4S3QSpgfiRkCtqK9t7tT5M0MoI6o4P8qLisWiSaaaUOp4ORSlQehB/GmIYaQ9KcVNNIwKAG0xqeaaRzSAYf606grhTTyB2FAEZXioytSmmd6AE8tGHK1WlsIZQdyA1Z3bTTjSsirmDNoMDklAVbHDA8ioRHq1lxDceag/hlGf1610JGHHvTWQEUrNbBdGQNalgQfbbOWJcAl1+dcHpVq3vbO7GYZUf/AHTyPwNTzqkkDxOucgY49D/9c1i3GiwudyAqw7jrQm+oWXQ20yp+V/wpSwk+SSINk+n9K5oLqlkMxzGVB0WTn9etTW/iIxti7geIj+JRuXP8xV8yJaZbu/D2n3jkovlP6x8fpWNLoOq6cxe0n81fToa6ePUbS+O+KRCT12N/SpvmPAII9Ka1A42PXrq1by72AjsSRitGHU7O8UAOAc5w1a09rFMpWWMMvowzWPdeGLVzvgYxN/snI/KgDSilZp4mZsgEAfSuP8UW+zV2YD7y/wAjiuhtbGWzKBpWbB55461m+LlAuYZeOcj9Aab2EtzlzaJKpDID9RVOXw3DdA+WxjY/iK14mVqkN1b2a75pQgJwPU1na5VzmrbwDqsmopFH5f2eX70wbhPqK9S0PwrZ6PbLFboSxHzyN95jVLw5qsV+X2AqqNtG7qeBzjtXYrKgA5AxWcro0ik9Sn9iCLyBj0xXn/je18q4jmTI4x+Ir0ydwQea4TxrH5liGH8LURbuVJKxWsJvMKNn76Z/TNbME3lypIOqkN+Vc74ceN2sBMSIy4RyOwziurtrEvLGCwVWkeLdjPI5rturHGkd9Fa2inzYoIlaT5iyoATnnPT3rjPFMbQ6wsnTzIwT9RxWm2vGz02yLSRIGiAy/UkcHv7U3xBZyapFbXUIUMoJKscHBGRj864604xXvOx0U9GcxgORjv3zTSQB2Jp3k3LSbFt5NwO0gITzVq10u9nZ08oxEf8APRSv9KxlOMdWzTqUlJzkfpTjjuatXOlz22dzRyMCQRGSxH14p1hpjX6OyTRpsIB3+h70vaw5ea+gylvX1/ShmBHGa6a40Syg05fMlTcH2eaiMd35kD/GubljMTvEVbgnGRg4pU60ZtpCueAin57VGvWndzXQZD6XNMFOpMY4GlzTaWkMkXvSk0xTxmopJDnC/iaLBcfJLjgHmoOTyaGGBmkBq0SPjGXFSE/MaS3UszEDgCk7mkBPbAPPGhUcsOa9hsWSOygQMBhB1OK8m0ePzdVt1/2s17HGp2qByAMcVyYjex24Ze6x6vjryc/pVj90hR1RQ4Xlhwfxqsqr3TGcnOKfDCjO2QwIwOGNc9joJ2kWTA5Hfhj/AFqeLeUI84gcDBFUQCshG87R7CnI84kQEo0eeRgg/nUtFIvuJMEK6P7EEf41A+l27uVe3QuepVhSh8EsoORxtJ/+tUxnO4vtbcOecc/lStYLlI6NaSRqu6WIgY6Zqk3h4bSYrtSSScMOa6Hz14HHGMkipYZRIqqAG4HQ8U1N7COLl094CzuykqcAjqKhhk++sjEqT1OTXUahaRzICFUZ68VlpFHbqVCEc84P+NaxdyWzKuFcyBldgAMDIGKWF2XcSo6AY55q/KiTueSDnjOD/LFRtGcPwhGQOuO30qiUVpwCgDIegIw3SqFwpIXaGyMkjB/z2q7K7Q790ZIJABDD61Yt9ssL+YCDx17/AM6Nh9DGViCeT/hV2zgEquwUZBH5VJcLD85VlY/3R2qvbhi7bcjAGcHGaNwRcmhXCqjNlvlY5qndRNaXWxW3EgHpUrOwc43AgAdc/wA6etv9riMrzAPuwMr6UBsY2oK3ykj72P8AGpdFiWTXLBHIVWuIwxJwANwqPUC3n7HIJUgZH0pLPUl0i8i1Bo0kFuwfY/Q49aztd2G3pc+g5dTsLeIyy3tuiL1JkFeQfE7xpBqiw6TYjMUbeY8m4HJxjGB069+a4vW/G+p6wZfNmjUSfwxJtCr6A9h9PxqHwl4bn8T65FZu0qQ8maZVJCL+APPau5JRR5rvIrpcSx24j3sEznCnijzn27suR6ljXdab4H0SbxpfaK95OLK0gDCV3VWZzt65HueK622+EWgTwuPt13M5PyOkqnb+GDQ5K5S2PHoNZvrF99pd3ED+schFWXvbnUMXF3M80pAG9jzgDAFd94s+FUGlaLLeaXdXDvHgmGRQSw788V53agi0jz1xWVX4TWhbnZYtF3X8Qx6fzr0ELeXmlNN9p+ywTnYsMJwxPqzdTxXCaWqtq0IY4UMpb6ZNehf2nHFABHb3E0Fum7EUfyqOg+ZuD0P8JqIbF1tzR8N6f/ZdxDPPKrKLUJGBks3APCjnrWvpwsLW6mMsdtHM53EXEoEhyT14OPpWT4X1X7Zql3GluqQparIHYl5G3BTyx7DPTFcnd6/BoNzP5mZLgnJjLAnODgsSD6/WtYxbOWTtbQ9H8Qf2JaaY1xqAS3RsBXV1O/nOF55/KvD/ABxqGn6hrgn0t5zbmMf64AHOTnp25rL1XWrjVLp55WG5j2GFH0Has2ZvuZJJ2/1NaLQlLyHA8ZpynPFQgnb6VJG3NDLsSsMLUZJA6mnsw29ahJB4zxQhsmS5kT7rkVMuoXCDh/wIqvFF5jYHHcmp/IRRk5PFFkwuWI9XfOHUY9RU66vDnBVhWbDAHLluABkZ7mozF85GccZwKOSPYpVJLqbseoWzgASgH0NS+ZHI2VKmqFlp+nNB519fGPH/ACxjQs7/AI9B+NUrn7Os4+z+YqHPyu2SPxAFS6cWUq0kbZRTtI6+oNBQsSd1ZUN2kNuytGzzFwVkMhwo54x+XNI2ozKwKgAenWpdJlKuuqNRt2FHHHvS4Gw7gQR7VnpqmQN8XI/unFTpqMEh2nKk9zUunJFqtBlkgE8Nj6GoQW3hTj8qf9phJx5qH8ak+RlUgg+4NTZl80XsyFkzuGO/rUbQgnlaskfKcMaTJD9j+lIZUZWGNpxjtTcPjBHerx5IJHWopFULnoc/SgRTK84296jljGG9cVcWPevX86ilUq2CAc0xWM5ULKdxP5UyZDGcdc9M1bljJ/hqrKDnLE+1WmJopzsAMkYNVg58wHOfrVuVNyZzVMDEmK2ic8y8zM4QsSfl/rQDSlcIn+7/AFNCrmkBas+ZWH+wf5V3PguHdeKT2FcTZL+//wCAt/I16D4IT/SP+AmmtyZbHbInDfWnzr/xLpeOxpyjlqJubKUfWsqi1NIbHlutpkMfQisPAHeug1v5be4bj5cHn61zaXcbDlVP0NaQaSJabZKMjoaUZpqyRMfvFfqKftDfckVvxq00yWmLuNKH2mmlXHUflRn2pgP3kk+/PU0u5jUZOKXdQIlz709JHjdXSRlYHIIOCPpUG+lEmCCO1AG/aeLNas2G2+kceknzZ/Pmugs/iNKpAvLFGA6tExH6HNefhwD0xmnBxTuFkeu2fjrR7kDdcPAT/DMn9RkVvW2o2t4m6CWKZPWNwa8E8zHenxXb28gkjlKMDwVOKdyeU99MkO7aXCtjOD1oIHJBGPrXiZ8U60X3i+Bb/bhRv6VZh8b67AxO+1cHqGjI/kapNEtM9gyrZAYHj1pecCvMbbx3dttadIDg8okhU/huGP1rRtfGup3D/wCh6NPLCvDOCH/lTsidep3nX2ph61hQ+JZ1iUXWk3wbAywiJyfwzTh4v0jdtlkeF+6yKQf1osF0bDUgbtVKLXNLuMCO9iJPbNWFnhf7kqNnp81FguiV+dp96AcikByB9aTGDipsO41jgn6VGQMVJIKYelNAQsoINVXtUl3BlBzVxulRgYP4UrDTM7UtBiLpKg2llDKw4qgJNXsm+Sfz0H8Mgz+vWuuKtPaRA9gVH1FZcseHIIqY3HczovEwQhby3eMjqV+Yf41ow31pd/NDKjeynn8utVZbWOQHcgP1FZk+iRSuWjyrAZyOKrmaFodCy5PBzWPr+j3F9YDyEy6OGx3xgiqkCatbELDOJV/uy8/r1rSTW7i0Hl39nLEO7gb0/wARTumGxwUkZtJNk0wRumCjVFcGO4geMPuY8r8h4PY16Yt1peow+WUhljPXgMB+HUUi/DjSdStjLY3xim67U+dV9iCc/rUvQaRw3h+WW3eUmEoGYbeewHrXc204miDlyM+vFYt94K1vTHxAqXqjr5B+YfVTg/lmqdrrE2nube5ieJweUdcEfhUt3KirHZMr7M5zxXNeJEMmnyqeoGani1xNvyPj8eKz9TvhcW8g4OQelCQ7nMaPMRC65/1cmfp3rv4rrEcrqchJo5xj3615xpziO7njP8QB/Kuys5Ge1UREHzISG57qf/rV0R2OZ6M2pbPTrtIW1Aw4s53wJWxkMQQM/UVZ1nUmtrEiQnB2FGjBbYO3Ge/v61mW0cM0268iM0YUT4GeSAa0Laa31eGSVp0SFcloi4IaPjqMducHGfevCzKD9tdvT8DWD0DSNWjOm3EaNKJkXfK/+1+PtzV06/dnTGulWPaCGLF9u5cclc1xeqeKLaO5ii04xW8cUpjeNTlplJzk+oHofWp52un8NT3U/lzOhGx2i27h0IVewx3/ABzXD9X2k3uaa7Idc+IdPuLszlSmSfNCuMMMdfc5rfs9XspIYhbHEDYDLGOrHHBweteTLkMGbLhuoJDEduOtO+1PY3SmNnEYJYq33gc//WrpdBSjyJmSk09T2q9vLbT7QyS+ZczDdmMsF2fl3rihrSX7szHZt43YAB/L+tUrnxo76TbLGYvP2ksCuUPPXGfpWToun3N5ZTzbFaFicYk2Dd6ZPfvjIpUac6T5ipSfQ80EJB6il8px2qUSp1zT1YP0Oa9i5ViEQvjpQY3HVTVxRUgWlcaRn7SOoNKVwMmtRUB6gU1olP8ACKXMOxm7WYYAwKUQnuKvmMDtTGWncRnXKbQoFM8hhHvyMfWpbr/XAdgKJG3KFTp34q+hBPaxlbWV+PTrVfYc1dWNk07GOWaq+G9DU3GbXhG287XYgwyAa9WEYGTgYHPSvO/A1uJdSaRlB2gnke1eheWNrAZAI7HFcdZ++ehQVoIXYSg6jjscfyqzbRxiIszOpLHpz/OoTGMbQzDHv/jUluJBbgl8r7r/AIYrJGrGTwDzGYS/wjGVqKIzblXKEDJ5J/wNPlaXzGICMCeB07UwOd2Gi5x2OQP5U2LUeZnjj+ZerD7pzUscw3cbsn0U1WmDSqqxoxxkkAA0lmpiuEMq7AezA8dfak0FzSUod7OwAAJ+tSbYJIgcgD1pftILBVYEZHQ8UyWKGUsZIkLYOG2jNTYLjPJyQij5fXOOMe1ZLxukbM8jbWJKgjPetuKSGRWRQNi8Hax4P51jakoYeUsjhVGB0/qK0hoTLXYyTcuhHKvk55FTxvISN20biTjNQi2jIUGX5sDnHf8AOnRblKjejkZJwxB/LH9asCWREmkw6sMHgAjmq9yWbKKCoB6MCM/07UguUIWTeE5zhjtOPao5phNM2GAB4O7g0xJkTbtuByO+DVq1VViYsoJqJS2QQ3y/WrUZXacKoyTyODnNIYjQKyM5ycZPDHtVbzJY1ADZVjwMZq0zqkD4HUnB3HPJqusQEafOWOM8jp+VMRjXbF7pieu454q1pmijX7waeZ/IDqSZPLL4A56Dmqk+ftJJ6nJ/WrFlqU+lSSXVvcmCURsA4A545HNTHWSCekGzHi0a2VdMWFvNuLq5dCX4XYHCrx74bvXrngaOfTl19/MTyYpGSExqAoOSeAoxjkfSvIdBvrq51zR8OxNs37vgfKQzOeD15Ne3eFVgsPD8sM0E7iecknKnJwD6+1dM90jht7rOa8IalcjxZ4hvFcO8syo7soIPJ+mOgr07Twt9Zia4hhLkkZVMf415l8N7KxvP7W1C7Mil7sqhXfgcZ+8PrXp1h9mgg8mC+SQAk4dwT/SlJpt2Ek1a5T8SEaf4cvLiKNpdihvKYkg8jsa+fioBIC4Hp6V9BeKrie28MX08ceZEjyndc18/uzSOWPVjk/WoqfCjfDr3mwtZfImnmxny42YfgprV0v4oCysUtLnS1aIIUJSTkgk+v1rG5EF5jurKPxXFS6h8N9VttJOpJcWksaxmR4iSHGOowAf506aXLqFZ+8bGo/EiF9KcaPmzupRtkJiG4rjH3+pPAHbFecNJdXc7Es0jkk9a0bbwxrF/ZJc2enzXMRzkwjdjBxyB06VnSW08UjxPBIsq/eUggj61tHbQwe+ojLdocPFIPqhqc3FuscYmSXzCoztIH86ogFfb2qaaGRtjCN9u0DdjjpTAnjurZWfzElx/BtI/WnLeWvq6/gKqeQGQvgkDryAKkhhVgHHyfTn+dHKgLa+S/IeT8V4/PNKI4z0lJwewzVSZAAzHk46nmm24IjDA8n3p2QGrGFhyVO7I6mkjumk3YIC+1Z7SuqdcfQ0y3uHjQ8Dk+lIDULc55+pNQxvmRiTVdrv5eVH4GmxTDBJBFAF8uAKhJLPn0HHvUQlU96UMDnkUAPLYHWhm+VfxqMtSSPhV+hoCxIHGKN/FVzJ6U0yH1pisWi4HekE+3oSPoaq7s0mTQMvrqEycCQkehOamXV5QPmCNWXgml2mpaTGm11N+DUPNgaQpgKwXAoGqQEYIYc9xVK0G3T5MnrIP5VVOKXImUpyXU3Eu7eQ4Ei5NK6ow3ZzxxzWLaKDexAjOWrpb1ANNtdq/xyf+y1nKCWxpGq27MzZM9iOnpVOY7ieKtSDrxj36VTnJXkGoRqyo6/KciqbACQYq++cdjkVRYHfmt4GEy7jKp9P6mnqtIv3E+lSKppklmyGLhfof5GvQfBA/f/8AATXA2gInX8f5V6B4J4uPwP8AKqiTPY7f+JqST/USj2p3/LQ/Smv/AKuT6VlU3NKex5prS7rW+H/TLP5EVwvlsF49K9A1VQ32tD3iauJMBC5AIzReyKiVwWXjkGlM0g6kH8Kl8s+uTTTHmi5Vhy3UijPP4GpU1IkcnI/2lqApxUbL2FNMmxoreRv1UfgaeJIW6My/UVlFTspo3jkEiqUmTyo2QA33HU/jSEMOq1kedIvfP1FSJdOp4BH0ampC5EaRb2pN1VBfNnls/wC8KeLtWGCg/A0+ZE8rLG6jccYqISxHuQfelHzfddT+NVdCsyTI6E0bgKiO4dQaYWpiJ9wz0ojnkhbfG7o3YqcGq+/3ppfA7U0S0dNYeMNasRhb1pVH8M3zD8+v610Np8SGbC6hp6SDuYzj9D/jXnCTZzTxKP4ulO4rHrlv4j8I6iMTQW8bnr59uB+uMVpJofh68G62jUdw1tcMAPwBxXhxuUXkuuRVuy1Bo5VeF3V1wQVOCKOawuU9iliudDG9Lh7myzhvNPzx9s57j9RW1DIt1Cs0RyrV5VbeI/ETJtjaWeNvlKyAOG+pPP61sx+KLjw5Z2jXVpI8dyCTtbBUjg+v9Kq6aE42O8dTio+1c7a+PtGu2VWneFjxidMfqMit23vrS6XdDNHIvrG4b+VIBW70rRlQhx1GaX5HPysPxrVltFNk0nB2xjBpXAg01fOt5I+6sGH1qPVbLbiZFwp+8PQ0umSpDcsJSVVhjPoa2ZIhNGykBo2HUVlJNSuhpHINE2zdjjOKjjA85d2Qp4OK6iKwaKOQRSY46EZDVgpDi4xwRnH1rRO47CeVZov7rez56t2qzLCsturEA8YNXV09LmVYowkZPcAmppdLubeFgyq654Kn+lK6ZTi07HOTaDp9037yFYm7Sx/Kw/EVlNpepWrk2l6ZcNhVlGD/AN9DmuqeGSM4dCh/2hikgQI8jgAsAMe1MldjIs/Eut6WGa6spJYwdrybN4/76HNR674hsvEOj3Mfkr9o8o+VwGw3seorudOj2WEJ/vDcfqTWVr+j6I1rNe3tnHvVc+Yg2uT25GM1LaLVzxVZJYiUfKspwQe1Ti4ZlIJ7VXlDbyzFiSepqPcQaLhYigGNUQ8fMCK6nTpdhQnkKSMfWuVZtk8Mno4rpITscEeua3pvQxktTYguRHEhLkYjdCe49Kt6Nd2P2q5uI7gWULnMsLYbcOflU+hB5/8ArVjLON25lBJYn2+lVLi2tI9QjIhb7LIjGT5SQhIOB7AHmuHH0+dKwQdibXdU0O21xLqws4wiAMfLOC3p14HI9O1WNR8XI00gspnmtnt9pDBmYEjt07kD2rN1fTtMEMT2hJQRqCyH8DnI9ar6dpF1f2k1wjxuYVOxF79sHjH5V5zoxSTerRqlJuyLGn6fM6wLDZkWysWmnkjKAE/jzj/PSsbVLAXOu/ZtPYsrE85HzY5JGM+lb+reIjfC3hSJkKKQURsx4A6f59ajtrdbYRXCRrEzkMrSDb+p/pWlOE2uZ6MTV1YsavpOlaVoAluNNVQJI1zkrIx287cjp1NZvh7UbOyhuJbi5njjIIjQ5IUkcMBnqK1tVuJfEFtb24ErzryY0YkRgenPJPvmsyXw2TN5NzPHAFx1TPGOpxzn2xUwsoWm9RNdUeUEjAqxaD5c1WfAOByAKu2w+QV6TNLlgdqlUc0wDpUi9ahjRIBQRzSjp1o70hjHFREVM1RHgGqRJm3GDM2eahKgdMj6UySQmRjtPWm+aNwHIrdbGJosxS3jXefXmo/NcdGH5U2ZwSgz0Wo8+4qWi0j0bwBAXhnmbGcYHWu0KBUzlhz16/zrmvAduY9FDE/fxXUSRbgIwxy3Q+lebN3mz04K0Eiss7MzLuPA4ytXNsiQ7QUIHsRVdbJ4juaQP0HTBqzKz7QAByP73/1qkZUDvtyVHJ7GhZwd4KOrA9cAjp7Uj71AGw89+KSFwAWIYFjycGmMmt5QrnLbTjqVIpzXSu/ll1LDJGDzVeN1MknzKOnU47VIJN8jdCAmBjFPoKxNGytKIy6uw5KnGcYNWP3b28i7NuRjjjvXP2mlwwa9JfIp3yxkHJ6dKtX+q2NjEv2pygY5CJksfwFO2uhD1Wo7TNOj0qKaK1d9sr7txO4nPHORTNXinFo5hZWk25XcO9MtNTs760MttMWAcDoAR9RUc9xJIQibQCR1U9PzoV76laW0M/TjOltm8KPMnO5RiphAyyKVHzDng0ku5sgKpyccEiqrXzw6ibY2s5G0lpONorTcnbQvJJKpAO5RjkEAj9KovbO8ikqwB6kg1feQhCSh4BH3fb2ppmVASWwQvQ5H86QWJIAGAjBUFRjmnNGnlqwUAkZyBiq5YgZJDADjgGmsBHHtAPAouDRKEjNuqsWOB2aqW5l2qGGPcCpCdkZKu34nNMJIiZiP4Tz+FFx2MduZeeoFXkFkPCuvm68oyfZ18lX67t45H0qlty7n6Vma7cTJaeQkrLHIP3ihiA2PUDrRT1miavwMPDUqprMRjXZILaRUVVLEyGIgYHqSa9I0mDxFeeHLy6tJMxQxuCXX5s4yevtj8q8dj37d29vukAg4PpWpba7qtnaSWkN7cRwTYV41kIDfUVvUi5WscsZaHofw+8QahouhXEUFtC8PntJl1bJJwOor1jSbj+3NLiu5raMRsMvj5lPsD3HvXzBbapd2ghWDaoUksWRW3c57iuotfiVrtnZJZxtCI1AIKFo+f+AkD9KTjqLc9t8SR22neHr+6S3XCQ5KdEIyO3T9K8CPLE9PaunTxze6v4Wu1v7yWSUHyiCECSAlRwAA3GT+WfauX5JNZT2NqEbNjoE3rKuC25gML1OXUYrudT1q20+zbzZxOTlRb2pyQfR36fgMfjXCZkXTLryk3O7KgHf/AFgPHoflrPHiOeWwFk8KCPlgVLFgQOuWJrSnG6uRV+Kx6d4TvXb4b3IlZFWNBHGANuAeeT3PNcz4PQt401KU4wkJHf1X/CotI8c2+k6OmmRW0oBdfMa5VZFJAHO0YP4ZqhpXiybStS1e+h2M92+whIsKQdxyM5wOnY/WtIpq5jKN2Ur/AMStdXDi6s7ObllBMIBA3ZzkfT9azdRnV0aRIliXACovQcdv896rxEfaHLHcRjqKdqDrLcPHH8sYY4zWrFFdCqw2WK8/e5NSwKPKjVRknt70wqjKgd9wA45rc8Kz6Tba9bS6upayQ5kCcsPT9cVDlZaFpXZiXSsN6BcnFQrlYwGwCBXQeLbnS7vxBcy6PHIlkxGwP7Dk1zzM2cAAfWiLuhNWGvllAwcH0o2lVAGAKTB4yR+FPCgEZUkVQhny5wTn6U4EAfdx9a3NT0F11m8tdNid4oYlmJ64TaGJP51hswPXBGKdgEPTkjr2pwbAJwTTXMZXhTmgHIyOKmwDlLFvQYqYhCqbm7Hv71UYHPLnmpiMRx5GTg/zNAxSi44JNNVQR1pecZpeq5BOfpQAoRfWnBQBTD24z3p2aAFxQaMgClyACSDigC9bH/QmH+3/AEqtjipbVs27getRknHpSAksv+P2E/7Yrpr4H+y7XHUSS/ySuZtBi8h/3xXUXgX+y7Yt/wA9Je/slKexUPiRlsSM5A5HY1UkAb+E/lVtx2DE+lQSqydMdO9YI6WZswC9CRx0qkRz1zV+4z0IzxWeeowK3iYSNCMfu0P1q1EvA4qvGP3SfU/0q1F0FMktWyjzl+tdx4L4uR9DXFW3NxGPVhXbeD+LkH2NXEzkdv8A8tPwpkh+WQe1PP8ArB9Kjl/j/wB2sau5pT2OA1Fc3FyD/wA8n/ka5ADHRsjmuy1DP22YeqP/ACNcdkcZXjNS9kaw6jdvfg0eWrdV5puTtXBIHepAwyMEVJoQiLOQSRTTADnp6VYJIPTtSFlHX+VNMViqYCAeOKj8s449fSr5A6ZpFXC4B4pphYz9h9AaYyD+7itEoDztFRtEACVBp3FylDb6HFMZTjpn6Vf8oEDn8KGgGchadyXEz9zDnJFHmsB6/WrLxjgdD6VE8ZI61V0LlYgumXpn8DS/bj3IP+8KjaLB5FQupHY07ktFo3cbdV59jUMlyoztYg+4qqydO1RdG5rSLMpInhuJXJBc4INP2uwzyRVe2JMgHQZ7VZA9ecUCQqpnqVH1Na2mqgmi53ZHQfWsoVr6SubiD/eI/l/jQUd/pyyG02qgABz1/wDrUniVY59ItYiP3kTS7v8A0Lr+FaNlFsgYY7VQ1CNWkyXJJuFXaem1lxUR3Y5bI4U2653Kxz71Nb7rebzElIOO3FNZCrEc8HFAyK2MbG5beKNWtOBeGRR/DIN36nmtqz+IMsY23Ft25MLYz+B/xri95pjc8g0XA9SsPGelXR2z3HkH/psuP1HFdLY6oHQPZ3Syx/7DBhXg24DGQfyqdZnXDRSPGfVTg0h6H0Tb6itxxLHhv769vrTprGKZd0QUnOdyf1FeG2Pi/XNNTZHqPmR/3ZwH/U8/rW5afE+6jQrd28ZbqHt3Kn8jmlYdz1q1Iju4wWBIOOK17oA2759K8x0X4maPcuUvLlreTqryx8Z+orsrXXLa/hzDcxXMZ7xSBv5VNrFOd3c17dlmgXcqtjggjNQ3NjBcSIrxgKwI+Xj3qCG7jjyYmjJP8BOD+tTi5eSRC8ZRQepoDqMitpYosRPuVX2BW9B71zXjKZzZxQ7WT94d2enp/jXWR3Eax8sF/e9z71z/AIzCyaXC6kECQ0LcaPJbiAgSKVJAfg+3NZ8sQU8V0Vyi4f3rJuIgc8UuoGPcKRC3sc1vwvugjkHcA1jXCZjcegrS0tvM02LPYFfyNbUzGZe3YP0Oa7Owslv/AA2ku/JjypTOAQDjB+uP1ric9fdf5VqWOsT2kD2iSBVmbIycEcc4PXtSrJOOoouzMi+spLae5jntpQI+GDDKYJ4P059TVCO9uHvI7K2XcekaZ6ZwAT26+1ekXFxb3EEcV8uyGQFlJYfe+h5P/wBese+0/RJJLO4hgkSW3LZdGAdwc8HOF5z6V4ksTCMrWN+tzIVoLDy0uVErSSKjyYClMjjceOM4x9DWv4lSxW0yZy7xR/LCqAgDsMj+tVbnw+Lm1l+ySPFbiRmcXWAwPUY6fL/LmrrWVu+kCcyGV2i2lgScqCeQDztwe5rCdZOalcXUydD1PT9JAu7otNvAeOKNw5B5yGI4H0NZGpeIbnULqWMQ7YxkRDywpQE57U5oNPitnFpa/apIjlEimODnG7OOScfTFV9Y1a2JhjWFIRGhV02lvm7rwfukjr6mtlBc3OiXscBHoV/Nh2jjiB7TSrGfyJzVttNubKNRLEQOzKdyn8RxWjYaHo2p65Hp1nNquoTO2DNBEoB/2sE5x7kirusWY8L6rLY2OpxX0YHzFVyAfQ9Rkexr1pFXM6G1jtoxPeg/NykIOC/19BT7u1jaEXloP3LHDLnJjPp9KoSyPNI0kjFmbqT3q7pd4LO6BlUvbt8ssefvL/jUNjtcqClFbviDQ49PEV7YymfTbkbopO6nurehFYYHFAJ3EbpUMzCOFm9BmpjVPUW2Wbe+BTW4pGK0rFs5xSI5Mqg4602nQDMwrcyRcc5ckikRQzAY6mpCnPOOmals4TJeQqMElhx+NQ3bU0irux7B4bga30S3AYdOhWtcCTzQV2k496r6dG8WnwJtUkKOM1bUyGViIs9B1rynuer0EaOQbQVGGP8AC2f8KfNlYDhCSBjtTJJ/KlTzAwGD70vmxy7QGOWOOVP+FC3EVZHOcMrAdiVP86RVUwj5lzjpmpJZI8NhxgA85p3ymH5SM9Mg0wuULi6+zWFzKpG9UZgS3oDXHw+I9TitxdSvZTKxGUYDeeewFdhqdrJd6VNbRgZkTGcdK5G68MXVoLaa1VPMQ/MGyM4Pet4ONtTGalzaHXWyCbY6ZQFAw59e1czrCLY+JPMvWuDbSKCrou4qR2rqrNG8hWZjkKowrHriuZ1LU5by7kS1VZVhJQGXksR6YFKHUJ9BujxpLrF1NbJLHaSAFTIuCxA649zWlqUslhAslvAbiRmAwflA/GrOhSx31nE8YVGwQ6kc5471R1DX7azvWtpracqrFd235W+n50tXLQeijqSyO5UPtX5sHCt0P4imuVKgkscnPP1FWPMS8tI7mGJhE3I3YB49q5nXFna4hRQ0kZBJgD7S3vTir6Dk7anRNOjAgZBxjoTRKVZCAwOR61g6DKvlSxoZBsfBSQ52ewrdeZWQgsMnHf3oejHF3VxCwkjIYA+nHFRSoAzhVxketS4DBVdQRkdacyxk4VSvPO3igZXnA8rHIJ9DVWacqjqjEjGOQKvsiMO+D71RmgRImKk4JHXH+FLoFijGMu59+KxPELL58SFgDtJwT71uoMA+5JrkPFLltUxkfLGB+pq8OrzMsQ7QHpgIAHGfr712c3hS0TwJDri6lbtOzgG3z845xj+teWBiGzk1pW/254NyNKIh3B4FdE6d7O5yQne6SNqy+zi5UXJlERXGUTcQe3BI/nVUkbm+pAzSQaTfTmdpLpIkijEm6ToynofxrOkmvLdYzIq4kXchI6j1qlG+w5XSu0bFjdTxzxwRyusbv86g8H8Pw/StvGCTXLaXdPNqMCMi/e6iuqPeuesrSOig7xbFMTTaWI1Lh5ZlRSpwckPjn61R8R+FNR8MzwR3kJiMsZK/MOR0PNLql0LTRrckspaZSCPZT/jWdqXiW71iSJ76+kuHVQimUk7RVQUrLsRUlG7NiG20W58PSGLzF1lHZiXmRYhGO4ycluMY965kFklJbof50eZGc7ZFP41LaxF7hEVPMkY7UCjJJ9ABWsVYyk0ximRpHKryx71FKGM78dCeldM9jaaYv/E0nZZyeLW3w0g/3j0X6cn2qv8AatHikYrpU07Z6z3PH5Ko/nVsk54ISOSTU0EZJZFHJ4IxXc6fot9qnh2+1qy0zSorS16qYlY8Yz9/PrWRpniW7sNRhl8q18tHDNGltGgYDnHArNyTTsWo2epivpV8bgxR2s0jDrsjJ/lUkfh/WZNq/YLhf9qRCgH4tgVv+MvFsniW+8y3ieztQoXyI5Dt9ye2a5V45QAG354I+h6f0pxegmtS+NHtraQpqOq20e3qsAM7fphf/HqU23h+RiianexN2aS1Xaf++XyK0rDwRqd/4XutZigzHA4UgnDdu341nHw5qBk2mAA4yd7AEDpnHXHTp6ihST2BqxfW+8v7XputX0toDsDyWsIZrhAoCgtn7uAD755rlZvLWaQRMWjDHaW4JHbNbTwSajokylD5+m/xdzETgj/gJ5HsT6Vz+S3GOatEPQfn/Ipx4GcmoTu74pSSBwDTC5IeSOalb7kYPZf6mqvmcdSD9KfNO0YRBIMFBnilYOYkDEd8fjSh+etU/MJPXP404EnmiwcxaMgyOnFBlFVwD6VJFDJMWEaFiqliB6DkmkMf5xpDPIRgtURGKSgDUsWZoZOTnNKRxUenOFSTIDex+lLvwOKS3GT2m77ZB1xvArrbsY0m3/67S/8AoKVx9nKTeQDHHmD+ddldBjpUIHGJpP8A0Famew4fGjFK9ciqlycL8pINaJJxx1x6VSkVmyMVijqZny4xndVBgcir90pKgbTmqDEZFbRMZGnF/qI/qf6VZj6Cq0I/cJ9T/SrKDpVGZctP+PmL/eH867XwmcXC1xNrkTxH/aFdp4Ybbd49CapESO5P+sWo5jhj/u08/eU1HOfmH0rKruaU9jiNQH/E0Yeob+VcOxPIDcg967rUeNYT3bFcK06CV03r8rHIzUvY1i9RY1YipO2SBUW5Qc9vWpBhuMkVJoAwQaCit3pVjXOQTmnYOO3WgBrqWHUYpowM1IV4pFAyP60IRExYY4PvT15HHIpT37/WhcqOxFMBDnI4FN3KXIIII7inY5Jx1phGPm5BNMQ0x7mXDdBTGTchHGc9KmGRkZFRyqzDAwaAKbxggYXn2qNkBHWrRXnkEVHIuEJB596AsUpkyoHBqoyYbOK0D84zgdcU1o1OPlIArWDMaiKFv8s3PrVzHJFVSNt0w96vMvzH61TM0NVa2dGX95ET1WUfr/8AqrMRea1dM+Rz7Mp/X/69JDex6hAuFwO61z+sT+Vc7CQCWR1GevP/ANauig5jjb1Wue122DlpMfMsfH5mhL3hN3iYV3AFu5ht6SN/Oq5hHpitS9ltBdsrzIrsFcgnHUA/1qPyEcZR1b6HNWmS0ZbQkUwxHHStNrVh2qncstuVDg89MU7isVSmOxpOV6D9KnE0LdHH0NO2K3Qg0ySvuOPuj8qT5D1jFTNFTDDQBTuwioGQY57VBBcSxOHikZGHQqSCKs3UZEY+tU8Hu1AHQ2fjTXrLaE1GR0XoswDj9ef1rrNN+K9xEVF5YRyr/EYZCn6HNeacDvmpFxjrSaKue52XxD8MX0MQnmltZB2ljOM+uRmt17rTdYtjDBdwXEePl8uQHn1AzXziCM9a29L8P6lqKiWEeXEekjNj8R3qWh3Z6JqWiXVp5jPCxi7OORj8K524j45rUsI9S022MU+tXd0pXaY3bKAfjk/rVCfnd9ajqXbQxJ0wxHtU2huTbyx/3Hz+dFwnzZqLRnCXtxGe65/I1tT3M6mxrOu0rzxkiqd46w+RcMWDR5VSpweeOtXJVIXdkdjTVAYujNtByM+mRVTV4tMzNKKyOt6cWdgNvIkL4WPtjB6j8e1cXdare2utwwGZ7uETAeWshAk5Awe45/Sr8MzLBcR+a8ytEVQHJ28+/wBK5u60i8Xzp1tpVVcHftOB+NeXGnFSaezLUtD1+9udXuNGbOlCJpAv+sbvn0J54HUjn8qxbuPVrTTGe4RWjh6K+xwVwSQB7fQVkeGXvPFEVu93rBiayfIznf0P4Y+nrXT6xbmaSaKC4mMYTy5pZWIz75z06/4V53Iqc+Uo8uF5cJqbm0j5KELtBwSeMgevPapL20vtOvmi1SN0Zk3AAhsZ5B68fzruLaWx0b7VBJYm4kKq6puQqT65J6YwenFYOq6zb6juC6XAsu4l2CgkD0/CuuNZt6R0JexnX3iex0i2fQ/CavFA/wAtzqDDE1ye+D/CnsK58HJyazrQZmye1aGa9GRaXUdThTBTwM1LHsb2hazFbxyaZqAMmm3H3gOsbdnH0qtq+lSaVc7CwkhcbopV+669iKzMYre0rUYZ7b+ytSb/AEVj+6l7wse/09aEwa6ow8Vmau2IUX1bNb2o6fNpt20E45HKsOjDsRXNaw+Z0X0WqitSW7ozDU9oMy5qA9KtWIyxNbMgukqckD8xWhoUYl1e3UDcQc4FUFjZopJNwATH45rd8GxmTxAjEZAHYE96yqu0GbUleaR63HvWNV8ljgAcEf4inxzouchgcnPymnqVzu2sPqh/wrOZyRgY5OTkV5aPTZYnkjknBXOFHoaliuIRKgV13cnGajtADGeR97HBq4kavIFIDHb6U+oFS6GwL7nH1pHhXBOxcgdcCrVzaoZIQUXrn7oqGeJRGyhAO3HBpiQyOKIDG3noMNj+VZ9y0NjB5s05iiAyWZzgZ+uau+UEbcCw6/xZqtf6fDf2zQS5YYHDYxn8qqL1E00JBcrPZJNFcb45DkOAOeMVycdrqWj3tx9l+zyJI2Q0y5IPtXXWkTWmnRWw2kKvB20LEzn5hGQSTz+XvVKViXG5meHLaSxicuyfNzuPHJ/CqOv2z3fiHTljQsu7c23/AB/CtuaTyZWQpkAjBDU6Bo5pCzxPuXG08cfrQpWdwcU1YgZWij8kRyBQDzkEfzrF1HSre82mVSxGcYyD+db15JJHBOI0zKIyEDDjP+RWRpt1M9uBfNH53Odq4FEdFcb1diCytYrDCRoIlJ6Z6nHcmrrFTGoDDr6j0pSyhxhh37imsRJngE9qYWsKgUlQwGM9fwp20O3QAZ7Eioo2CMdy7sDjIqX5GbcBtxzwSKAGkABQNy8885z+dVbniIDPG7oRVp4wSCWbIGetVb1AsSsM8k0PYaM5OUzipvGkMS+GPDCNapulmkYyDBMg3AYPGfzpkY+XFQeMtO1G2/4RxZLkutz89shckR5ZexGB1FXh/jMMT8K9TJ07w8NW8UaiIoCkKTSmNfLLYAY9lHQdK3JNDZI/ku7UqMryxTn05A5rsrTR7nSNXluFMZuJFCyo0JWNQfmJBUYJ+XnA71cla6YB3t4ZE3B1VpceYo+fKoV4bB6n0rpavqZQmoqyR5CbGK1uUi1BYzArlXeEsdw7A47cVQ1iGAhhDv8AKUs0asvzr0+8T2PYV7NLDO1zJbPYqxJi/wBYsbMyAkMx6deMfSuF+I+lSDfdW9k0VqrqpcIAoPfGPeqitRTn7tjitAXOrR85xk/pXXkfK1cr4bj/AOJqT6Ia6xziNjjsa5q79+xrh17hheKc/wBnWSju7foo/wAa5gowwCCOK6vxYAttZL/00kP/AKCKyrG+hgguPMDtcS7Vj2gfKO5/LtXRTfuI5Kms2ZawSNyFJHtzW54fMtmmpal8ym2tWWM4xh5MIP5sfwq2dP1DRbm3vdNcHcgZdh3ZB7H/AANOtI57vRdajdDGX23KjocoSWXHptcn8KtMjREWmeGbrUbGC6iu9pkJPzqQuQxG0NnljjOO9XLfSLSM77vW7YKc4VDkjIOCfxxxWXpVhqOqXCxwI7xR7pNh6EKMnH4Cr9rBp8Fl5Wq2E8UrFg0hjkViPlIIzx/e7UXV7D8zSW50zT9MaI6tNIJesSSfLIc8ZABAx0zk55xVC4udGtZraWNDNExbKA/Nj5cZAYc53Dt2/GtJfeH7eWzVbaeaNN5mVhjdkYHOeo49qsvrlguVstDDK4ULLsAJ6g44684HuKOVIfMyc6ski3EFnoTKyusjAD7oByMjGeg9e5JqT+2dWmj82309Y9hwPlPyA9Ac9RwevHFVYtY1adlt4beG1VoTtMysgkUdQMnGfXHar0tjqdwu/wDtDY0m2MiFWI3ICoyTjHKNk/zoaC7JpH8VSIyi+jDSDzJIgVXbhV6/TcP1rm9RvtU0/V5FnvGN1B8uVJIx9D2/Csp7m5mJaS5kcsOcsec11HhTwpBrmlateT39tb/ZIN6iZ8Fjz0/IVM2oK443k7Fzwx4jtF8K65pEmmJLdTwSTfbWbBQBehH1x+JrgXlYMcYrd8iTSPD108xEc1+FjijJ+cxBtxbHYEquM9eawMc8U4xS1QpybE81z1q4YI/7Ne5a4iEocKISx3kY64x0punxwy30KXD7IS4DsBnC55NdD47s9DtNZSPQb03dv5Kb324G7nOP0pOXvco0vducjuy1TTsCsXAGEAphHtT5lwUHogqyCNQCDwKdGMOMU1RxVmFRk/QfyoY0h/Ycc07acdKlCDIp+3ismzRIpSDGMUCPcOTU0q9KUDC0XKUSxYx4ic+p/pTiOBUln/x7E/7R/kKaO1JA0X7HQ9V82Kf+zrkQqwYyNGVUAHrk10t//wAgSPsftD/+gisNdXvLieJXnkZMqOWzXRXY/wCJIhA5+0N/6CKHe2o1bnVjDlZUK7TyBgkHrUTvyu1uo74p7ruYgL0HPNRSRKBjBBxWKN2U5kJXO4Z5rKdWDAkjrWpKAB1OPes18dj3rWJlM0YB+5XPrVqMcCq8A/cr9asxjirMyeP5WB967Lw+cag/++f51xiniuu0Jsag/wDvmnEmR3pPKUy4OGH0ozwppt0eUNRV3LpbHGaqduqxn/aryrUo9ur3gPUTMP1r1TW+L9T/ALVeca7ZzQatdTMoEckzbTuGevpRFpbjabH6Uoa3dCSPmz+laQX9KztGwyyA+orUwMnA7c1nLc1jsITztA4qKfPktyRjnilyROeTtqSRQ6MN3GKktGVLqyQTNEyvlTjPWnJq1u+P3m36jFY2pKf7RlA7gH9KdCn7oEjmteRWMeeV7HSCVXiEgwwPcVJjP8NVLABrJQeQO1WyRxgkVDNUNKjHcUx2whIIOATTxy3ysDTGjOGPHTFMHsUxqD7stGD9DipPt8ZxmNh9DWXcPsiyODmtbw9aQ3lvNJfKVhVlSNw2MsTjHv1FWo3MeexD9shI5fb9RTftaHo6H8asTaVZmS3i8+VJZiDggFcF9uAfUd6ik06Wy0mW8hmhlhVyGimhBOQ2339KfIHtCJVDZOAaJFx90fTBqK0m8+MvsRDnkIMD8qsEjaAeuaI6OwpO6uZc4K3XPUir4GQpH90VSus/a1J7itCNfkU+oq2REeiVp6evzuP9nP6iqKCr9jxcD3BH6UkKR6TZtus4G/2R/Ks3V1yZF9Y2q9prb9MgPtVTVFzchT/Ejf0ql8Qr+4chq2h6jqNqmoWtsJIRbqGcyKoyvB6n0Fc/DKwQEbkP16Vp60XEVqQTwrp+TZ/9mrNhj8zOSeKEwZaj1C5jxtuG+hOR+tFxfS3KqsjIdpzkDFV5ISi5UkVYFuKZJDuGOhP0p6MSMjIP61L9n4xzSRQfvXByeARTuFhVmkX+I/jUguXzyAf0qRbYGl8kKOFouIqXdwrQHKlcd6yzPFn7/wCtbNxDvgkXHVTXKqOQD1ouFjR+0R+pNOW4UjjNUlTI6VZhj3KRSuVylgTjtU0N3NCcwyvGfVGI/lVIxEGjaw6E0XHY3LbxRqsJ2fajIB0EoDD/ABq7F4scn/SLYNnqYzXIecUuMFc8itiNJph8kJOeyL/gKNCXJm8ut2N0cbmjJPRh/hTLK6hTWlKyIVbKk5rJaG4gQGVGjU9mzUTIiqWZhgDPFCkk7oly6HcGWOXf5csb4GGCsDj8Kjdt8bdOUzXGLHM0ayRSMEJA3HgD8atwXt1DIypMsu3g4fPHtmqdRdSdC7a3dmmpQyyCULGQWCgHdjtj0rS1vxHrM0qW0dvHDpWUkNu6ZJUHHfr07Vl6bZXt5cOUkTcwLLHIxOR345H54rp9K8Lvf6e89zaWy3MbEhWZixHYn5sAZ+lebVdKMuZ6scV0RYt9MbVrn7fZrFaXbZKsoOF49h1H9RW1daDFPZEQ4mu4JARIoJ3euRjpWFBeNbXZKfZoriJSsKojbcdefy61b8Xa5cr9mtIZykx+WRVIG76c89+tebJVJT902WiOc1jSrm01KaCQvFNCN0bAldyj03HIHWnz+G5IClykwCvgsruAEyM/M2cH/PFSyahGbeNZYyZ4Ty8sbdT15HP4VBqMv2i2BW0it42GQiqME56jPQ9evrXR7+iE4nm9mPvGroPNZ9o7btmOOtW2kCnmvVkF9CwhHOQMU7JIyCMelU/NLLnoPXPWlSRw2EweOmelZsyci9GDIyrtILHAyRzW3v0zTXMM1j9tlX7zNMVUH0AX+eawbG4jWR5ZjyqkRqq8FvfI7U3dMHydpB/DFUtC0+5rapqs2pvHuRIoYl2RRIDhF9MnJNcfqT77x/bit8N8uSR+dc1cktPIxzyTWkNwkQnpV2yGIy1Uj06VftjiHAzzWjJNCMgWEue5FdV8O4hLqckpIwvAJ+lcqEcWRwODj+f/ANavRPhrb/upJcdc1zYh2gdOGV5nch0VSSw4HrT7aJXbdkZxUlyAI+nU4qLyoipPlpjv8vNeaegPEcZi2gL1PJHWmw2tsZWcwxlgAM7AKhCRqF2ggH0Yip4F4bYzjJPRjVXE0RvZsbqMrI4QDPDHj9aSe2Vgqozgs3Xdz61aMbljiZwQo649fpWdJJNBKGEoOCeqj+lO4kLcWLRwkrLID05AxSLG8ZYsVJx3U/41ELy4upVQlCM8/Kf8alkMwR+I/TO4j+lMdmRmB8oAyZIGMA1jxaZex+IGu2keSFk2hC5Cr9Bitl5XUcICV9D/APWoF421AYmyFxgMP8aaloJq5QltbicvIkQC7j/EO1ZNlLqA1m5juo0FuAPLwPmzxXSxMCoDLIAeox/hVeRF819oON3GVNHNZDSdyFmDhxtf/vg1myxjzCeBxW5bvEkT72CncevFVbp1ldirLyQBg+1CYGTkHgntTGiXcAVBwM9KnlhLs/GcYFVXjCsflGfpWiEIVUP8o2jHbinkAEEbunPzU0KN2R6c5NDvtfqelMRFc3Ei4KyY+U9QKqSXEk0eGIwoOMD1qy6CZwWZuBwOKr3CeXx6qO3vSlsNEaEgdKm8ZSCa+8Kr/aiXLxFAIAo/dDcO4GD0/Sof4ccYNcxqzZ8Q2ueApTJOf7xqqO7Mq9nFX7nrXizyjeQau8t2gHG2JsqGxweo2+mR6VlHXLJkm8vUbqMykmQEsd34nPbFYMtxi3DNMNhGCPr61jecW1c2mzEZTcrDPp0raE3Yl04rqd5b62d5mOsI0oBwZVByM5xnCnrmuV8Y+ItRudD+ySJYPDNKGaSKTc4b72MZOKr3llOumyvD88rDCbW56jtXHXVpd24DXMMsYbozA4P0rWm76nPWSjoafhkEXkpOeEwfzrpHIKkeoxXO+Gv9dcN/sgV0BIyvuwH61z1tZu50UdIIyPF6lpbCNRnMbEfUuR/SsjTdGvNQneOJdpTrkc//AK63PERMmr6dECBthzkrn+NjV+002S4luTpWq30NwzAQJACqynvuIYEfka2U+WKRzSg23I7DQvAtnDc28l1dXTyOwynEa59Pmxn8qoeJdOk034k6VY2tuoE/AQsCZI2G0qwB4/i/OuOVb+w8UvDqkksk8Rw0jksT78mvQNV0wP4r8PXfy52yFWjwM7VDDnd9aFdN6mLlG6J9T0vU/DVxHdaZZLLaLGyTOYzuQknJGG6gHvWvHqtp4ptYEvDeRGAEHzIAQTx1646Vl6tqd5ZaPceaPNEjsDG0rHIxnqDnPNU9M1C/vLK1l09ntJAfLeEkSFwD94MwySB1FKz3W5dlaz2Lcfwst74XF7e6pD57kmKLAKoueAc965HxRc6rpt79mtHt5GEgObRN4I24HcjueD0+lbK/FPXo9C1CRmgZ4LlIFLRj7pDcnHU/L9K4b/hKtYvJGRtUNrEFJCqxjT6AIK0jf7RNl0O20Dw3qusWH2m8iMTRqVix8kmGxkKpHTsa6LVfAdnqNlaw+TeIwULM8sjMc4AGBk+9cLp3xa1DS9MgsotK0+UwxhPOmRmdiO555roh8YxBbxSXGhw5YA/uXK81D5rlJRK2qfDDTbMHat+5Uf8ALvHv3e5J6VDZ+FbO0tgYdOczn+K+3Ps5xnaNoPUdQa1I/jdpwkG7RrkR4wSlycg9sD86tj4z6NI5V9MvxkDrMD/WhylbVAorozzrxF4WuodJm1281IzyNOEKyLhm46/TpWDo+h3GszeXbozY67E3EV6H4v8AGXhTxTp7JJbapHdRIfIIK7Q3YkZ55xzUHw317w74ZDXdzqlxFczxFJY0iUqPm45PsAfx9qfO+UThqYh+HV8uczsvpm3bkVoaN8J7/WrqSH+0FgCJu3SQsAeQMfrXp4+KXhZgf+JxL+MSf4VcsviH4Yu1LjX1hAxxOqxk/p7UnUfYah5nnM3wSktpFSbWA4xuPlwHp6Zz1rC1TwAINRe1t79NyKo/0iFlHIB+8Pr6V6/dfEjwvbzFDrfmkDOYQjA/pXLat408KNqEq6lJqBmjb5TBGMYODzzTjN21FytbHld74UubOVYptQ0tXYZUeftyP+BAU6LwvqXJi+yzjA/1N3E5P4Bqs+ONU0nV721k0cXhiSIq/wBpUAg57YJrn4FYMeD2q29ARsNoWrRn5tNuceqxEj8xVWeCWAhZonjYjOHUg/rS26XDsBGZB7gnity9s5LnTdPM0zuyCRCxGT97P9az3NLnLyDkZNLj5a27zQ0hSNhJINw6kDFUn0o+UzLI+BxkgYzTURqaQlqMWYPq7fyFRFgO9R2xcW2xiQyu2fyFRnp1pqInK5bhkP2yFQcfOp/Wu7uxnQhg4/0n/wBl/wDrVwMLq93DkYww5r0GZc6Kwxn/AEkf+gmiS0FD40YQwoOOeKjkYY/nmpto68Ae5qCQgEcnGK5kdbM+6y0YG3p71lsCByK15gCud3FZ8yEr1yBWsTKZdtx/o4+tWF4AqG2H+i/iKmXtWhkSA8V1OiNi/Pu1cqvWum0Vv9MB+n8qqJEj0FT8q0XXRKYhzGpp10f3aGs6hpTOM1/5bnPoa888R3k82rT27sDFE5ZBtGRn3r0bxIAJCR615p4gQjXZzjG8KR+VKKVtRttbEuijJk5x0rWPTAIOAc1laLxLIPYVrsuV6c/WolubQ2IVba+AKmiGSNy8H0qHywrc5yasZ242n86hlrcbbQaHMF+2PAtzjH7yQoSO3Yj9azNbtLS1u0SzeN4mTOY5VkGee4rN1iNxfoyxbxsGc9DyetV7YMAwYYOelOFGz5+Zk1Kya5OU3NObFuASOpq4Pm9Ko6coa2K9ctj9KubDlcAcdab3EthqqUZvc0q8gjbUjLn5uaYAAOpBqhs5+4VA+JdwUE4x61vaff6fb6LaRPAZh9qJwGAKt2NZT+RJdeWzKSXwM/Xv6Vam0l4mn3w4EG1ZCrA7Senf3rSLMJI1Le1kSSfLb7ISNLliP3Mok6D6j+dKiWomdbm6ESm4ngMTLkSBiD+YyDWE9lLGWjCTo4AZk5BHoSPwqpdzXSlQZZGCv5g3c4b15/CrTIasT2sYtpLm3OcxSsufoakd1AzyTVOxlaWS4eRiXZtzH1J60+QnB65zU9Sl8JFdHMsbD6VpwDdbxn0yKyZSSqH0ate05th7GqkSidBVy1GLiP8A3qrKKnhbZIj+hBpIGegaM+dLUf3Tj9aZqx2TQMO+R+lM0Ns2kqejGpdVXKwN1+Yj9DVfaRH2WcLq67rZP9mZv1A/wqjaJ87D2q7rrtFBLtI+WQHnp0IrAhu7jduVwMjggCkirmy8ZbKKNx9BU6QuVGUb8qp+G5nnnu/NbcwAIz6VrsCQWIJ56Cm9BLUgELdNtEds/nbihwRiphCckbicHpTo3dXU4wD1BpXGPSAelK0A9KZcKzXKgSMm4cHftHQmqb3ckZIFyc5xh9pqySy0AweK4iRdl06Y+6xHNdO+qXCgnEb/AIEf1rn7pxNdNLtA3tnApDQigAVZtSDIVz2qsoFWLb5Z19+KTGXGiGelIYge1Tgd6dtPaoKMW9j8q5RvUV3FsY1iE5nS3uYYkVUKndgjBxk/Q/ielchqyYWJvcirNvIrk3E9w7SlVCr7Y9frU1FeJnPQ1tTt7mSdiJZbncQ3mMG5J6jPTArIS1lkaaNNqIF7sRzn0q/c3TiJkkYOoXC7m6GqdjdvHdodoLg/KCMg1EU0Z3uaJs4o4FgMjyxAAbHbhT3OOnWqSaXLbqJo/nZv4PNArQnkSGOIDDM3LNuJAJHA/WqC3CxsVcnd/dXiq1sS73J7DXrjTGmTyVV2iIQMg+VyRzyOOM1a/tjVr2FIkmeLHAIITccg9Mc8+lZc9vFI5ePf5vBJdsYGP51BHd3E0+xmLOowvI49KylBblRbPSNI8K6hkzLeRu4GWkRgVV84PI6/T1FMulNtqptmjEk1jgCSN+SMYLAHk/QdPxq7pt3c2Gh2ljNc2ZdY/OKxOfMUN0LZ+vpxWR4mh03R8TQXFwl2m1kdGJQluSTnnsB/SvPXM6nK2b6cuhV1fxTFdoyXsKNIuNjx5BQA8jnkevcVVlv7nULVWjuc2UbgIAQSCRnBHX1/WsO+Grakr3LgyynkqF3MR64GcdO9Y9pPJburq5GGyMHGDXXGgnHR6kNlZFEQXIwehNPMmQceneq4lAznO49KGcjAYgfTrXZYz1HpIxyRkMPTiladlC4ycdfWlyhXOcAdc9afbwQzh5PP8uNeMkHJPoAKSQrdx0M7JIsioMrzkDpVptQnect5mGY5ORkH8DWevDbSfpzzT8spLBc46nNKwbmsut3VuW2XHLKR86hv58VUTxXqNkPJj+xso7vZxsfzK5qi0jbdzNnA+mKz5W8yQsa0hEaR0I8a6kfvW+lt9dPi/wDia0ItbF5aedfaZZSJ2WKBYse/yiuMCg1tAeVZBN5IMefp0qmOxsyS2TqRJp+VVwoSKVlLHsOc4616J4TtIILaQRQLEuQNgYvtPcZPXrXl+jTSSyHJyIsybsclj0/pXrPha2xpaEuwyc1xYqenKdmEjaTZu+TG8kanAye1PnsoViYo8qtjH+sP+NMSMiX5ZXGFzuOOP0psvnYCLLuGe61yXO0mS1jVcM8hP4f4UiRBFB3uM+mP8KZ50wUgumFH93/69IrymMZVOB9KLhYDHMzsVnAGcfMmf61Wls5ZZCgeNgB6EVcjabGcRkNn5dx/wpod97Zix0+6wP8AOi4FBLCWC4VmaMDB/iP+FSMjnA4bLDoamlLSTKqoxwD0x/jUTb43QFG5PUUXCwlw2yNmMLMQOxB/rVYyRMSzblPoVP8ASrMrHyyu2TJwOEJ/pUMpXydvc/3gRj86q4FkPCsSfezjnKnikt3gEZZ25I4J4pGkAzl1xjjDCpEwVUbh0HepuFhLd4pEYiRCST/EPWq88AkUnaOp5p6KGHQHvzVmG3h8sZVM454o5gscjeIUnYIAvPYe1QIhfLN610l1aW+5yYEJycN361my2qbHZcj5ugatk0SUltwepP1yf8aY0GZWwxwuBzT14DfM3Jx96kXeWkPmsST7f4VYiLhZWwcAYHP+feqN8xMgz2wOKu+U+5mMnU56Vn3f+tIJz8w5/CpkNEJbCn2rndTtxbLLICckblJPIroXYKhPoM1h66+61B9Yh/WujDrc48W3dGCmq3scRjE7FD2bn+dS2+t31tKrxzMNv8Gfl/KszJpQSR6V08qObnl3N/8A4Se+njaFkgw/PMe7+dUriWTUJo4lhiVl4/doF/PFUIztkBrR0qZY73LdQQT9M0n7q0KTc5e8bNhYf2bG+99zv1x0+lXElDSxA9N6/wA6nmG4ggcHoar+XskiznLOAP51yt31Z2JcuiMvxBfzWmuB4tpKwKo3DPB5/rT9J8bX2l36XSW1rK6dA6HGfXgiqPiYFtZkOf4I+P8AgArGxzwa6VCLSON1JJs7Sb4h3k2tDVJbCz+0EbW2xLhh7hga07z4py3VxpU5s032LOduwAEMu3GR1/KvNWDHc+MqDjNCMehPFVyoi530/ja1u7Fo5LeQ3BkMhZeFPA7HJ7etMi8dw21pbwx2W54HMiyFsZJOcHFcfbKGlIcYG080kkM6f8s2A9loUUNyZ1+ofZ7rwpe6rbhUW7uYTLED/q5QJN2B6HIIrjWVQK39L0qzuNFluZb69mZDmaytUAZQOAxLHkc9QDiqF/pKJbLf6dI89i52ksBvhb+6+P0PQ/pVWEyhhSMcCtC62ixiBOOP8KySrKeTyK1bhHeGBFI3EDr0qXuC2KMapna2TkeldIiaVBp9tDdz3pkmTz1MSxlFzkdzk9PUfTvVGRbXQ1U3UEV5qLDIhc/JAMcFgPvMf7ucDvntmT39xqFwZbhlLbdqhVChQOgAHAFN7Aty3qtk2l3zWxcP8qurbSMqyhhkdjg9Kzydzc8n2rbkuLTXFT7f/oV5tCLdjmOUgAASD+H/AHh+I71j3NpPZXklvOojljOCN3X6etCSHK6GA7TkGpGf5BnGSexqqwcsflNLyAuRRawJl/Tbb7bqlrZZAM0qpnHTJx1rU1RDqeq3V1B/qpJWKfTPFU/DiSNqzS9reCWfJ7FUJH64rQ0yeARwxv5gO0biFzii6Q4xlLSKuVINFu7m4WCFd8rdFHWux0z4aawVD3EagHBx5oFa+h6t4a0cecJLh7kjBc24yPpzXSp8Q9EOdq3Z/wC2Q/xrKU0brC1v5TmpPCz6aRFOFjJjZ12Pu6Y68e9ZcgI0+L2mcfoldTe+ILTXboNaJMoigcHzFAzkj0J9K5l1zpztj7kw/VT/APE0k09iHFx0luaevsV8NaUfrXGXrDCttXOfSuw8Qn/imtKHua4y8P7nPvTiRIzZSgfhBzknFUzIn90/nViRiJh/umqpcAHjmtbak3HwOBcRnGPnH869JlyNEkPpcp/6C1eYwczxnPG4fzr0+QZ0OYf9PEfP/AXqJ7FU376MMsdgBU1TnVpFAVSavPG+wHdx2yKqEsMdOPauVHe0UZBthAIwwyOlUJOc88VpzBmOCB19aoSA7CMfrWsTGRctv+PUf7w/rUq1Fa/8e34ipRWhgx4rotHOLpfov8q55a3dIOLlPcD+VVElo9ChP7taluv9QtVoDmJT7VPdH/RlNZ1C6ZyfiPkmvOvEFu634uT911Cj8AP8a9E8QnNcD4gS4CRSgZt2Own0bAP8qIbDluV9HI89hnjH9a3Qo4w1YOjLuuSvqproY4SigEA84yKynubw+EhaPcd3QgU/YxXHXFTMoXlhxQQoJOOKk0W5x/iDcl3GcnkEdfQmoLXzCu6RcZ5HvXS31rbziXzI0ZhkqW69axrrylaJIiuVTDBa6I/Ajkm/3rTL2lANHIMfxf0rS2bT0aqGjAbpVJx3/nWnGxdTkAdaxe50R2ISW3FSePpSY+bGRyOeKtMN6jFQyAqucdDikMzXVUnkYBeuc4rqzpSpf3lw8sTpPNbP5YOWXDAcj3rkrkTLct5YGDzkmrUuqzvPdTC2VZLmOOPKv9wochunPQVrTdjKprYsWV3dTTWNzPM/mi/a3fDY3KeQD64yait2v5dP1MQySS3ENwpJIDHbhgevbgVDdasZruzIsvIjgn+0S+Xz5j8Enn6dKW31WzSXVN811bR3UiujxoCyjJJBGffFaXM7FSYZt7B1ABe25IA5IdhVSRMk81qG40qa2hitrpw9urqkbRH5wWyOe1UnTe3IxxUvca+EzZB+5+jCtWw5tj7Ef1qlNGPIk45HNW9NOY5B/s5/X/69WzNF5KmHSokFTKKRR2Ph6Td5q564NaGocwxEgkBxWL4dfE+M/eQVtX/NqD6Ov86rqjPo0cPr0QdLlSOMAjPsRXLwDjA7Eiuw11eZsd1I/SuRhUqeTkls0+odC94d+XVZ4843xkVuFShYM69RjI6etYFjJ9h1Vbh1PlkENgZxWzJqOnyOWMkvPYRt/hSkm9hxaW5IWQk/OPvAj6elG0E5EmeewxxUf2/TgOBMfpG1Kt3au42Lcf8Afs1PLIfNFEmoErDG55IHP50yNlZpV4I4b86fdyC6URrG4XuSKrvG6NuQlflA6/41oQZ14gBbA6MDWVIMSfhWvOjuHDvknvgVlXAxKfqaTKQ1aliOJVPoahXrUyjmkyjWHSn4yBTYzuQH1FSAcVAyhqibrXd/dYGmWMlqttGZid5baoBOe/PH1/Wrl6m+zlH+zms+w2iBiZRFsbO4rnqKOhnUV0acaI29XSM78MC/JH0qe2tI33yxyYdRjZ5fJHbGaqCVBMGS4GG+ZRjP5n+lW4pYlRZnuOdwGAOSKlWSME7E223aJhOvlSEHPVgSOOR2qAwskn7uJBhQNx6DFRPrMMl8yyA7Tk/d6HFZlxq0dw5ijWRYwCF55+tGrG3dmlLbSB/MVxsHXJGCe/I7VVmt7NXMssofceChPArHkvbmMhXmZl6jB4qJppJo8Mx2jocYp8j6gkzd+0WMV+szPKGyAdrf4VsX/iE6qoE8m5NxbaQB1GMfp+tcIc885PrThM4GCcKvSk6EW7lK6Ow+3I8LIuXIXbxgYqvYWNq0ck9w27DfJuO0A+/rXOx3bAKgJKjnGeDV+LVYli8uTlem2pdKyshO5nN8n3o8e54puxXwEDbm9MYrpYNSUW/l3SWt40yBVLSlDFnt05PHJOaxrhIreZ3eZA7DIWD5hn0+lWmymiJY9nUbkA4b3pGnVmVIk8uMZJJ5JPqati4sUhCKjyXDrjdIAqIe5AB9Kqs5Jyqjb/eAyaSbE1bQqjDynALHpjvVlUdhtztx1pkYw5O3oODt4pWPlZYE7vTuabYht2pih2ZySaoda1F8uVgbhZdmM4UjJ/E1anjsIZIxaMuwqC2W3MD75FNTsUZsVoCqkg7m/hPGOa2kCSiSxZ+HT5D6MOf1xTdNtIp7tYWuowGOSSQcCtnS9FRdTa4aaCVU5Xa4OOcdM1DnYfK2QeHRbyWDW0Tk3CnzZPl4IB6Z68DmvVNGimTT4QpQDHcf/XrlXWxKL5cSxyhSUaNACc8EE9+tdjaieO2iRUXhf71ctdpu6O7C6JlyJJ2lk5jOAB0NQzrPE6k7CuexPNJDJOnmkpnLdQaZLJLNKo8tsDrgj/Guc6tSd33xnbGCSMH5qmIk2Z8o/wDfQqFXCYyj9QPu1NJcLtxk/wDfJpAQxl1UEwMMD2pEuFIfKNkseqmpklTad27bj+6aiinhAJJAB554NAwjuI/NYgNwAB8hpqzRNONxwOScgihZoS7kOoG7g5FOSaJ5nKuhwADgg4oAkeSDzEPmpjJOCfaoi0e0/vkyxAADD1okyzLwe9NllLBUYAjPOaLitqNfoQCCKsbFRCdo4HpUMcULMMoOvcZq69vD5OAi/Nx0FS2WyuscZQb0XgelSLbxbRtUDjtxU/2SDacZzg8Amp2sozH8u7p/fP8AjQTcxZ4FaEHL5x/eNZJQeUc7uSe9dVLYkQjDuPl9awLq1dF+82PfFXFgYZjCgnewySf1qAKwY7W4ycEj3qzOjqoO48eoqusMzIG3j/vn/wCvW6ZNiEySDIypwT2rPn5lzxyxNXxFIFDFlOevy1nSZaQH60MRWun2W7tjnGKwdVJ+xZP/ADzFbd+f9GI55Iz+dcxq7SJIIpMqjxLjP0rpobHFitzG3L3NOO4DcUYKDjJHepvKjZk2soAIJye1aU0dmZjIpEiCPcVXuRXS3Y5kjIjf5+h/GrNvH5kgAdY2zy7HAFLcvaGNPKjkSTPOSCMUlusLyFJWIQL8uO5otdAnZnTWLXUUIXz450HAIGQPxq3Gkj3cDSclSSB6fKar6Osa6dmIMAXOA1bEjW7XMZt0ZVCHO7rnpXFP4nY9CHwps4jxNIP7eukxnbtX8lArIBG4HNb2siBtd1N3PKTuPy4rKGn3LAOsDFWGRyOldieljgkiF5C0QiA6HOfWmxRvvUhSeenrU01pc2qpJLC8Yb7pYcGtjQFFpHc65cIrx2eBCrdHnb7g+g5Y/T3qtxGfJbXNldyW91A8EqjmN1wRnHaul1cALHhVyLeM5A74rM8VyP8A2225y7C1gy5OSx8tMnPfrV+8ZpYIizKX+zRhsdjtFJqzEc39pns73z7eQxyowZXQ4INdLZahHcwNqQgTAIh1S2U4SWNjxIB2Oevvg965S4I81+e9aehN/o+rDPymxJIPtIlMEU9Wt207U7m0bkxSFAfUdj+IrZt74Q6Et9Yxo17HOEd5FDGIYypUHgZIPPXgdM1S8X4/4SOf/ciz7/u1rpPAOnoukXuoSgEPKkSA+2ST/Khqw1sYel+Fb7Vlnup3MKbS+XXLOev+TXPq2x+QTjjIr2y8Qw6BdPEACIWC4HscVwfh7wut5ZXUs+4qW2qFUk8f/Xpc2moJO5iWcM13ZzxQICcByW7Dpx71p2Nnfa1Y3Wn3Fl5txYwYhnVSZFIYYQ44Ycntx9BXd2/h+Ky0KRhFiSIlkwvOAd3TvzVPQdJTVNN1H7VHkSzl18qQoW9ifTiiLQ22zkj4a1Ce2IeFftCLxFHMjP8A98hs1ztxayQTLFJGyP3Dda9B0rRLi+u5LebQ4oIY+BNDJIrLx6l+TnHauX8Q721JGmZvNMEfmE9SwUAk++RTsC1HWFu1hp2rTM8TF7dYRscMfmdc/oDVS2a8luY7S0jMkj4Coq5JOKnt1VPC17IMBmvIVLDuAshp/mjT9CmuY2Iub1/s6uOCsaqC+D/tFlH0BHek4q2pcZODvFlk26x/Jca/p8co6oqvIB9WVSPyJp9vE3zeVrelyc9y6/zUVymfepYnxFJgmpcI9jRYmr/MzrP7V1TQZjvghIlQhZPvI6+qsDg9KfZeIJ5ra/R4o8iDzFwD1Vl/oTVLTVWZH0uaSRo7gZiG77koHykfXofr7Cq2mxgfbNjsf9ElPJ9Fz/SkoroTKUpO8i/qXjae4061tWs4wIScMGPP4VjTeITNHsa2Ue4b/wCtTZdK1C4sDeQ2kj2yhmMirkYHU/hWRgg1cYqxlJu5px3JuW37duBj1pWjQ24fdli33cdBWnDo8Fnosss7sb/CP5a42xq3QN/tEc47ZFVI4AsPIww4z6570S0BIpx5EiHsCK9RIU6PNu+6LiP/ANBevPDGscKjYOGPzdzXoLc6Jc4/57Qn9HqJO6KhpNGG2FOMnHPeq0gUDAY/nV4sOAQc1RuQWUgL34zXKjuKr9AdxzmqUwPODmrTcKAV5+lU58An5f0rWJlIu2YzbH6ipgKjs/8Aj3/KpgK0MGKK2tLOLiM+qiscVr6af3sP+7/U1aEd/bHMK/SrFyf9GFVLRv3K/SrM5zbVnUKpnLeIOg+lcjrciDw3sI+c3S4PttPH6V1viD7o+lcpq9m0vhaW7yNkN1GpGecsr4/lShsOW5iaQcXa/Q10+7PGQBmuU0psXqD2P8q6dJBJu45B9aynudENh5b5QN2RSlcqfm6nFNyCgGBnmm4ySdvSpKRn3qEMSQrHBXn3A5rAkj2XS8dUz6V2lvbJPNIrxhsKCAWwew4rm9Wsfsl+qK6tEFIXDAmtaU7x5TCrH95cl0g4uXAraJG3BHP1rD0w7btvcVsbgejE/Soluax2Fx320xlDAg5xmnZ+YHJpDjruGKQyF4Edy2G6e9R/ZUP8TCrKlegkX0pr5/hIppisio1qvOJPzxVSfTRMP9aB+H/1608FmGcU1wepAp8zQnFMxYNJ+zziXzgR0xjFWpoip7GrUhGw/KKrzKSMY6VSk29RcqS0KMiBopQQPu8VNph+Vh7Gm8BnBGAVIpNIOZAvYgj9K16HP1NRRxUi1GtSLQM39BbF1Hg/wkV0V6f9Df2YH9RXK6K+26T611F6c2k2P7uarsZ9zl9VjU3WxyQjEZPtmt+5+G+l29vLNBd3heKJpFBK4JAz6Vha1jzkPYiqc3xH8QRb4QtrsAKHMZJI6etaJpN3J3SO30XwTpup6bBeS3F5ukXcyrKAAehHT2rWt/AGigFniuHA6brhv6V51b+NPEmm2kdrpz2wtVQFTIqlueTyTUi+MvG7rxcW6nuRFH/hWnPHsTZnpB8E6AoyLJ+neeT/ABrM1Twro0OnSyx2YjdGXnzGPGRnvXEt4g8bSJl9ZiUf3ViXP/oNU31XxPJG6T6l5m71YAflijnjbYXK+5u63omn2stlHHGUWZtsm1jk9O/402TwrbfZmaG5u0KjJw+cGufbVNTuHjgvb2KV4zuUZ+ZfwxSWvivUxDMj3UQYH5g6gY5pc0b6oqzKUsE1vqT200zSKr7fm61lXq7J2Ho1W7nUWnvBcSzo8jsMhRj2qLUwDMWHcZrKTT2KitSoBUq1GuMVKtSaGnbNmJfYYqcDiqtqf3R9jVkcmoGK43Iw9RisO3X91PGW2/LknGehrd96yIUH26WLbu3hlA+oOKcRS2KjC1SHCySs+OMYAp9spjVN0hLHnAbgf403+yr5lUG0KnOSSwrStvDuovEZIBGm7jl+R+lVyvoc70RkS3Rjd/LQqpG0c9xVEMxYknGetdLP4dnt4/367mJADKev6VJpfhdb2XMkpijU42Y5P41ST2Fc5YZy2OvSpRNI6eVgleuBXcH4dwRpva/kY4yQIxx+tLD4Htg4xPcMMc4Cj+lU4Md0cRFgxt8vPHNQOCCVPTrXoT+BLON1VbidgTkdP8KdN4K0rAO+43ehYD+lHIx3R5uGxzSqGZsfyr0SHwVpTo7N5+U7B+v6U6TwbpSqTCsowOQXNNQYrnIRRKMZGcVHNCrsW4z716uvw70y3sYpJLyadpCMFAFH9axvEHgqzs7d5LO5l3Afckwf1rzY14yZ1NJI83UHzgzHAHXFSyTxnBAIYDoOAKfJbxJkuSQp69zVeULuO08deldO5zPVllZMRtIisQBwW44pizISAY1JxnIqFppChDH72OPahEDnbgnHTFHKFh5fe+9gvp04oKDrxzVdrmWMsipjt0pbXT9Q1CZY7e2mlboMKcD6noKpQZUXY2rTS5VshfMVEbbgo5y2MfpzVjSrn7CssmwMGwODU96peKPTLV1lktbQRlY2BG8nLYPeslNLvn8m3jhdmPJxzyamUbrUtS1Oz0+QXc9q4QgM446nFejRXyAAbGOP9muH0Kye1uoxPtUKBtGfQV1PnRqrESDOOgNcNTc7qC90tx3JZWOyQAkn7hpy3GXOQwAAGSDTYJAIlw4xjtVi3YMjsectisGdGoLOjSIGYYznBqSaSMrwwyfehnHmrgDgUSTFtqt8wzSuMiaaFY8Fhnr1qmXXcArZ57VbljVlPC/kKdsiVdphiPvtFTcq1h1qAIFznnJqGVFEz8Z+op+yMYxGuPYCnR28Lgt5eDk9OKLiW4QRoWPyqTj0qfyId67olxyTxUKwoJW2bl6dGNSrGXlwHkO0f3j3P/1qVwaJJbW2UBkUA57fSkMMbBRznI/iI704wZuEWQv0JxuNSi36YkcYPGDQ3qFiT7IqQM3mSD/gZp2w+WxEjkAHHI/wpDbsV2/aJcZHp/hSiCTYQsrf8CA/wpXFYgaeQx4MhJ9MCqGoQvtHzdB7da1BafMWLqT7r/8AXqK7icowwh444P8AjTUtQSRyc0DGIhiDx12//XqirTRwgFh93Jwvf863bq3IDDjkHFYVxmMtGT0Ug5roi7ikiFlcqpO3p71iv1/CteWdxH8qKCFwDu9qx5PvkDpgVbJM/VJhHbBn/vAVn3US38MXzRAKm0huprSv40lt2SRgq4POa5ptPiCnbKh/EV00nocdezkRf2PdxZKtC2T/AHv/AK1MNvLbhuMZBGDUcsGzowPPY1EwJwcn863V+5g0hnls8w/lW5D4fkREf7T5cnsOh+uayIiscwZjwOcZrqBfxzFSpO1RuORUzlJLQcIJl23UpGEznHHJJzVuJd1yv+6f5iqsDh0DL0OTV+xUSXwBPAA/mK5Xe9zuStGxR02FBqWrSXESDNw20tg7hknvWZqGtLPMLe2jRIQ2C7KAT9Paqd5daoss7+YRHub+EdOfaufluJJuG6eldsVdM86WjN3xLfLN9mtYmBWJctj1put4stJ0rTEbkQ/a5x6yScr+SBfzNYGWB56+9b3igbpdMuB0n06E/iq7D+q1cVy6EyfM7kt3GmpaRp+oBjvRfslz/wAAwVP4pgf8BrNW7ZC6REhGYk8c89q6jQ9OVPDNrPOQtq00txPIy7gqLtRQB3YnOBTpNcgtLIXmm6PZQbDhWeMPIecZ3EYB+gFS5W3Hyt7HO2Hh3UNZkcWcB+UbizggH8cYrpdH8G3dnZ6g13JCDLbBdm4nA8xCcn6CuisdWv7a3Vrq5uJ76ZN7K0xZIARwMf3sH8M1owbrmHET4domXDY+9jIxn3Aqrk2aZx/jHw3Bc3M+oWs7eb5Mb+TtyCNg6GnWV9DpXgS0TeDM8jSiPOGbLAf411f2dLu3huJpkjjUKkjbslCOMAD1AB7da5PxO0GkatDa2oMiwQKFVu4Ylzn8Wx+FTJjgjs9OjefTjDIDyuOea0NE09NM0xICfnJLvz/EeTVTQrpLnToSTskZASoGRnvWpk//AKqhi1TOe1LWbnT9eNuJF+zGMNhlBwTnv+FWfC5hNvN5ZAUksWUZHB9vasLxla20l5bXJlcMT5TrnAIAJz/OsXwzdW9vcMrfbmV43VliB2ohBBYe/vRFO5ra8T1xDGyblY5YHA24/GvKPFuiWt74iuZV1KKIDACfZ5WA4HdVIP4VYmv3tvM1TzPLubmEfZhIxISMD5iAR0wAq8c8mqOuaveWjWUdprV3HC1qjoySMofk8kA8E1o3ZCVNb3IG0ZbXw55STpdLLfqxMaOuMRt1DKD3/Wr1lp8cltpvmW24CR+GU8ZKdvwrO0zXNWe9A/t29kGD8hnf/GuusL/VJZYg9/d7Sc8ytyPzpp3RnLQxPH9naWuk2zQWkMTmbBZECk/Kx7V5+rhYW469K9c8Y2dnqOlW7XcuoYiIaRoIBJjC4JJLDA6815hqenppmpXNoxZ/JcqGxjI7H8qTdhxWhb0S8Mmv6aCnP2qMdf8AaFP0qUtqd7HgAG2uR9cRuf6VX0BEHiLTCAcm6jx8w/vCrfh+Pz/EDIkZYyRToADkkmNwOPeki22xtjc3J0CWWGZkm024SdNp5VX+VvwyE/OlNlby+J7MiMfY7kJclF6BMbnX6Ahh+FM0mOVLm9spIGjae0lUo4IOVG8Ag+6VoaWR/ZC37KoFtZ3UQPuSAP8A0fTuxNEq3CXul6jdunzXF0hIX1AckfqKy5Cs6qxLDK+vpVrTre4vtEt7eAAFriaV2J2qqhUG5j2A5rT0qHR4LiY+U99FCgaa4lJSP6KowTk8Ak++OKlpsLnN+aXxGq5VT3r0UEtolyPWSE/o9cG5R5neONI1ZiwROig9hXdRf8gaYf7cJP8A4/Sew4/EjMCPlSCCfcVVkDsCfl61dYDyuDyD/e+tUpVAHBPX1rmO4ozBsdAefWs+4yA3A61oSKAT83eqFwM5BJ/OtImUi9Zf8e7fQfzqYCjTreY2rnypMYGDsPPIqdbSZudh/E4rWxgyMVp2HEkR/wBn+pqqtlLjJ8tR7yKP61etI/LeMF0yPRs96pEtncWTZhWrc3/Huaz7BwYV6n8KuzyARFcHOPSomVA5nX/9WPpXF6y7f2I6hiFM6Ej14eu01sh4h8wHHcGuTuYo5YTDJh4ywYhfUdPT1qYvlRduZ2Rz2lNi+h9z/SuoRVBwDgGs6Gyt4ZkdImBU5HzVqYJGR0x61lKXM9DojHlVmBKg9eh4yaMr2I96SSNmTAxnPc0gyq4Kg8dqkopazLNFZmWGVkMaqSVODjJHauZF7Lc3CCSRnxnlvpXU3r/aUktpEKIUCBlGc87s/nWQNGt1kDrJKDnutaU5JRszGrGUp8yH6cf9LH0rZRWUtyPmOaz7e1SKZGEjEgYwV61qMBx8tTLVmkVZCfN7YpHDFTwOlMlUlRtHIP6U7AwcZ/CkMYgKAA88daCC3Yc0rKccA5HvTFLhjndjtzQIUxlSCV468VGwyOlSb2wcg1EXyrY5PtQBFIAVYBTnHBqvKQF5zmrbscZ5qpIQRyTmqiJlYDMwGCM1FpjbJ1Ho2KkDESLk45qK14u3Ho5/nXR0OZ7muOtSLTG4kYe5p60gNLS223Kf7wrrbk5tZv8Armf5VxlicTr9RXYuwa3YeqH+VWQ9zmNXYlYyfSuC1O6ki1CaNVBG7vXd6llrWM4/hHSuI1e0kbU2dY94KqcH6YqpfEQvhL39tIljBGE3l4sMRng/1qxrOpNPa2zW32lMBtx2MoPQ/jWX9ku7jT7QRqXeJmUoByBW9Hb3klgALptoHlsh2g4Ixnp7LSGZVhLPLbXyu8ufKyNxOQQc/wBDVSynI1G33MxBfbyfXiteG3Y3oUSAma1yS8gPYj8Oo4qgmhXiyxvvgG1g3+tFCBouSBl8SROUOyTau7HHI20uotAHmQQMGxksMDNXZk80RsjpuTH8QHQ9fyqG7t5JLgmNkAIwW3j0oYK3U5vcv8KkEGti5xJHE/qn9Kgk0u42nMqH0G8VNICtpCjY3qMHBzS6DW5VX7oqZBUSDnHvU6CpZZatj94VZBI6DJrNlnNvH5nOB6cVH/bUYQ4Vs9jSsDdjZUnGCc1lyHytUV/9oGq6a04UjCluoJqH7X50pZ2ww96aRLkrHpK20c1ssmPvAVoW8SRWqjZ8wOAfWsHTdbsf7Ohja6j83btKMec/5xXR2EreZEXUEMRwDkfyroi0YSI7mCJ1UNEAcjjFVltFt2LkDA5HHeta8WIXAABDA5f09qLuJTBhBwP1rRq5KZWW5ExXaF6Y4Hf0p3DgkHoOcjFVInWNHRWZSvQc8Gpo3U4ycn+LApLUqw47iYjnIBHOKju12xFkCkx8kFsZ/GrO9JHIQ/L6VT1CIz2FxEcgMhFFgRUS+dndYIo2LD7omWporq3nXyt6iVR86K2SK4CztJrkIlvb7JUkx54Yiuq1bSmMK6haMY72Jcsy/wAeBSTA6qDVHmsbZpHX5AOAelY+tXouI2TJPGMiuWN9eoRFu2r0UDvUN3cXAzG8gDfxMeg9q8peyXqdDbfUoX1mYg7su8EcE8VmvaGNSmCJcZHv9K1bq0v78K6qQF+76n3AqjPpt0l3DbvI7zPgYxgDPStYyXRmSjd2Om0r4U63rWlW99Fd2USSruVJXYMB74FaUPwb8QxOGF/p4x0KyNx/47Xt2hWa2OjWtsB/qolT8hWlgeldSiraias9DwtfhV4nj6a5a/of50yb4U+JLn5LjXkaM9Rv4/IGveMD0pHZVxlePXFPlQHglp8INRt7xWku43SNsjyyAW/NuK6i1+HTRy+ZPLcO+ckiVP6V6oFRhnaPypPKT+4v5UOCYXZ5wPCU9tfK1pZSCPYdztIGLMfxqS40a9it5GNs4AUkk4NeheVH/cX8qytfaOHS5flUbht6etc9TDQd5HRSryjaJ5wr4wo5PbbiugsoAkARkUsexI71nx2lopDugXbzksRj9aupdWbSROs0RXcORIMV41WbWyPTuXhpZZyzW0ZHQH5TSPpTeYMW4AHcAD+tWU1GzYrmeP14kFSpdW7g4YEk9pAa43ian8oddWUH0ibj/R5SPqf8aV9Ll8sgQTfma1DexsGUZ7Y5p32qME8sMLyaPrTT1Q9TI+wSKAPJlHHqaBZzLGP3cw/A1tpcx/LgvnaT/nmnLMGKYZgKaxabtYXvI58W0q7jibr6Gms01uxdXkJI7j/61dKk+4L87ctU6ycEhjy1Cxa7BdnMWrSSyh5JGyF9B/hWiu8sgWXK8n7orbD53/P39KlLKc4ZeP8AZp+3Td7Cc32MNg29VWRMjrlfb604xzBQA8f3h/Cf8a22EYU/6vOB/D/9anbByf3e0Dj5f/rVTrRJ5zDEUwPWPB9v/r0k0Luh4XP41v7VGfli4H90U1o0wf3cPAB6Cm6sAVRnDX8MoydiY6dT/hXNaurKJGKrnHPP/wBavWHtLeXIkt4DwD0qjd6JpsquHsYWzjvj+tXHEwirsOdtnjE052N8pH41RkbMjfWvVL3wto+ZMWCAZxxIw/rXA+KrC102/SK0i8sMpJ+Yt3x3/Gt6WKhWlyxHZpanH+IWxpjjPXH8xXHbWKEgHA74rrPEG57Lao3HqQPrXNRbWtXQnBJBFetQVonm13eoyp82OhqSHO8Zzj0p+zClQR19abb4M6g9M4rYyLQh81jsALfUVryzw20eCCC6KuAOmKoAqZJB5ajnAOaUmMRASLli3GDnArN6o0i3F3R1NkQbSI+qg1paccXjNnoUz+ZrPththiA/uD+VX7P5BO/oP6GuP7R3Sfu3DTtM0t7OJ7WcavPKmWSS6CbW7r5QIYn8aoSavHYztaweVp0ynaY47FFYfiVJ/WuFk+SZ9uQeMEfhXZWN9aas1ra6y7Jdw48i82byyj+CTuR6Hr2rtatscC1H3d9pd2mzWttwegnEYhmX6FRhvoRUd7plhrraZY6Tdz3L21sYwBD85+dm5A/3hUureGrMM+p3es2/9nI4RkhR/MdgPuqCoGf5VnSa61xaPaWEQs7BVwIYm+Zx6u3Vj+lGqWrDRvY0/wCwpo9LGlXPiCyt4IpDIIZJQSrHGchcnt0NXbLw7Z7IIn1ewuYkcOUV9plwc7RuwOSMVwMbbI3KgDNa13J/xT0OTgkjkfU1M+g47M7K3NwuotbXUR+2O7SOh+UjJLZ57AfpVi48R2Ftcf6BNE0igKbguD0/ug9B79T7VzOm66/9jDTdQnkFncr5QmHLwZPY9dvqvcVlJpc2n6y9lcbTs5BXkOMcEHuCKfM3HRgkk9Udva3kVxd+Zpl1HHcyNg27SD5s9hnhhnoDz7d65PXYrrUr+S8eeE5GD82On0rP064Njrsd42WS0uA5UdSN3I/Kr8Xhy5hnae2V72zkyY54VLKV7Z9D6g0a23DmVzpNAufsFusc0jMR/dORW43iCPAEfmEscDcB1rzDVbVoZwhUqQCSCMVLZJs0yOccuJARn61PKwbidDrFvqOoXklx5qbFXCRg98dap6NZagt/YR3THy1uUPlBuuSoyexHFZN9NP8AYXbeVyygbeKtaFb3P26K6Ly7LVxLKWc8bPmIP5fnj1rS0lsReLNC7hvLuS4kdX+0s+/7Q7hl24+6FxxnC+3HpUGvadd3b2DJCxZbSMHBGAcdAKwftdy1wGaeUoT1ViAT6Vub7u/0Jo2lZb3TctgNzJATz9SpOfo3tTfMOPKncr6XYXEF5ve3dAF6nHrXZ6fdpthVyqsgwPfmuR0xpHsLiWSaVmVQU+c8daLE32nRHWLmdzAkebZHbmWXGBgdwpO49uMd6lNhJJnpuuR5tcyRyyW4zlViJQIp3H2y23aP96vLydWup55m06B5HLO2635PcnmrVr4vvLu3X7VaWs8o4L4aMt7kIwBP4VZg1qOXT7i4awgXyhnaJZvm/wDH6b1BFHTUkWR7+awhiSzXzAywEFpP4FHuT+gJqDwvbzReIbbMTqGYrkqe6kf1qrf+JdUviCrpBbocJDCuFX39Sfc5NXfC2oXk/iKyWafcglGRgevH60rMelx+k+ILmC5gGq2st5DESFdxmWJSMfKx5I5+6ePpTruN9K8MXenAiUXFwklvLGDiSI8sR6fMiAjsayl1a+3ENcEjJ4wK0tJ125eUWUsctzBO3+rQ4cNnGUPZv0PcU02GhXt7+4l0W10m3gdfmPmkLzK5Y4H0Axx6k1b1DbAi6bCAY42zM6nIkk7/AIDoPxPer9zqlt4dv5IYGl1C4HQyELHGCOnynLMMnkHAPTNaNo9hqkaLc2CheCfLlcH9SRSV2JuxxxkWI/dIA9BXeQt/xJ5T/wBcj/6FV3/hFNGa3aSO2LrjJ3O2V+vNQOix6fcKo2gbAB6cn/Gm42RMJXkjIc/NjYetVZuGyFOM9atFZMAAr14/WopCxJjIGc9a5EeizOuJPmxt+nFZt1jd93H4VsTwuxzxxgdaqRWf23UYLUnaJH2kjrjvWsUZSehNp7MbaYEn7g7+4qUVbOh3VpK8MUoMbfKSy84yK0IvDjsuWuSP+AitlFnM5IxxV60JzH9T/StJPDAJ5uJM+2KtR+GY12/vZuvHzYp2YuZGvprfuVq9O2UP0qlaeH48YM85/wC2pH9a1YtEt0T/AJat2+aRjSlFsFJI5PWeYh9K5leG5/n716lNotmU+eIEe5JrjPFGnwaeYJIIgm9iDis5RaiawknJGJwCM8jPvTgVPXjios5OB1FPBIXtXOdTJCwORnp70zcpHXH40hfClu4pFIdQfWmAEL1znmkxHu7fjilOcnn9aTccMcdB60AOwm7qP0ofbu+/UfmZUcfrTtxoAML/AHqTj+9RISibuDgDvQHLAED9aBAcYyW6/SmkLj72fyp5LFRwMfWmFyHCgDkdaYDCoGcNxUewKSQ3X3qZifQdKjYkLnrQBE3APrVVuWwfWrfLrnFRyhtpwapCZnPw45zg1HHIFvHGxfvdcGnu/mTqhwPmxxWjc6Oi3oaORgG6963iro5paSJHf5sgDkA/do3H2/KtGDRkkGWkkPHdqtJodsMZ8wn3Y1XKyOYzbRiJOvUV1kao9qvyjlcdKz49EtVbOw/99Gta20W3KL9/2y5quVk82pyl2xFmhVmBAxwcVzGpzD7RGXJyU6lvc128Foly8Vu6fKSy8+oz/hXFeKbVbDWnjBbY0YZABnHX/ClLcUXoUTe+RG6Qct13dQKajvJJE29jyCcH2Gf5UyPyZpcOJiCp+6nP/wCqprOKFliGbjfuOQBx0oGaMODc25C4+RkyQcf54q2chiBETjuF4rNVpEuoiRLtE+PmxgZ/rzXVaVbxTSS+am4KmQPemJmQHYEbomUE43EDj9amcohUFfvcDitnbbuABbxnnoRUfiK1igSB4owoBBO0etCaaDyMJmyTtgPHGeP8arz48vheo/KruMF/rn9Kqzr8vPYkVLGtyj/GfzqZOtV2ci4C44I61YQipZqOmTfbuoGSVrnMYHNdNuG2ucnGJ5Bgj5jTiZzBYw+0h+e4p4X5twBAxg1AhOcDnmp43JzyB+NBmOJcMpbBI4zmun0vxVc6VAAgWXuS5+7xxgVzDKHlBVjjjJI496kZBubYpKjuMnFHNYD0i38X22osHmKqSigBODu79e1b0eqWksODcxHjk5ry6wto34aZBglgxJ7dBx/WtC1a3kUxzyBJCcFiTxxVKs11IaR2ctxD5sqCT7+MkdhVZ7+O1gBkZsA9AcmsW1lQXMZMwkQIcru5NSXb20i7oj5rsxPl55H5Uva32ZSJ38TwQ3XAwoGNxBz9Kmg8QQzx7S4B6HBrkJJZDgbEZN2OB2J9frWtpRgS2xJbrIFJDAnnOe3tQnLuBvabZ20G/wAkK29t3ytnmtORGkt5Fh2s+09eR+NZVrsRVaBWjGOVY4xWlbSuNzBh06VutgOPaGeOQTyyRquTt3EDI9vaohc2akyS/v2HRVGAT+PWqd891fTxKqmZgBgL8xx/Sp4tEuo4vNuYhAnUmRgOPpXjcqtdiv3Ib2/vpU3rmGAnA2/55rQ8FWM2o+LLCNy7AyBm3c5C8/4Vh6jqAlZIIwyxx5AKjr+teg/B61a5124u23lYIdqlgBgk/wD1q6qVPRaGtNpas9yjG2NRRNKsEDyt0UZpw4ArKbUfOdo3jjePkGPkvgdzXYOnBzd0TRasskRYQkvu2qoYEE/Wl/tRXACws0nO5QRgAdee9UvtkTxyiS2gdcBsKThT0GTTXuoPKVXtYpQjbV8rkEYycUuY6/YRv8Jppf5eNEt3Kuu4HIGBUlpfJdlwqFdv94is+a+WNA/kxMxiA+90BPArNntB9rSaFljaUDIySB6Y75o5mT7CLT0sdWa5fxfK32eCFDhmfdnHYD/69bdjb3VuJPtNx5wz8nXge+a5TxfcuNVhjRVYJETy2Op/+tUVnam2c1OP71I5q5LvbtC75DDacrXmut6QbG/kiAGM5U46ivTnLugykfJH8R/wrD8SaeZ7UThELR9cN2/KvOpS5XY9CpG+p5oY2XgCq7PIhO12H0JrelthtyV5+tZskO6QKF5LAV0pow5WbekWU9wIgGlZiOik12cWhXqWi5mdD7zHP6UuiW8VjboqKN2PmbuTWzPOREBntXNJXex0RRwmuDUtPhdlvrpSOhWdiP51zaaxq4bI1O8z6+c3+Ndb4mkMtvsH8TAVzgsztJ244rWKjbYyne+4R6/r8ajbrF8B6ee1Sr4m8Qj/AJjN71/57NQtoMDIpy2owDg9KHGD+yhe93JF8XeJkzjWr3/v4amXxr4qA41q7/Fgf5iqn2QE5wQM04WoGfSl7On/ACofvdyd/iH4tjcr/bEp+qqf6VNb/EnxhJOI/wC1nIPODEh/9lrBuYFWRm6nNa3g7QW1zXhEzFIEXdI3tnoPc0pUqSTfKhR5m7XO00bxL4x1CQKl7JOzDkLbo2PyFa9/qfjrT7czSSMIwOSYEOB74rtdLt7TTLNbe0iWKJR0Hf3Pqaratej7M446GuX2dO/wo2dzyOX4qeLEnaLz7ZgDjPkLVqH4m+KJ2UO9qFyM4hHP61y01t5moTsEIVpGI496tR25THBP4Vs8PRf2URFy7nWnx3q0xO9LbJPUIf8AGsDU9Wm1a6E9wI1YDaAgwMZpsUDTuEixv92A/nUY0u9BOYV/7+If61MMPCLvBGnO7WZDPBBIiebEHz3yaqnS9MViFtAOO0jf41oyWMzKgERyBg8igadcHAETk/St1zLYzag9zO/sbSWUs1qw+krf40q+H9JDq6wyA54xIa0zpF4V4tnA9xTxpV4Ez5Entwaq8+5PLTMp9D0zoBMDnJ+f/wCtUb6Lp75O+fj/AGh/hWs2l3bbiLeb/vg1F/Zd6v8Ay7y+/wAhpXmFqZHs2OFHQDFWYfmt7oA8lW/9AP8AjSSWd2ZCfss2M9kNaWi6Ys0zJfl7e2kLh3PykArjvSitdSpyXLZHAjQZpZiRKg59K2dL0OWTV43uG2QQKZJZARhV6fmTwBXcr4H8Jb941i4z73KY/wDQaur4W8OLE0a63KI2cSN++j+YgYGTt6DJ4967JOLOGKkuh5Z4mknvNTZ5Iytpb4SGBRlUX6jqT1J9aw7cQgF0cqQDlMda9hbwN4XeVpBr9yGdsnFxHj/0GmnwB4VZWH9sSZbq3mxjP6UXVtxe9fY8jZS9rkRBcdcd+Ku36suh26kHOR29jXpi/Dnwp5JiGtzY9RPHn+VTTeAfDU9ukTa7MEQ8fv4v/iamVm1qNXtseVTR/wDEnh4Odw/ma3NHuI9XijsLlgl5bgi0lbgMp/5Zsf1H5d67aTwD4Ze3WI67KFU5H7+P/Cki8A+GYpvNXXZCfeaP/CklbqVr2PKtQR7ee/idSkvmgFWHIxmnafeT2d2hgmdcqqtscqf0r1++8IeGdRtRDfasJpV4S5aVBKo9Mj7w+uazo/h14XjYOuuSZHfzY/8ACq07itJ9Dhb/AMUahLKWivJmiC4xKA4H4HNTnX9UXRFljlgyWAB+zRD9Ntdj/wAK18MCNkGvS4br++j/AMKlf4eeHWsVtP7ecRq27O+PP8qFbuFn2PNx4m1YhN00Z+cZHkR4+n3adqWsX+o2ZinunVJn3eUigKQOecD6fzrvx8MfDm3A8QPjOfvR0H4XeHnGf+Egkyec70q7x7kNS7HmxaRoZYonXbEASiIMZGBkHrzj9auaBcpFrsRuJDFCInjZphgcoR82BXej4W+HF5/4SF898yR1Ivw28ORuGHiA5HHMkdJyj3HGMr7HI2GkotncQnVbAh16iRvl+uVFRa34lZr8xwWdjcW0Q8uFpbZXIQfd5+mK7aP4f+H4hIo18kOu05kTp0qpL8NfD5YMPEe0AY6oahNdynfTQ4mPxDsxu0rTQSM8WoH8qvWeuJJp1yRp2mlQpLBYCAfr81dQnw68PIAD4kH3do5Wpbb4f+H7e2lhTxFlZRgklMihtdwSfY4BtetwhU6DpR5HHlyD+T1PF4hgtpkmi0LTkkQhldRLwR/wOuvf4a+GywY+JHBwB99KUfDTwyeviKU/R0/wqm13FZ9jzMklmbbgsckVt22NF09LiRdt/cLiFWHMUZ6v7E8ge2T6V3dn4B8K2dx5ra0J2UfIsrqVDdiR3x6Hio7zwN4cvbgy3PiSeSViSzl1JJ/Kpuu47PscFOpe9WTBwYgT+tdDox+Va6BvBnhdipbXZeFC/eXnH4Vat/D/AIatR8mtynH0/wAKaa7ilGT6Fi3lMUQdWGR2Pes+8RWsZ5Ys+U4Uj/ZORkf59q0Wt9BC7DrEw9wB/wDE1TvzpFtpUsVlfyTs5UFGHoevSnKcbbkwpyUk7HPMuURlY5+v1qFk+QuSc+uaJDyPlO3PpSS7Cjqq5PbiuVHoMrynknccAA9ad4dTzfE0TE7vLRm5+mP61XxsRtwIJORxWj4TjEmsXEoHEceOnqf/AK1awWpjPY6q5QABupLYq3EB+VVrtcGIZ6tnp7VZtw3WulHIXI1HGR261OkfGQRxTIlyM1ZjTuOlMRatoxsyematgY/nUMSkAHHFTn5RgHNIZFKDjOO1ch4uhD6ZvYf6tw2fzH9a69ywB56fpXPeJEaXSp15Py5HPpzWc1oaQdpI88BXdy3f1pSV6Bx343VEhYHJGcYPWgIwczEDb0xn2rkO4eWypy5x9TTxjywqk9+5pgBYZ4HHrUsatj6HtQAxnAXGTk9Bk01SMc59+TT5I8hG4yOaPvHnH5UAIoXYBjAFRMQGwM1LzTfLBIOaYhjcgA8/hTlAxwDSlOQN9JjG758U7AOBT7oBJHWmMqjHy5NPCKoZw53MeelMOCOv6U7CGsyqMkUzOR92nMARgmmH5RjmiwDWPbbUJ5VsAcZHNT5GM96jYLtJXr396YMyiCLuEYHzOP5iusnQLJGQO+K5hVDapbKv/PQdfrXUTHMyLnuTW8NjkqbmjbMNvTtVxACRVK2B6nv2rQT5Tz+daozJ4xyADyK07YbgAFzkdKz4hlua07fKgYxgDuKqwjlrcGO/j7H7Q6/qRXOeP7BxPbXakgYKNj8/6mumBA1JvUXh/Vqd4q037fpE0ag74/nUfTr+lRJBE8utod9zGrSyDIIyGx2q2unlVLJJJujYlRv7/wD6qZFbpGyOGIK9PercRKlsk881JTRDeQbLJp1ldsFX5fPcc11WgE+ZKc7gUHeue8lZIvKOSncZrqPD1vDFazXBd1CL82TkACmhPY1oomAGIIuD/ntVTW4lmUxuBkx5x9DUkWs6a5wlzkj0DUX0ifboPm+V4+OvOat2toQr3OUkhR23E8/jUDxqEIzx1rQktFSR1wxAOM5NRC2QcMpx65NZmhhsuGB4xT1IHetcQwBhuWIqT3IyKmCWaqCVj/LNKxXMYxcAckVjXis124VcqehFdcVtx0GPfYf8KkjeMDAViB6LQkJu5wscEpYkRPx0+U09be5GCIW5P9013qzBekTn8B/jTxKJMt5RXb7iqsiLHCx292CSbWTrz8hqwbW7lAT7NJs/3Dj+Vdu2cdCQOM1HvAPcHtS5EFjj7SG7hkbdazCMcMRE359KvKl7JDsW3lbDcF0ILD8etdispaWNgoMbxncc9+4p/kjy/LwvBzGf8/lSdFN3EcLbWWppLI32eQID0PRav2mn3q3aBkkQIwbKMOV74966uTbuMmz73DLUDKylcFdydwOoo9kr3A5bXIGtJIpoj+5LsMjjJzuGfz/Stuyjt1uJY98L7m81ACGJBH/66ff2i3drJA3KsdyexrKtdeh0y4t2ngd/JjMbYIByOn+TWj0eorHSQ/OSPuqe3WpLZkWQK+cDjOcZrMstQj1BGeMEMSPlB5wa0d0cZDMOvQn19KtCOdi8FeJkffbW8sJI5/0hVz+tbcfgLxJPbmZotjY5PmAj8xXotvGZJASTgV1MFuRpu04+YGuK13sU0eBD4aayX3yT2gz/AHnI/pXp/wAOvDknh7TJvtMkbzTS5zHnGAOKn1BlhZAcZLbR7Vv2ii3soVzjC7ic+taQbbsCdkabSMqnau49hSBpSMrAgZup3DI/Ss0ah5kwjVsgdSKvxzNjJyQPSuhLuOMrbB5c4HyqMHJIAUClWOfghAMcBRt4qM3siRvJKioo9T2p6X0bKHONpHBB61DaT1NOeW4ghnLANGhXv8q1OEHmA/ZVGOjccfSmPfW8aFpHCL6k1Dql5La6eZ7dN5OMHsB603ZK4KUqklEvMwHBP515p4nuw2uzhgxC/LwM9K0NPvLjU/EEQuZiyxneAp44rg/EniB4teuAqlgSTnHrWE5e0g0jeVD6vUSk9bGobtMqBvGDz8ppstxHLbuhLHcMfcNcv/brTEfKQfpVg6hNsB3ADPSuX2LNPbLYytRQW8jxndx0JBrJtgJNRgX1cda3L0G9fe7gHGOKq21gkNykqvlkOQCRWqg7Ee0VztrPAWrNzL8nXtWDDqEsS87OBnoaSTWTIvQH/gBqPZs1VWJQ1uQbo8njdWeJUMffmrV2v26RR5gTHPPFRf2ey8CVT+INPkZDmhd6kfT2pfMXAye3pQLGVhnzVx+FILWQkrvH50ckg50OGCgxn8jSMRjHT8KctrIgHz8D9aTytx6/rS5GHtImVMycljyef1rsPh1KsJvJhjJZVrnpLBG6s/4H/wCtV/SZv7KVliJAZtx3KSf6U5U20EaiUrnrC6kQvXtWPqup/wCjyfN2PeubXxDJtwSP+/Z/xqrdalJdKyjPzD+4azVF3NHViYiMGkznrk1dOCYxnpnJxVcRrHyS5IHQpUolTOdrZHFX7NmftIksbKtwpz0Bp0kgLnniqpmBPypLkd9tRy+Y64Xzx7qn/wBaj2bH7VFstggc59qAxEmeenes1LeXJO+5/GPNSmN1wTJKP+2fNV7Ni9qi67sxGOeKVHAJBB/LNVI4mbpPID7x0vkygkCWb8I6PZyD2sS55ilG7c4GRUPyjcN3OeuKrhZgceZKfqgpwDkcu5/4DR7Ni9rEsKWA4b9KlUjH09KqoTjG9wf9w0hkl6ASEdPu9aPZsftYlksdpOTinG4URsA47dKrfv2XDNKntilaOdsY8w/Sl7Nj9sh5mZsfMe/anpI4OSG6elVys2RkS8e4/wAaaPNLYCyZ6Y3Cj2bD2yL6TEl8Z5P9BTVmIjZSeee1Uis4PMbnP+2Kk8ibbgq5z6PT9mxe1XYsNLmMA57dqaJhuHJ6HtUHkzEY8t+PVxSeTP1EbD/gYo9mw9quxM0rNIeSBjsO9SLOBCV3HOPSqgtrrLAoV78Nmj7JPtyWbntkU/ZsXtvImMx3ggkjPHFJ5kjsduTjrgVCbSdl4dwPXIqvdCaytzIsz7iQO3+FJ07DVS/Q1FZlhOSRx6UyGWWSQqiM5A7CsAX903WUsPQ09L68tyZIptjEYPANQ1poWpM6Iw3j9IH5OOlKbG/4zbyY47VT0XVbu61KGOaUsmcnIHNdvxsPPf8Axrjr1503axrCN1qzlksr7fn7M+D9KmW0vRAy/ZGyTxyPX610mAdvzDpSDG37w6+lc7x0/wCU09kn1Oe+wXxx/ouOO7KP600aZqLKP9G4zx86/wCNdMQO5HSlVlCqOaaxkn0E6ZzH9j6gzZaAcYx+8X/GpE0fUcACJB9ZBXS9GJ/CpDgAE9QKbxc+iEoLqzmv7Gv+crHz/tih9HvyB/ql47vXRFs4x/KkIOMZ70fWqnYfIu5zh0S8EI3SQg5x1P8AhSDQrzaT58AB+v8AhXTEcYNNJ4K1P1uYOmc4ug3ZyxuIiMdef8KT+wZ8D/SIyfoa6EfKcY7Gk2/MOP1pPF1A9kupzs2hSw2skzzJhFLY6ZxzWGHBzgq2fRs13V9/x4XA7GJhz9DXn8QT7y/KQOwrswtWVRPmMqseV6DbhW2sAOgyOa1/BsJCXkzY+Zwo/AZ/rWVdK2G5J474rptDg+xabGpPzt8759TXo01qclV6WL9y2ZkUZO1eat2rcVnIxnmZ8cE8fStW2j+cDHAroOY0Ih0wOtXEQnp0PpUMag46VbQdsUxFiFSU5GD2qRW596E+4BjpT14GTRYCCZTsPXn9ayb6ESWrgjGRitxyGGCvbOKoXUQKkAfketS0UmePSRGGWVHJypI6+hpgYhPvHbnpmuh8RWbWmoSSquY5lyPZu9YbS5/dleTg/pXFKNmd8ZXVxgPuSCPWpF4faC23IJ5NOjYqO2frQkjn+Efe9akoUjpwcc+tRSgiXIHGKfLMY0xgckr1oaNtwPGMgdKYiHnAwpppUqSNp596lxz16e1MkYqMg96EAmxmYbQARUuxi7HApu35vvfkafGIz1Y59M+1UIVSccAU1wwPamY23P8AF5eKkbGAApPFAiJgx6H9KGUhRlhj6U1uQfl6+tMKNGuCAaBiEAkjNRyhBHwecetSZI5GBUFwG+Zs4yMdKYmGmQI+oCUn7i5A9zWyrB7jJ/h4rD01289tpB+XBPpW7bQt0AJ78jrXRDY5J7mtFg4ArQhXJwR1rPt1YbTtyAPStaCJi2W71ojMmiQjnmr0IwRnoaZDHtHUfnVjuM7etUI5G4G3Ubo5I23G7/x7NdJNEXBDc8Yrn9SXF/qO0jG4N/46K6U3EHlqzyoMjPWhoSep5Tr2nSaTqksWwmBjujJ7j/61Z6kH1Feoaxb6ZqVmYppVBHKuvJU15reotlePAZA+08MAQCPWsmrGlxyqpHysfpU6mUJtEjbe4DEVWjljOMOOnrU6S5YbGX3yaYieM7CDtAz3Aq7HFG6ghQc+tVEcsMEKT65qZSuccUWAmaz+bcqKMc84pAkW7holOOfmFOUYHXNOjt2Khk5XvmiwXImSErgzR49uf5Co28tflaTcO3yN/hVr7GzN2waemmOBnsOfpRZhczmaNDtxLg9MqP8AGnhlReI2/HAqyY7c4y5PHpSFLfHAbP5UWC5X847cCMc+rf8A1qZ5sq5K7Bn6mreYV/5Zn8TTfMXqsSfiaLCIkmuQmdw/75qaCCe4ff8AaEZSOUPBH6UCfAyQg/CmPcFW+8F/3VpqwGlHBJBbkMQcHcMelToxdCvHPKmsV7p2GBK9NSaQOCrNx2JNVcVjad+N3rw1Q84AyCR0+lJFqShSDbqSepP/AOqkGpFST5cWe1O4WB13jA6Hke1YOs6dDMPOKsTn5gpxz61vf2rJk8R49OaoXUzXKsrYw3XAqWxnPWcktmC0WEJ6jeD/AFrRtdWZ7oLPLlO/tQujRNknzjn/AG8f0qSLRYI5g4Vz6hnyP5U9RHrFtrKeekUdnM7MQAOB1rvgpFuisMHbjFYWi6RbwzmcJluq57dv8a6FuFrkiNvQ4nWoZGmREXc3nKMHjviun+yQTR5mAIAxyeOKovDu1Uk8hTuqvfTzSTeRF91eWH94/wCFdFFXIbsrGjstYB+5gDHtjgVXn1mK2ZjJG21Rn5VziuT/AOEi1Gz1Y2twzFQSSMAZ4/lVKPxe01+Vjj2Lkh3IBLD+grYF3Osk1q2kyyY+YdKqS6tb2xaa6uUVMcLnn8K4m0sLvxBqVwdPRkhBOZSSBWvH4GhDfv7h2f8AvFsZqZvTY1j9w8X0utxSHzmijL8Z6Y9K9D0yaCawjiVg2xApB68VwS+G/wCyz5qyFoR8zDqan03VZJdatltT+7Thjjr7URcZQ0JcWm7nWX1naaba3d5FBHHJ5bfMowTmvB9YIk1Od85+bH6V7X4uvBHoJAPMrqg/E/8A1q8L1A+ZdzMGK5c+9ZTsthqTk7sl0+MGdR1ya2HiDXMAXAGSWGOtYumBxKArqfqK1omn+3AkqQqHgHHes1saLVlxSoJVVH4CpljDLyo/EVS+0TEkCFRk/wB//wCtTxPcpz5aH/gf/wBapuzSyJnjGMYAPtUYjx2P4VTudTuYHUG1ByezVYiubmRMrEgz2LGi4WJXjVgMD6nNPS1UDhgfrUDSzq4DLHkj3qVGlxnEYP0P+NADntm/hAx7UqwAD7uD9KjMkoPLL+A/+vSrLKR8rD8qAJ1iPfp9KUx59sVBumfjzFH0T/69IYp9ufOP4LRZhoWHgR1UbiMHPBxmni2jZgRgn61jTretdxbLyVFHUALj+VXvs9wRu+0uT7Af4UWYaFtoCvygAAU+KIHPGfxqukEpGXncfl/hUghOPlmcn60gIbyNFm+cchOOfeqyrD025z0q0+nq775JHJx2ag6dBsPMmT0wxzTAiSO3C46H2FMxGsn3cj3p5tREVxuK46BuaQ2qu2SrqD6sTQAeZEuflwD7Um+Ajlc/hTZdNXyyYpyrjsxJzRDpxKgSNzjJxu/xpgIzwryoC/8AAaQCNhnGTj0qaTTYSMFyfz6VaTTbNQMLnH+2aVwsZRKBwoUDPrS+YiE7mUA9hitI2VkH5hTPuM037JYl+IUz+NMCooHbAOO9L8rgKpjLg564rQaCCNTiGLpxmhRCMfuIvrsFAilIUVDvGD/Ooi8Sn7y49MitRxbuMGCIH/dAqEeT02qp+mKQ0Zpli5OBTRJFvzkCtpfLCjCruB64okZJPlcLnsQcGlYDHEiM3UZ+lShowRlwK1DKgbgKAOwqJrtc9frRqMz2ki7SKD7mmmRc9fyFaKSxl3bK8nHWrW9AueCcUuYdjD85ecLI30QmkLM4A8mX/v0f8K2fOVByck+nOKHfCgj1HNHOx8pktHKUAEEmfdCM1R1GznniRBG6HOTxXQrON2WI46c1FNPE7HLgED1oUmDjY5NNGuXXcjFh04xUNzp81tDvkLJk4HTmuwEtuNo81M5/vCszXjHcRRRxMDjkkc07ISk77nPWF5/Zt4ty6tJtH3QcZrdbx7FggafJ1zzIP8KxRZx45kGfpULWKgEnGB34rGdCM9ZI0VTsze/4T4AjGnHgY5l/+tTD4+IGBpp/7+//AFqx1sYc53imvbw9M/yrL6nR/lL9tNdTabx/cNnGnIOMcyH/AApw8b3oUbbKH15Y1zxgi3HDHFTrt2gAnA4p/VaS2iHtZdWbLeONSIOLW1X8GP8AWom8a6uei2v08tv8ay8Lu7+9MYJ/DVLDwXQTqPuaf/CYa07ceQv0i/8Ar0N4q1xv+XpR9IlrNUKB93r0NTqkbDmPJp+xh2Qud9yc+I9abrfMPpGv+FNGvawd3+ny++MD+lR+VGOPKH4ipFeNMDYmPYU/ZQXQOd9wGr6u686hPn/exTPt2qSA7r66OP8Apq1XIZwgJ2j2I7VKbk5GMcjHIp8kOwuaXcp20l27ES3M7A8EGRiDUs4C2z4BGB6GrKTEPux19v8A61JqV0n9nyAA5x6YHWmkk9Abb3My0kVpRv5bcMZ+tdQlwzr5ajqOa5bTY5L+52phVXGSa7ey05o8ZH41001ZHLVd2T2UBG0nArZhjwQahgttmPlyR2I6VfiX9etamROg4xirkS8AY/OoEC4BVqsJKGHUD/epiJ147fhTsYUdvpTNwx1B9s1IWAGT060AIQCD61VlXf8Aw4q2rp13KfxqtLNGCQGUfQigDE1bTE1C1ZGAU9Vb0Nec3dk9neNHOSrIR1xg+4r1iW4gVSXkUbuxNYupW+n3qMkxRj0HHI/GspwUjenNxPPCAOd3f1pUK8kN0x0Jq7dWEtnM8TIZFySrjuKpQ29xGWxGuD2zXPyM6PaRFeJZF+6zfNnvSYO3BX0xmphHdE8CMd+pNOFpdMMZAHsppqmxe1iUwULlQCSPamswzgLjmr66XKZC4L5bqQKkGkOSSwc/kKfsmS6yKMal+hAHFNi+Yk5HynHNan9isMFlcD3OP603+yIR18sZ9WH+NV7Ji9sjObgDMi5xjFRswEBKyAkdhitldJgA48r8s1Kun2443AfRafsyfa9jn2eMAfvCxI6Ad6aWaQ/KshH+6a6Q2VsvBJP0FOW1tgM7WxT9mhe1fY5RoLgsSsLke/FQvpl7MOIsexYV2PkwA4EeadsjXOEUY+tNQihOpJnG6fpGoWszM8alWxjDV0MBnjUAwt+FaUcQOSxAz2wKazbD1+X1q1Yzd+o2FpO8bdO9aMFxiMBlYGs43GAQGP8A31SfaIyMkkGmI3Rfxr2OPyoGqQEENJz2wa537Vlv9UT70GaQ42RD8admLQlu5DNd3pQnawH/AKCKsRyfuEJPRR/Ks6HzGklEmMlc4FH224WFVWCIhRgE5yabRMXqW5pV7nryB3rCudMt7u4Mr7t/TrirMt5c9reEH1FZ091dmTOFB9qnlZdx39jW23OG/wC+qjGlQFT/AA+nNRfaLruT+VCyzk88/hRYBPsJRsY6elL9m28EP+ANSBpv7h/75qRRcEcRMf8AgJp6C1IRuQ5Bl49AalGoXCIF3SkDoCtOEN4ekJ/HinizujyxRfqTSuh2Y0atKhHyZ+q1LJr0sluYtoQHqQKQWT/xTj/gIp62aDq0jfQU7hYzWvm9SPwpoumYZEhFa4s4h/A7fU042kZ/5Ypx7UWEYvnuf+WppyvM33Xcn6VtCHy+gUfhThGT/F+VFmF0ZSw3LAdfxqVbWbjLIPrirzCIdW/M1E9zaRY3SqCfenYLkawODgyj8FzUgjIH3s/hVebWbCFc+aHP91RVVvEMT7vJhO0dC+eaWgGllx2pcMe36VzUviO7O5URUOM5FZ51e/lfDTvj2p3QHasY05aRR9cVXl1C1iBDTD6A5rkmuS2Q7k5Hc00ZkHCse3ApXEdSmrW8rEJvOO9PN9EoyxkH4VzMAuYWLCHj3PJqw007ZIiZc8HJFUhH1Vp0Wy2GetWHqsl/bxxBdw+uRUUmq2Y4MwBrkWw2Run+ls2OCAKq3MXlyNIueueKuxulx88Zyp5BolhWRcZIPqK6Ir3bCtqjk9U/sy64uUzIBjdjB/OuJ1Wws7cH7MxGeozXoOr2brG0jWUd0g67TtcVyMw8PyufPsL6Nh2LE/1rnVCSlfmOr28OW3LqdH4Vu9Ph8Pxx24TeoO88Zz3q4l+znG7IyeFXFcpDJodt/wAekV1G57gU+GAud268Knp5k2wfkozXWpJKxzt3d7HU3N7HDayLICZJFIRM5JNZ+lWP2G3Llf8ASJOgH8Of602xWFGYKqiTGePvH8Tyav29u8snIIUdR0qHJX0Hyt7mZ4sZ4dP022L5ZpGlb6AcfzryiUku5ZSCSeor0jxrcKNZS3GMQWmcehNecSue1RPsOCL2lKu/JAOBV6ORBfy84woAqnpuCOVHNWrdUeeZsAZbFR9k0XxF3cpy2QBTDIGP3gAKRooscqKgaCH+4g/4DUljblomkXkFqmik2jGB09ahaGMEYReP9mnHYq8qPpimA5posg7hn6083CE/fQHH94VAcBgUj/Spg2AcDk9aAGC6jL/fVvbNTJdo+4AgH6UwfUZpw7gkmgAMojHUmlW7UKM7vyNISCPegohXnmkBGLmKSY5DZ+hqz9rCp8of6bTVEQqrEqBz6VZX7gywzQA9tSjVcFJif9yo21Uoh8uGRmAyAeKYWJbBI4pWA7kAfSgLg+vCNQ00UinAyOtPGtZXiGTH1FZsybmJB74oEbLknv707CuXX1cs2fJI/EU8attBxE+SPUVmlATksPzo8tSeWX86LAXZdWnx8jMMnkEDFSf2zNx+7Uj03YNZzhEA5U/Q0weTn5iPwosFzRm1eeRSoiRe2SxP9Kj/ALUuMj5EAx6n/Cq3nQLxx6dM0jyQMen5JRYLsmfULrdkeVz2waRb26zuzFkn+6eP1qujx7ioQkn/AGDUi7d3ETMP9ygRaN7duMb05HZf/r037Xc4/wBYCfpUflq2SIGz67aQRjtFJn2oAsI9zJIil8BjyQB0qy9of+fiTP4f4VUTzUdWWN+Dzkippbl1UsyEe5NJ3KVh6Wpxh55T/u4H9KZNaQsFJeVipyMkdfyoDylQCnJ77qZmXGMDP1pWY9CRYwzH55c9/mqQW0ZP/LQ59XNRR+aBgFB+NPJlXnKZoswukSfZkQ8b/X75o2p1I5+tUXurn5h+7B9cE1G0t13ZMey0+Vhzo0DECVKqMCnRquNpRCSeprLaS528yD8qiL3GVBcDnsB/hRyMXOjbAjHPlR8cfdFRTKgdXVQp254GKy0EpY/O351ehUONzsWxgctRy2FzXDdk53CkKIxJIU++Km8qLJO3P/Aif600W8YY4C81SEyLyEQ7iUGfwqpqCp5GNy5J6ZzWkscCHJwT9OKWW2guok3HGD0HFNoV2cxsK/dwfpQ0JIGQQfpXQjTbIHLLkdPmNMms7YoFt413M38JqeUtTfVGAbcBvmOD7irKWsbKpG4+4NabaXLIVOxjjtkD+lOXTbjgYVBjjLf/AFqlwkUpw6mYbRCB978TUyafHjBU59ya0Rpkvd0H508ac/8AFKPwU0vZTB1YGV9jRTygoWFQCAo61q/2Z2Mx/KgaPGeWY/gR/hT9jIXtomXshU4+UH3p48naeVHpzWp/YsGQSjMR05NSrplv0MZP1Bp+xfcPbx7GISpbI6eozTxtXDFuPoeK3k0qA8CEH/gP+NTJpNurcRx5+go9h5i9v5HNNdRbyBuOfSq16k9xbPFFbyEsODiu4SyRR0I/ClVIOnz9cHC1aopPVkus30OI8PWV3p9xI1xE4DYwcZruLS5TgE+/SnrFGRkB8fhThEuSBH+ZrXRGOrL0dzHjlqsJPHj730OaycFW2+VGM9OCak/e7hgJjjkLRzILM2lk4BB4+tPWRSuCR74rGHmnOJCPyprM6cksfoaXMHKbTyKMfNwahMuOhHIrOhuD5pADE4zgsTVs3B6bCD7kjH6U7hYkDZJG38jVWZnBO1SF689aVpmLfeXr/e/+tSKrynPyYK9zUgRSsHj5PtVUDB55Pbmppw6AlioUEAn/AOvmqcrY34cDaOwyaRSYtzCsh5xx2bmqnlbeix4/3f8A69TzTqsZLXKYUjgsB3qpLfoG+SSNu+Rg00mBOI8jsMeiilWMk/fbAPbAqi98zdGP4YFM+3SqxIOM07MV0awjQcYJPuxNRyBQpGf1rKN7Mf4/yFRNO7HlzRZhc02EYPKqPc1HLLAinJGB/drLbnqSaYY1PY0coXL5vYYz8uSPemSalGBgLn3zVHylPrSGEerU7BcnOrOowIc/8CqtJqt033Ywo9qDAOzGm/ZWPAJP0FFkBG2p3Z4KVGdSuO6H8Ks/YpT0B/75oOm3BHH60uZDsU/7TlzzvH0NH29mPzb/AM6urpMv8Uiip10xAPmkP/fNHMhcpQW8U+v4irCXafT/AIDVoWMI9D9acLSLsin8KakKxHHdx/3h/wB81YW5Qckj8QaRbXH3Yx+GKe6yZBaADbxjaDkVV2J2IvN/0wkDAaPtRHIBApOBzgEnrUywQhCTC4Y9OoxVaWwiZgV37eSy5PP60Nuwl5krIWHLAVA1tETlmz9KdHBJDcY2E2+OpOSPwq35IIyFb/vmkk+rHddEUxBAp+4T+FOCIv3YhUzbBgkkc45FNM9ugy0oH0GafJFdQ5mN+bsAPwpdsh6t+lQf2vYZcCQsyckHAqAa7Ayu0MQbae5NHuoPeZdMLH+LNL9lbupP4VlyeIJhMqRQj5lPJOOaoza3etLzJgH0PFLmXYVmdF5QUZZcD1Y4qKW5gh+9Ig+lctLqV04cCWTDryFJqoVLAlsnd13GjnY7HWvq1lGf9YH9dpqpLrsWAYomweORmucgSTGB9amSGbABxj2NF2Ghqtq9xKOAqe4qhdaldyLxKQc9BTPJuMYDAe9ILInmSXJPXAxRaTC6K0twzjDysTjkZ71TZjuGASQcitkWsI/h3fWnrHGOAqj8KaixcxlJC8p+6cY71ItjKcZYKDWrt46U3b9KaiK5nLpgDbjJn14qVbCEHJUmruPb8qTFOwECWsKHiJfyzUoUDgcAe1Lk5xRk9qYhMcHNBBxign3o3e9AHsZn46jrTPOVnA3r16VyY1aL+JZHPqTirWmXUd7q9uiwsSXHBc49a40mapHq1jHstkUdgBSysysfSuTPjqOO8NmlmzMH2bt4x/KoJ/H6pIyHTy204z5uP6V0XVibanXu2yJmA3k9AeBWc9vY3ABurSNGPHzc1zcnj5ZF+bTQR/12/wDrVUfxrCzZOlRNj+/IW/pUjsjof7P02WcCCLcmP+WYx/SrcOkBXzDacdy9covxCkh/1WnQLj/aNNPxPvRnFlB+LGiyDXod3BoyK/mbQjd9oq8trHGCcZPqa8vk+Kupr92wtmH+81X9A8f6nrup/ZHtoIY1RndgCSAB9aasgak0YPimZ59d1i4KnaAI1PrjiuGkDqwIc/jXQXV5JNa6hOzs++bAyfU1zzyKW561lJ3KirGpYyPt+4duOoNaNpNIkTYif5iTnisyxysLNyBitGEsbdCRxik9i47kzSSkDELH8RUTSTsf9Tz7tT95GAM5oDN9TUlXIGluS21YVJ/36Qx3cikFUHuGPH6VMBhy3epUZtpwcA0wuRxW87IF8wEjqetP+zzZ4lGT/s0CTbk7uKYbgZxvUfWgVxxtZQOZ/wBKhaOUMVNxx/u08zREgmZc/WqdxdFrlwhBUEY4Jp2C5ZxKAf3xAHtTMybuZ3P0xVbzZiMhWP4H/Cm75QP9W35H/CiwXLqLk8uy/TAqUxx/33Ye5rPX7QwBWFsfT/69P2T91cenA/xp6Cuy5thGcsT77jTXhjxxzn/bNVVhlPDxv+YFSMJQMiLoO7CloGov2WDqygj6k09be0HPlofqopI0d0yAAD/eb/61Pa1kYDLJhR6k0wAJajpAmR0woo3w5ACoD6d6ijDsCU4Ud/L/APr0fZmDZDds8rTC5ZKox+VVP4Um1uhPHpiom83hd7Y9QBUbrIASZ2UfhSsFyV8bgST16U8XGz+Dr71SMlvgNJdjIP8AE4FPW4tSMCbd9HosFy554IwVHI70sLpGmEChe3NVVWFmztc/Uk09RGFK+U30CsaLBcn+0/P7Uj3S78ZqNYg3EdnI/qRGaf5Fxg409h6HbiiwXHC6QHBKnPvUE93GoOCpHsacbO4aZSbbbg9OlWTYXZGVhUcdzSsFyot6jc7ug9KY17knaJOvHyE1oDS74ISIosnuXqIaVf7v9agweyE/1piuVhc5GRHKT/uGlM7jpG9Xxol4Vz9ojye2z/69B0a5wQ07fRVH9aVguZf+kTfN5bnOe4pVt5m6qAc/xSY/lW1HoUrAn7VJxxgKv+FWV8NwuP3lzcE98SY/kKYXOZe2mznMY/4GT/SgwSkZMq8ema6n/hGbMZ3GduOB5zdaP+EcsAQpg3Ecku5P4daYrnLJFJ1Mq49weP1qeGJ2Vx9qRVGD0+vvXTpo+mqMizgz7oKeNOtFHEES/RQKAucyscKHnUQT35UVITZYH7+Rj/skn+QrpFS3h4Hlj14qwrRgcHPsBS5R3ORRLWTBWK8Y/wDXOSrKQD7os7ll7cEfzrpV8gJk8d+BikMsSgHJI+oo5WHMc21pMqnytLkyecuE/wDiqdDaX7SIXs0jCtnO4f0roDdw+q+vLVCb5NxO6P8AU0cruK5UXG/YYvmzzzxVgRZ48pPzJpn2uFTyVP0Bpk+pDH7tCWHQ8Vd5E6Fr7Pj+FB+FRNCQeNo9cL/9eqja5MgwLNj77gf5Cqc2uXLHK27J+dP3mGhqiBy3OMfhUscAySo6dsVz0mv3YGHAA91xVf8At267SkDOeDRZhodZLFwAWdfxIqB4YQvJBJHR65eTWbuTrMfyAqB7+4cfNMxHuaXKwujtYyka4BUD2OakWZQCeMdfSuC+0yHnefzpftMoGN7fnRyg2d29zAuP3y8VVOoWwkbBbGeOnNcYbuX/AJ6Gmm9l/vZ/CjlQXO2/tS2VdvmAfhzUb6xbBeA7H6VxwvpMcgVYS+PAKjj0qlFBc6QayN2RExpx1t8fJb4+prAS9Q/wtViO9hJ5LD6imoom7NVtXuXH3EX8KYb+7f8AiX8hUKSwN/y0X8amQQt0ZSfY1VkK7GiSdmDF/m9cVIZblhhriTH1NPEa0FAB3/Kk+VBqVir5/wBbJz/tGomQjrJL+D1b2gj+KoXizn5sfWlzRKtIpyxDB/ey/wDfVVJLdWOd7Z960Xi4/wBYuaYtoz9Cp+lTzxK5JGY9p6N+lQvZSZ+Vs59q3haYHzA/hSi0Xr83NLn8g5PM5trW4X0x9aRYbz+FX/A10ptVAyDTkDAY2k+5oTk9kPRdTn0tdTIyEkHuTU6WWpnGWUfU1thJD2pPIfPLYqlGTJ5oozo9OvMZe4jHsFzU6WTD78oJ9lxVwW7H+PI9M0vkgdR+tHJLuHNEqeQi9cn8aAkf9yrXlLnoRQIx/ep+z7sXP5Fb5R0U/hRzngc/WrYiyeMmpBayHnysij2ceoc7KW58YBxTsTH/AJaNVoxKnDNGpPYuKieWFGw0yf8AfVO0UK8iAwk8MxJ9zThbKOTUM2rWcLEF2Yg4wCAP5ZqN9aiXlIVKj+Lluf0o5ooLMuiJMcZNSC3LAERtj1PArnrjxbcJJ5UK7Tg9qE1a+kYgSDGOTjP86XOLlOhaNo/vFY/95gKiM8QOTP8AKOpUdK5iW8urjzN8rnqMgYwKhRZDCzbiSeBk0udj5UdS+pWCADz2Yk4AJxmoJ9at4EVo4wwJ2ktk4Nc0qEOCwPynIPrT2wYipAAJyaTkPlRpS+J5FuHiRQuPukADNZt1r10wLbsnJByxrPdlmmGzntuFWEsgwJdl59MmgCOLVbl7aeOW4YMRkAHHSnC4R3Dg5xzTxpsLvneQAOfeporaGFSEA3f3iKaTYGb5rNeqwQD5dvAxn61PGrJkccjpnmrjQISDyfc0vkj0/Onyk3KMgZ3A5+Xjmg20hUEhVPUc1f8AKUH/AAo2qBTUBNlVYCAMkE04wo3p9CanwOxpCvuKrlQXZGsYUfKMfSl24704Zz3/ACpcU9AGfjSZx0JqQg4yBTcPigRHnJ60A84P55p+MdTTcg/wnPrQApHFM3E9Aw/CnDkdBQAfagYzB7Gl57mn8Hpik28daAGkZGKYVHr+tSFcdKMZ7UCGgYHWkIx1FLijHvzQBv7M9SK3PDCJHeTXJ+7BCzZ98cVTXTjjqBWjapJa2Vxbo0Q88AF2PIFZWLuZ9jiXVBIT/EWP61UmZGldsnkmtD+zoud12g+mKZ/ZtqB/x8k/Qf8A1qAM0uq9AaYZk9K1hploessh/A/4UHSbDqfOP4GkBjGaP+7UTTR84UVsmx09X2+VKxxnH+TTxp9ofu2bH6sB/WlcdjnjMvZRXSeFD5Gm63f7ceVbbAfdqUaZB/z6KPq//wBarkdvLDZyWsShIJSDIitkNj14oTV9x2drHHPJjRjEnMrS7ivtishxNuy0ZrvzYInWKIDtkE/1pG05MZ2x49k/+vUtJj1OUtE/0VsMRketacbgRqC/G0d6020SCYbW4BHO0AZqMeFNPUf6veO+XNJoadiizREZ83GPcVX82IEgzYH+/WxD4f0tZSGtY9voRmtCPQ9IUArawg9eaVh3OVMtqq/68f8AfdPW4tCmNwb6sTXVi00yGQL5MQHU4NP8vSyPkjjY5/u5p8ocxx5ubfAVYyfcRE/0pyXEadLeRj6+Uf8ACuxiS1UcRof+ACphJDH8wVR9BiiwXOLFyWYAWkpPoEpIjMC2ywmOTnJx/jXYS31qW+c9PQ1Xa9tQ3yEd+CRRyiuc+kV9u3LYOM9zTlg1B2IFkPxf/wCtW2dRiB6pz3zxTBfxFidyr+tPlY+YyzZ6qoBFvEq+7k/0pw0/UZACViGf9nP9a1W1OLA+Yn8KZ/a0WRjJx7UcjFzFNNH1A4zJEM9AFP8AjT20C6KjzLkDPZVqyNWXcO49Kc+tKAMRdPWjkYcyKKeHLnaM37gdAAinH6VLH4WJwZNSujnsAAKmbXTwBGAB2JqOTxFchdqQRH3JJ/rTUJC5kTp4XtlwDcXJB9ZCM/rUn/COWatwZW+r5rLbxNdj/llEP+An/GoZPEl467d6qP8AZUCnysG0bL+HbDkNEGHuaSPw/p6Hi1hPpnmudfWLlusufwFMXVrtM7Z3XPXbxRyMOZHVrplnGfltoV/4CKn+z20a/wCri57bRXFnVLps5mc56/MaZ9ulznzG/OjkYuZHco0C/dSLaO+0VYMsQ4JCfkK88N056uaaZ27GnyBzHfyzWi4LzRgD/bGaqyXtknW4BA5wCDXEGdz1Y03zWz1NHKg5jsDqdiGJ8zk9eKX+2bBFGWZj3wK47zCe5pC5PehRQczOxbX7IL8ivn0xUbeIoONsJ/OuR3HHWk3n1o5UFzq/7fiLZwFPvTzrm8kqyVyW/PejfTsguzrDq8jZwxGe4pp1ecdHP51yyzOOVYj8akF5KO+frRZCuzpDq859D7mmf2tMONxFYAvm7qPwNPF6vfIp2Qam1/ak+MB259KjN9cHnzG/Os1blW/iFSbs0aC1Lhupm6yH86abiXH+sOPrVbPFNOc0wLX2mbH32pPtMh6t+lVlPvUg54zSAnFy3cCj7UuOVI/GoNrEcA/lR9nncYWNj9BRzDsTi5jJ64qQSIejj86rJp103/LP8yKmXSbtiBsQf8CqXNLqNQbJc+jUmMjJp66POp+Zwp+h/rUy6XMF/wBcSPpS9pHuPkZV2g8EAj3GaY1pA3JgT8OK049OCjL7mPf0/Sn/AGaA4wefel7RD5GYbabbt0Ur9GqM6THn5ZGH1Ga6L7NbH0z704RW6YIeP245pe0XYPZ+ZzB0mUfckBHoQaY2l3g6RA/QV1geLGBJj6CmGSEDHLEDrtHNHNJ7IOVdzkf7Lvif+PdvxqRdEvG5wij3aumMw/5559ajMzc7UAz9TTSqPoHuLqYSeH7hj80qL9MmrcXh3n5rj8lxV8vMepFOXfj72PpT5Zi5ooqrocSkBnkb8qnTSrVTzk/7zGpV3E1IoYZO01SpN9ROaXQYtlbKeEQ/hUggiX7qKPotOA9QRT1XOcEEU/ZeYvaPsReWQcjgeooUuDjJqcR/jS8Dkj8jT9lEXtJEWeOpP1phQseqirO1SAcAn3NMIUdMD6LT9nFdBc8n1IfswPpj608W20cACnmQgcE1GSx5J4qrIV2IybT0X86XBA5x+JprqWHykfX+lMNtMwysXXjcxIFDdhjzj+LFJvQfw7vwpEsp8hpJUjX2+Y/rxT5b20gQjeJNo5x/j0qXJC5Rocv91AKa7OgyzBBnGTxWfL4ljZClpGmem7GT/hVD7RJdLI853kcj6VLqFchumWML81wmfQc/yqBrq2Xq5JHXAx/OseR2+XKhTzwpyCOxpFC7mz9w4AI96lzZSgjX/tS1CgpEze5eoH1gBQyRoMnHTI4rJj3CFAy4IXHNQvIoDoVYrzxjilzMLI0T4iuJd4jwFB+9isu41y9ljk+cYHYjP+eKfGqlfLtkC7vUdajjtGfggIATkCldgUZL+9juY3lkfJAbCjANWoLnM/JypHJPOfSp2s3kKoULgKeQp4pqaTdCUFIyFJBy3FFmF0QzJulLA5Oc9KkjLsFJXgnGP51aGn+RuEkwLZJ4GTUQiIY5ckZyB6U1BsXMimbUPd+ap9sAVdUOI3Csq5GCTQEVM4GFJ9KNy4xkEe5quRhzIqxuw3Agkf7PerKFRGE2sfc8Ub16UZHpmq5ETzACQxIVcdBkVFLEs4xKm4eg4qUfSnAcdMfWnyoV2VkhjjG2OHaPalYtj/VVYJFIWxniqsIgDMP4D+VOycZIOfpUnNIfxoAaCOmD+IoJ7UuB6nH1oOey0ANxg4pDwf8ACnde2KTb6AflQAmMigAHrS7ce9ISQOFoGAApKFLcfJTix5G05oAbtOe1BiUnJp24k9KazHtyaAAovQL+VNIwOBgijc2OR+VNB5yBzQAmJOxWmsJFGcpin5YdgKTcT8u7P4UAJk4yAM+1Ju2/jTigC5I5pBkcbRigBQAeaCRSfTFI2R3WgAO3qW/KjCmkGcZ4/Ol5PI6exoA6hZbcjrk++TUqzwAfw/gKwUn444qQTE8dqy5PMvmN37VDgDIHHpTvtEX96sMSHtTvMaj2aDmNtLxQdqjJHvip/tX7okABuw3VzvmNng81Klw+MN+dNU0HMzUEj+YX+TceM5qQTyAcOmazQ5Ydadk+po5ELmZfNxKTzKv4CnG7cD/Wn6YrOz7mms2O5p8sQ5mXmuy2MsePel+2ZGOv41ls9N3n1NHKguzU+1kHoKabtmGN2KzN5z0NOBNKy7BqXmnLdTSC4I71Ty2KQZp6BqW/ODHPel8/A7/hVQEjpTirGgCybn6/nTTOT2qDBA5owT3NO4EjNuByBUBV8/Kaftx60BT6UXFYgZ3HU03zT0JNWipPUU0wBug/Kk2Mr7x6nP1oL8d6ke0ccrz7VAY2U85B9KLgO8z60u/jpTNp7mgLz3pAO30u803j1ooAcWJHIBqMxo2eMfSnZPpmlVXb7qkn2FFx2K7QEfdOfrUTB16qa0Ps85/5ZSf98mnC0nP/ACyf8RS5kFmZe6jdWt/Zc0g5hP1ph0KVvu4X6mlzLuHKzL3c0u6tNNAuCeZIwfxNTReHXbh5wD3AXNJzj3K5GY2e1HI7V0SeGou87n6AD/GpR4dtUGXaX8x/hU+1gP2cjmMnpRk+ldYmh6fx8jH/AIGam/suyj48iL/gQpe2XQfs5HGbj6UZJ6A12yW9hH0hi/75BqRTZoflEQ+gFL2j6IPZrucQI5W5EbH6Cnra3LjiCQ/RDXbm4hHRaa1xEf8Alln8KanN9BckV1ONXTbw/wDLu4HuMVKNGvnP+oIPuwrqWnTgqhz70n2kr/yzB+pp3qdgtDuc6nh+9bGdi59SanXw1N/HMn/AVNbBvX/uAUovJCeoH4UrVWP92ZieG0z89y3/AHzj+dWI9AgTnzpT9CBVozytwX/IUwu/985p+zqdxc0OxImlW4AGHb3LU/7BboeYVPuTVctIerk/U03Le5p+yk92HtI9EXPJsQPuRDjqADShrVRjKD2//VVHOOuaepAFHsPMPa+RcMtsuDjJ9hUbXEBPEbfjUHFGAT/9amqCXUHVZMLoJ0iyPTdil/tCQdI9vvVcLSkD/Jp+xj2J9rIm/tCYnqB+FMN1Mx5c1GaAMn/61UqUV0F7SXcUyO3VmP403PopqRV96kCE9hV8pNyAH/ZNO3H+6fxqUKwzwakWNvX86dhXK4ye3607BP8A+qp/K7nmneSPeiwXK5Unvn8KAg9OateR9aUQY7UCuVvLB9qdtX1FWRH9BSmNMdcn8aYr3K+w46HFPVGPPAqdYeMgN+dPEeP/AK5oAgww6UoQnnFSlHznK4+lISFQ/MR9KAGbAeMmjYnfr9aFPmY2I7Z+oBp5tyOkaL65+Y/5/GldDSGheMq1MLqPlLqW9M804tGjEO4HsSefwqncapZWyFQVJ68tgUnIdiwIZH+7H1/vMB/9erH2OKNd8s6dM43Y/wDr1ylz4jbA8ogo33SgwKzF1W8lcneF4PXnNQ5lcp2s+oW1iu5YlPHDAdfxP1FYtx4oVpNkQ5PQr/8AX4rnZJ3kbbJIzlRxk5x06VW2BlJBxjtUOQ0jY1DUrm5uGjEpxt+Qk8/jVEGV3DSBhleQT3piB5ggC8AYyD1q+sTlY2Jzt61O5RmadGfPlG04Bxj0rUZilvJsG4sCMCpLWwPmkgEBsVrwWltaqXmfK9znGKpRFzWMGzjunBDxHaOAxq4bGZlBBUEdMuP5CrcupWSgmNizenQVkm8l2nbwGPZuavkRPMy19kjhVfNuFX2xzVMxxhy63JZf7hTg0IFOWdiGJ5yM05oECBlmjPH3eQapRQmx2+HIxAvH+0alF8yAeVFGn4VT9SO1G7PpTshXLj6hOeN/PbioGlkkbLOW+tRbucUoLHtxTsIkfAwUdySvzcY59qYBxgnFIDyaMHoM80DAoCM0giU4yKdhqXJ9DQIj8tRjAH1p+AB2p2PWjj2BoAbnjpTS6gdPxpxAPPf2pP8APNADN6seDSkY6ZzTiqZ9TSBTnIoAQZxS/KGOeR6CggjtQVANADNw5GR+NIcE56fSnfJnjr70xuKAFUHtSjNNUHtQck4BoAU5wcUzOOrL9KXY+c7vypPLx1xmgY4SKRyf1prsAMqQSPWmFZM8KMVIImK9h+dAEJlc9V/KkDsTnZipxHtGcqT/AJ9qAwbqCPY0ARfMaDkVMQvUKKTyx1xj8aAIgQe9BXPcVIVRerAU0BM4Dj86AGBBn1/GlA9ulOKqO9RlR2zQIXI6YppC5+6KPLI5zTgKBjdqjoBTgw9MUmKaQAeaAJ48k9DVpFPcVXiq4h4FQhjghxTxGO9NUn1p45oYCbRShQO9KoFOIFUAiZXucVaXDAFearDrUg+UjHFJsZMIwelMlUVMpJNRSk5NAiqV5oC04nmg0mMTbkUBCMc09R81W1hjI5XP41LlYaRUGKXC+tW5IY1jyFANIqKP4RS59CuQqgj1pwGexq2oHoKkUDPSodWxSplMKSOFJP0pRDIeiNWlGoz0p+Bu6Vm677FKiZnkzAcpTltXbqVWtRec0kqLsztGaPbMPZIz1snY/eBp/wBi2n5nx+FSZK4AOKnXlDmk6silTiVltYf4pX/KpPsFsw5dz9aVj8w+lRvK6pw3eneb6haK6CLpVsDk5kB9WxT/ALJZxnDWwH1yagM0mfvmkLs/DMSPc0+WT6kuUV0LS21oPuxRc9toNSiOAD/UxAe6iszJ3AZNSDpT9i31E6qXQ0fMt04/dD6YoaaAjHy1njmn7R6dqv6uu5LrdkWPPVekn6U37amfnQnHcCq460N/Wj2Eeoe1ZaN6gHyoT9aabxuvl/rVRgAMinISVpqjAXtZFg3Mp+7hfoKa8jNgsFJ9SM1ET8opSTgVapxXQTnJ9SQTSLwJCPwpDJL1Lsc0mOBUgAp8kexPMyPfnglvzoCoaeVHPFMwB0p2Qrtjtq0Mq9xTQxB4NSDkc1VgGBeeCfpSksDwufoafS+lAiPef7uPqaXJI6j8qVuXAPSkKgA4FAAQf7w/Kk2A96eO3HanqoI5FAEXl+hpu3afvD86tbFx0oVVx90dPSgCqATxx+dSBTjHFTE8Yo2gsM+lAiLyznkUGAnoo59alAG7GOKlUDHSgCuLduxxS+Qw9/xqR+OM0ijb0707CGeS2OhFNEDE8gfWrsLEgZNLKBgHvQJsqfZmH8Qo8lgemcVIwDEZpyE5PPQ4oGLHDu7U/wAsgjirEXapR3oBlQR98H8qlESnt09amY/L+NR5ODzQAeWhHBApPJUc7zTegJFNViwwTQMkUAHGSR70pIHBUEfXmqD3Eq3LIHwoxxirB+ZckknPrSTBk6yxr14pDdR93FVbkBEyo5qO0UTsBJ8w9O1FwsWzdR5wpyfQDmlxKekbL3yxqSLhSAAAOmBiq17PLFAGRyCTj1qXIpRJioXmSRx/upx+dRm9sYsE4dh3OWNZ8sjsmWYkkdz9awZJ5Wd1LnGDxUOTGkdBceIUGQkabj03tz+VZF/r9xuC+YxJHIHygVgj5bkY71dIDoSwyQuam5RWu7y7dgfOKc9j1FNODFuJyc9+9EgyVz6Co5j8+O1ACWylLVo2IwHOPpTBEwlHz/KfTpmnRjKHPNXreNP3Y2jFICKKDMvAxx6VZh0z97nOAa2LOGNsEqDzS37GO3G0AZbHQdKtRJ5islrDAhBCDjuRk1Zt7ixhTcWiPPQt3/OsKZmLbiSTyOacv+rJ9TzVpJEl251uXeywRRRqDwVyc+9Upp5bj5pHy3QY4qPPyZpTzHnvmnYLkYj3DjIJ96kCAEnjP0pclWXB69aUEnBzyaYhhjznbkDNGzjJGKmX/Vqe5PWkUDNAyMIMck0KgC80pJL47GlPWgQbcCkJ6ZPIpByxpRx+dAC7eMj86QAilPekYkYxQAm40oJ45P51XunZEXacZNVPNkJHzt+dAzRLkHqc9qTc3eqUcshkALEjPereSD1oAfuJFIWOaUfdFB6fjTEGR1ozjpn/ABpO9KQOKAAMD2NJ1PNOA5FDdD9aQEe3Hem7Rnk0Sk4696arE9T3oAk24HBo2gHNGMUdqADHXmkFKvPWlwATigAPbFAYgUmeBUZYknmgCXJoJ/E0z0pQBigBcZHIH0xSFUwPlFB4pVAI5FACbRjO0flTSq45UH8KcaZmgBpjXH3QPpQY1A4yPcGnHqKax5oAaQw43Z+opuH9Qfwpw/rTW60AGHH3iv5U0h+g2n8aUkjFPNAH/9k=",
    style: {
      width: "130px",
      minWidth: "130px",
      height: "120px",
      borderRadius: "8px",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u98EF\u5E97\u540D\u7A31",
    value: data.hotelName,
    onChange: e => upd("hotelName", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u5730\u5740",
    value: data.hotelAddr,
    onChange: e => upd("hotelAddr", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "fh-in",
    placeholder: "\u96FB\u8A71",
    value: data.hotelPhone,
    onChange: e => upd("hotelPhone", e.target.value)
  }), mapUrl && /*#__PURE__*/React.createElement("a", {
    className: "fh-map",
    href: mapUrl,
    target: "_blank",
    rel: "noopener noreferrer"
  }, "\uD83D\uDCCD \u5728 Google \u5730\u5716\u958B\u555F")))));
}

// ---- Weather (Open-Meteo, no key) ----
const WMO = {
  0: ["☀️", "晴"],
  1: ["🌤️", "大致晴"],
  2: ["⛅", "局部多雲"],
  3: ["☁️", "陰"],
  45: ["🌫️", "霧"],
  48: ["🌫️", "凍霧"],
  51: ["🌦️", "微毛雨"],
  53: ["🌦️", "毛雨"],
  55: ["🌦️", "強毛雨"],
  61: ["🌧️", "小雨"],
  63: ["🌧️", "雨"],
  65: ["🌧️", "大雨"],
  80: ["🌦️", "陣雨"],
  81: ["🌧️", "強陣雨"],
  82: ["⛈️", "豪雨"],
  95: ["⛈️", "雷雨"],
  96: ["⛈️", "雷雨+冰雹"],
  99: ["⛈️", "強雷雨"]
};
const wcode = c => WMO[c] || ["🌡️", "—"];

// 任一即時 widget 掛掉時只顯示錯誤卡，不讓整個 app 白畫面
class WidgetBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return /*#__PURE__*/React.createElement("div", {
      className: "widget-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "widget-err"
    }, "小工具載入失敗，請稍後再試"));
    return this.props.children;
  }
}
function WeatherWidget() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Asia/Bangkok&forecast_days=7").then(r => {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).then(d => {
      if (!d || !d.current || !d.daily) throw new Error("bad payload");
      setData(d);
    }).catch(() => setErr(true));
  }, []);
  if (err) return /*#__PURE__*/React.createElement("div", {
    className: "widget-card weather-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83C\uDF26\uFE0F \u66FC\u8C37\u5929\u6C23"), /*#__PURE__*/React.createElement("div", {
    className: "widget-err"
  }, "\u8F09\u5165\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66"));
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "widget-card weather-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83C\uDF26\uFE0F \u66FC\u8C37\u5929\u6C23"), /*#__PURE__*/React.createElement("div", {
    className: "widget-loading"
  }, "\u8F09\u5165\u4E2D\u2026"));
  const cur = data.current;
  const [icon, desc] = wcode(cur.weather_code);
  return /*#__PURE__*/React.createElement("div", {
    className: "widget-card weather-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83C\uDF26\uFE0F \u66FC\u8C37\u5929\u6C23 ", /*#__PURE__*/React.createElement("span", {
    className: "widget-sub"
  }, "\u5373\u6642 + 7 \u65E5\u9810\u5831")), /*#__PURE__*/React.createElement("div", {
    className: "weather-now"
  }, /*#__PURE__*/React.createElement("div", {
    className: "weather-ic"
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "weather-temp"
  }, Math.round(cur.temperature_2m), "\xB0C"), /*#__PURE__*/React.createElement("div", {
    className: "weather-desc"
  }, desc))), /*#__PURE__*/React.createElement("div", {
    className: "weather-days"
  }, data.daily.time.slice(0, 7).map((d, i) => {
    const [ic] = wcode(data.daily.weather_code[i]);
    const dt = new Date(d);
    const md = dt.getMonth() + 1 + "/" + dt.getDate();
    return /*#__PURE__*/React.createElement("div", {
      key: d,
      className: "wd"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wd-d"
    }, md), /*#__PURE__*/React.createElement("div", {
      className: "wd-i"
    }, ic), /*#__PURE__*/React.createElement("div", {
      className: "wd-t"
    }, Math.round(data.daily.temperature_2m_min[i]), "\u2013", Math.round(data.daily.temperature_2m_max[i]), "\xB0"), /*#__PURE__*/React.createElement("div", {
      className: "wd-p"
    }, "\u2614", data.daily.precipitation_probability_max[i], "%"));
  })));
}

// ---- Exchange (Frankfurter, no key) ----
function ExchangeWidget() {
  const [rate, setRate] = useState(null);
  const [updated, setUpdated] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=TWD&to=THB").then(r => r.json()).then(d => {
      setRate(d.rates.THB);
      setUpdated(d.date);
    }).catch(() => setErr(true));
  }, []);
  if (err) return /*#__PURE__*/React.createElement("div", {
    className: "widget-card rate-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83D\uDCB1 \u5373\u6642\u532F\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "widget-err"
  }, "\u8F09\u5165\u5931\u6557"));
  if (!rate) return /*#__PURE__*/React.createElement("div", {
    className: "widget-card rate-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83D\uDCB1 \u5373\u6642\u532F\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "widget-loading"
  }, "\u8F09\u5165\u4E2D\u2026"));
  return /*#__PURE__*/React.createElement("div", {
    className: "widget-card rate-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "widget-h"
  }, "\uD83D\uDCB1 \u5373\u6642\u532F\u7387 ", /*#__PURE__*/React.createElement("span", {
    className: "widget-sub"
  }, "\u66F4\u65B0\u65BC ", updated)), /*#__PURE__*/React.createElement("div", {
    className: "rate-big"
  }, "1 TWD \u2248 ", rate.toFixed(3), " THB"), /*#__PURE__*/React.createElement("div", {
    className: "rate-rows"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rate-row"
  }, /*#__PURE__*/React.createElement("span", null, "NT$ 1,000"), /*#__PURE__*/React.createElement("span", null, "\u2248 \u0E3F ", Math.round(rate * 1000).toLocaleString())), /*#__PURE__*/React.createElement("div", {
    className: "rate-row"
  }, /*#__PURE__*/React.createElement("span", null, "NT$ 5,000"), /*#__PURE__*/React.createElement("span", null, "\u2248 \u0E3F ", Math.round(rate * 5000).toLocaleString())), /*#__PURE__*/React.createElement("div", {
    className: "rate-row"
  }, /*#__PURE__*/React.createElement("span", null, "NT$ 10,000"), /*#__PURE__*/React.createElement("span", null, "\u2248 \u0E3F ", Math.round(rate * 10000).toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    className: "rate-meta"
  }, "\u8CC7\u6599\u4F86\u6E90 frankfurter.app\uFF08\u6B50\u6D32\u592E\u884C\uFF09"));
}

// ---- Budget ----
const DEFAULT_BUDGET = [{
  cat: "✈️ 機票",
  amount: 15000,
  per: "person"
}, {
  cat: "🏨 住宿",
  amount: 56000,
  per: "total"
}, {
  cat: "🍜 餐飲",
  amount: 1500,
  per: "person-day"
}, {
  cat: "🛍️ 購物",
  amount: 10000,
  per: "person"
}, {
  cat: "💆 SPA",
  amount: 3000,
  per: "person"
}, {
  cat: "🚕 交通",
  amount: 12000,
  per: "total"
}, {
  cat: "📌 其他",
  amount: 10000,
  per: "total"
}];
function App() {
  const [tab, go] = useHashTab("home");
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(Header, {
    tab: tab,
    go: go
  }), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, tab === "home" && /*#__PURE__*/React.createElement(Home, {
    go: go
  }), tab === "days" && /*#__PURE__*/React.createElement(Days, null), tab === "extras" && /*#__PURE__*/React.createElement(Extras, null), tab === "info" && /*#__PURE__*/React.createElement(Info, null), tab === "pack" && /*#__PURE__*/React.createElement(Pack, null)), /*#__PURE__*/React.createElement("footer", {
    className: "ftr"
  }, /*#__PURE__*/React.createElement("div", null, "\u66FC\u8C37\u4E4B\u65C5 \xB7 2026.08.18 \u2013 08.24"), /*#__PURE__*/React.createElement("div", {
    className: "ftr-sub"
  }, "\u73A9\u5F97\u958B\u5FC3\uFF0C\u6CE8\u610F\u5B89\u5168 \u2764\uFE0F")));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));