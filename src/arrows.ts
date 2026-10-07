import { boardSquareCenter, isBoardSquare, type BoardOrientation, type Square } from './controlled-board-renderer.js';

/** Appearance names deliberately describe geometry, never a chess assessment. */
export const ARROW_STYLE_SLIM = 'arrow-slim-point';
export const ARROW_STYLE_BROAD = 'arrow-broad-head';
export const ARROW_STYLE_ROUNDED = 'arrow-broad-head-rounded-tail';

export interface ArrowGeometry {
  from: { x: number; y: number };
  to: { x: number; y: number };
  unit: { x: number; y: number };
  weight: number;
  color: string;
  opacity: number;
  outlineOpacity?: number;
}
export interface ArrowPrimitive {
  /** SVG path in the shared 100 × 100 board coordinate system. */
  d: string;
  fill: string;
  fillOpacity: number;
  outline?: { color: string; opacity: number; width: number; maskInterior?: boolean };
}
export interface ArrowPrimitives { layers: readonly ArrowPrimitive[]; }
/** A pure shape can return several painted paths in a deterministic order. */
export type ArrowShape = (geometry: Readonly<ArrowGeometry>) => ArrowPrimitives;

const point = (x: number, y: number) => `${x} ${y}`;
const outlined = (d: string, g: ArrowGeometry): ArrowPrimitives => ({ layers: [{
  d, fill: g.color, fillOpacity: (g.outlineOpacity != null && g.outlineOpacity < .9 ? .4 : .6) * g.opacity,
  outline: { color: '#fff', opacity: (g.outlineOpacity ?? .92) * g.opacity, width: .55, maskInterior: true },
}] });

/** Original short, narrow point. The tip ends inside the destination square. */
export const slimPointArrow: ArrowShape = g => {
  const { x: ux, y: uy } = g.unit, { x: fx, y: fy } = g.from, { x: tx, y: ty } = g.to;
  const squareEdge = 6.25 / Math.max(Math.abs(ux), Math.abs(uy));
  const start = squareEdge * .9 * .5, target = -squareEdge / 3, shaft = 1.85 * g.weight;
  const cutRun = -shaft * Math.tan(Math.PI * 123 / 180);
  const x1 = fx + ux * start, y1 = fy + uy * start, x2 = tx + ux * target, y2 = ty + uy * target;
  const bx = x2 - ux * cutRun, by = y2 - uy * cutRun;
  const d = `M ${point(x1-uy*shaft,y1+ux*shaft)} L ${point(x1+uy*shaft,y1-ux*shaft)} L ${point(bx+uy*shaft,by-ux*shaft)} L ${point(x2,y2)} L ${point(bx-uy*shaft,by+ux*shaft)} Z`;
  return outlined(d, g);
};

function broadPath(g: ArrowGeometry, rounded: boolean): string {
  const { x: ux, y: uy } = g.unit, { x: fx, y: fy } = g.from, { x: tx, y: ty } = g.to;
  const start = (6.25 / Math.max(Math.abs(ux), Math.abs(uy))) * .9, target = 1.25;
  const head = 5.2 * g.weight, half = 3.05 * g.weight, shaft = 1.85 * g.weight;
  const x1 = fx+ux*start, y1 = fy+uy*start, x2 = tx+ux*target, y2 = ty+uy*target;
  const bx = x2-ux*head, by = y2-uy*head;
  return `M ${point(x1-uy*shaft,y1+ux*shaft)} ${rounded ? `A ${shaft} ${shaft} 0 0 1` : 'L'} ${point(x1+uy*shaft,y1-ux*shaft)} L ${point(bx+uy*shaft,by-ux*shaft)} L ${point(bx+uy*half,by-ux*half)} L ${point(x2,y2)} L ${point(bx-uy*half,by+ux*half)} L ${point(bx-uy*shaft,by+ux*shaft)} Z`;
}

/** Original broad shape, including its softer translucent, unoutlined paint. */
export const broadHeadArrow: ArrowShape = g => ({ layers: [{ d: broadPath(g, false), fill: g.color, fillOpacity: .46 * g.opacity }] });
/** Original broad shape with a rounded tail and masked white outline. */
export const roundedTailArrow: ArrowShape = g => outlined(broadPath(g, true), g);

export const DEFAULT_ARROW_STYLES: Readonly<Record<string, ArrowShape>> = Object.freeze({
  [ARROW_STYLE_SLIM]: slimPointArrow,
  [ARROW_STYLE_BROAD]: broadHeadArrow,
  [ARROW_STYLE_ROUNDED]: roundedTailArrow,
});

export interface ArrowRenderOptions {
  from: Square;
  to: Square;
  orientation: BoardOrientation;
  style?: string;
  color?: string;
  weight?: number;
  opacity?: number;
  outlineOpacity?: number;
  layer?: number;
  label?: string;
  /** Opaque host tag, preserved for selectors without influencing shape choice. */
  tag?: string;
  /** A catalogue's arrowStyles, or another build-time map of named shapes. */
  instanceId?: string;
  catalogue?: { arrowStyles: Readonly<Record<string, ArrowShape>> };
}

let nextMaskId = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';
/** Render one full-board SVG. Each mask ID is unique across mounts and redraws. */
export function renderArrowSvg(document: Document, options: ArrowRenderOptions): SVGSVGElement {
  const { from, to, orientation } = options;
  if (!isBoardSquare(from) || !isBoardSquare(to) || from === to || !['white','black'].includes(orientation)) throw new TypeError('Invalid arrow endpoints or orientation.');
  const style = options.style ?? ARROW_STYLE_SLIM;
  const shape = (options.catalogue?.arrowStyles ?? DEFAULT_ARROW_STYLES)[style];
  if (typeof shape !== 'function') throw new RangeError(`Unknown arrow style: ${style}`);
  const weight = options.weight ?? 1, opacity = options.opacity ?? 1;
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new RangeError('Invalid arrow weight or opacity.');
  const start = boardSquareCenter(from, orientation), end = boardSquareCenter(to, orientation);
  const dx = end.x-start.x, dy = end.y-start.y, length = Math.hypot(dx,dy);
  const geometry: ArrowGeometry = { from:start, to:end, unit:{x:dx/length,y:dy/length}, weight, color:options.color ?? '#5ab859', opacity, outlineOpacity:options.outlineOpacity };
  const primitives = shape(geometry);
  if (!primitives || !Array.isArray(primitives.layers)) throw new TypeError(`Arrow style ${style} returned invalid primitives.`);
  const svg = document.createElementNS(SVG_NS,'svg');
  svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('class','board-arrow');
  svg.setAttribute('data-arrow-style',style); svg.setAttribute('data-uci',from+to);
  if (options.tag !== undefined) svg.setAttribute('data-tag',options.tag);
  svg.style.position='absolute'; svg.style.inset='0'; svg.style.width='100%'; svg.style.height='100%';
  svg.style.overflow='visible'; svg.style.pointerEvents='none';
  svg.style.zIndex=String(Math.max(1,Math.min(40,Number(options.layer)||10)));
  if (options.label) { svg.setAttribute('role','img'); svg.setAttribute('aria-label',options.label); }
  else svg.setAttribute('aria-hidden','true');
  for (const primitive of primitives.layers) {
    if (!primitive || typeof primitive.d !== 'string' || !primitive.d || typeof primitive.fill !== 'string') throw new TypeError(`Arrow style ${style} returned an invalid layer.`);
    if (primitive.outline) {
      const stroke = document.createElementNS(SVG_NS,'path'); stroke.setAttribute('d',primitive.d);
      stroke.setAttribute('fill','none'); stroke.setAttribute('stroke',primitive.outline.color);
      stroke.setAttribute('stroke-opacity',String(primitive.outline.opacity));
      stroke.setAttribute('stroke-width',String(primitive.outline.width)); stroke.setAttribute('stroke-linejoin','round');
      if (primitive.outline.maskInterior) {
        const id = `board-arrow-mask-${options.instanceId ?? 'standalone'}-${++nextMaskId}`, defs = document.createElementNS(SVG_NS,'defs'), mask = document.createElementNS(SVG_NS,'mask');
        mask.setAttribute('id',id); mask.setAttribute('maskUnits','userSpaceOnUse');
        mask.setAttribute('x','-2'); mask.setAttribute('y','-2'); mask.setAttribute('width','104'); mask.setAttribute('height','104');
        const rect = document.createElementNS(SVG_NS,'rect'); rect.setAttribute('x','-2'); rect.setAttribute('y','-2'); rect.setAttribute('width','104'); rect.setAttribute('height','104'); rect.setAttribute('fill','#fff');
        const interior = document.createElementNS(SVG_NS,'path'); interior.setAttribute('d',primitive.d); interior.setAttribute('fill','#000');
        mask.append(rect,interior); defs.appendChild(mask); svg.appendChild(defs); stroke.setAttribute('mask',`url(#${id})`);
      }
      svg.appendChild(stroke);
    }
    const fill = document.createElementNS(SVG_NS,'path'); fill.setAttribute('d',primitive.d);
    fill.setAttribute('fill',primitive.fill); fill.setAttribute('fill-opacity',String(primitive.fillOpacity)); svg.appendChild(fill);
  }
  return svg;
}
