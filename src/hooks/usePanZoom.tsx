"use client";
import { useCallback, useRef, useState } from "react";

type Ptr = { id: number; x: number; y: number };
type Options = { min?: number; max?: number };

export function usePanZoom(opts: Options = {}) {
  const MIN = opts.min ?? 0.6;
  const MAX = opts.max ?? 5;

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const ptrs = useRef<Map<number, Ptr>>(new Map());
  const pinch = useRef<{ dist: number; contentX: number; contentY: number; scale: number } | null>(null);
  const pan = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const bbox = () => svgRef.current!.getBoundingClientRect();

  const toContent = useCallback((clientX: number, clientY: number) => {
    const { left, top } = bbox();
    return { x: (clientX - left - tx) / scale, y: (clientY - top - ty) / scale };
  }, [tx, ty, scale]);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1) {
      pan.current = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const c = toContent(midX, midY);
      pinch.current = { dist, contentX: c.x, contentY: c.y, scale };
      pan.current = null;
    }
  }, [tx, ty, scale, toContent]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1 && pan.current) {
      const { x, y, tx: sx, ty: sy } = pan.current;
      setTx(sx + (e.clientX - x));
      setTy(sy + (e.clientY - y));
    } else if (ptrs.current.size >= 2 && pinch.current) {
      const [a, b] = [...ptrs.current.values()];
      const newDist = Math.hypot(b.x - a.x, b.y - a.y);
      const s = clamp(pinch.current.scale * (newDist / pinch.current.dist), MIN, MAX);
      setScale(s);
      const { left, top } = bbox();
      const midX = (a.x + b.x) / 2 - left;
      const midY = (a.y + b.y) / 2 - top;
      setTx(midX - pinch.current.contentX * s);
      setTy(midY - pinch.current.contentY * s);
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) { pan.current = null; pinch.current = null; }
    else if (ptrs.current.size === 1) {
      const only = [...ptrs.current.values()][0];
      pan.current = { x: only.x, y: only.y, tx, ty };
      pinch.current = null;
    }
  }, [tx, ty]);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { left, top } = bbox();
    const content = toContent(e.clientX, e.clientY);
    const cursor = { x: e.clientX - left, y: e.clientY - top };
    const s = clamp(scale * (1 - Math.sign(e.deltaY) * 0.2), MIN, MAX);
    setScale(s);
    setTx(cursor.x - content.x * s);
    setTy(cursor.y - content.y * s);
  }, [scale, toContent]);

  return {
    svgRef,
    transform: `translate(${tx},${ty}) scale(${scale})`,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel },
  };
}
