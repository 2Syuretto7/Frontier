// 16 px line icons, 1.25 stroke, rounded caps, drawn in currentColor.
type P = { size?: number };
const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor",
  strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const ChevronRight = ({ size = 16 }: P) => <svg {...base(size)}><path d="M6 3.5 10.5 8 6 12.5" /></svg>;
export const ArrowLeft = ({ size = 16 }: P) => <svg {...base(size)}><path d="M13 8H3M7 4 3 8l4 4" /></svg>;
export const ArrowRight = ({ size = 16 }: P) => <svg {...base(size)}><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
export const Check = ({ size = 16 }: P) => <svg {...base(size)}><path d="m3.5 8.5 3 3 6-7" /></svg>;
export const Lock = ({ size = 16 }: P) => <svg {...base(size)}><rect x="3.5" y="7" width="9" height="6.5" rx="1" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>;
export const Close = ({ size = 16 }: P) => <svg {...base(size)}><path d="M4 4l8 8M12 4l-8 8" /></svg>;
export const Menu = ({ size = 16 }: P) => <svg {...base(size)}><path d="M2.5 5h11M2.5 8h11M2.5 11h11" /></svg>;
export const Clock = ({ size = 16 }: P) => <svg {...base(size)}><circle cx="8" cy="8" r="5.75" /><path d="M8 5v3l2 1.5" /></svg>;
export const Pen = ({ size = 16 }: P) => <svg {...base(size)}><path d="M10.5 3 13 5.5 6 12.5H3.5V10Z" /></svg>;
export const Spark = ({ size = 16 }: P) => <svg {...base(size)}><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2" /></svg>;
export const Send = ({ size = 16 }: P) => <svg {...base(size)}><path d="M8 13V3M4 7l4-4 4 4" /></svg>;
