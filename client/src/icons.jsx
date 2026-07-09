// Small inline SVG icons (no emojis). Stroke uses currentColor so they match text.
const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Gem = (p) => (<svg {...s} {...p}><path d="M12 3 20 9 12 21 4 9Z"/><path d="M4 9h16M12 3v18M8.5 9 12 21l3.5-12"/></svg>);
export const Dash = (p) => (<svg {...s} {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>);
export const Box = (p) => (<svg {...s} {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>);
export const Truck = (p) => (<svg {...s} {...p}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>);
export const Chisel = (p) => (<svg {...s} {...p}><path d="M14 4l6 6-9 9-6-6z"/><path d="M11 7l6 6"/></svg>);
export const Sale = (p) => (<svg {...s} {...p}><path d="M3 3h2l2.4 12.3a1 1 0 0 0 1 .7h9a1 1 0 0 0 1-.8L21 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>);
export const Money = (p) => (<svg {...s} {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/></svg>);
export const Users = (p) => (<svg {...s} {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2-1-3.5-3-4.3"/></svg>);
export const Logout = (p) => (<svg {...s} {...p}><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 12H3m0 0 3-3m-3 3 3 3"/></svg>);
export const Plus = (p) => (<svg {...s} {...p}><path d="M12 5v14M5 12h14"/></svg>);
export const Edit = (p) => (<svg {...s} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>);
export const Trash = (p) => (<svg {...s} {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>);
export const Search = (p) => (<svg {...s} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>);
export const Close = (p) => (<svg {...s} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>);
