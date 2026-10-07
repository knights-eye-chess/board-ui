import { DEFAULT_ARROW_STYLES, type ArrowShape } from './arrows.js';

export const PIECE_CODES = ['P','R','N','B','Q','K','p','r','n','b','q','k'] as const;
export type AppearancePiece = typeof PIECE_CODES[number];
export interface PieceAsset { asset: string; scale?: number; offsetX?: number; offsetY?: number; }
export interface PieceSet { pieces: Readonly<Record<AppearancePiece, PieceAsset>>; }
export interface IconAsset { asset: string; color?: string; label?: string; group?: string; scale?: number; /** SVG template using __ICON_COLOR__; required for exact runtime recoloring of custom icons. */ sourceSvg?: string; }
export interface IconSet { icons: Readonly<Record<string, IconAsset>>; }
export interface SquareTheme { light: string; dark: string; focus?: string; dialog?: string; dialogText?: string; lastMove?: string; selected?: string; target?: string; coordinateLight?: string; coordinateDark?: string; }
export interface BoardAppearanceCatalogue {
  readonly assetUrls: Readonly<Record<string,string>>;
  readonly pieceSets: Readonly<Record<string,PieceSet>>;
  readonly iconSets: Readonly<Record<string,IconSet>>;
  readonly arrowStyles: Readonly<Record<string,ArrowShape>>;
  readonly squareThemes: Readonly<Record<string,SquareTheme>>;
}
export interface BoardAppearanceOptions {
  /** Build-time mapping of package-relative asset names to URLs emitted by the host. */
  assetUrls?: Readonly<Record<string,string>>;
  pieceSets?: Readonly<Record<string,PieceSet>>;
  iconSets?: Readonly<Record<string,IconSet>>;
  arrowStyles?: Readonly<Record<string,ArrowShape>>;
  squareThemes?: Readonly<Record<string,SquareTheme>>;
  /** Collisions with bundled defaults require an explicit opt-in. */
  replaceDefaults?: boolean;
}
export interface BoardAppearanceSelection { pieceSet?: string; iconSet?: string; squareTheme?: string; }
export interface ResolvedAppearanceSelection {
  pieceSetName: string; iconSetName: string; squareThemeName: string;
  pieceSet: PieceSet; iconSet: IconSet; squareTheme: SquareTheme;
}

const pieceName = (code: AppearancePiece) => `${code === code.toUpperCase() ? 'w' : 'b'}${code.toLowerCase()}.png`;
const defaultPieces = Object.fromEntries(PIECE_CODES.map(code => [code,{asset:`pieces/${pieceName(code)}`,scale:1,offsetX:0,offsetY:0}])) as Record<AppearancePiece, PieceAsset>;

/** The board's default presentation vocabulary. Hosts decide which ID to show. */
export const DEFAULT_QUALITY_DEFINITIONS = [
  { name:'interesting', label:'Interesting', group:'Creative', file:'interesting.svg', color:'#a571ea' },
  { name:'great', label:'Great', group:'Creative', file:'great_find.svg', color:'#6ba5db' },
  { name:'brilliant', label:'Brilliant', group:'Creative', file:'brilliant.svg', color:'#0eb9b3' },
  { name:'blunder', label:'Blunder', group:'Move quality', file:'blunder.svg', color:'#ef2d2b' },
  { name:'miss', label:'Miss', group:'Move quality', file:'missed_win.svg', color:'#ea6253' },
  { name:'mistake', label:'Mistake', group:'Move quality', file:'mistake.svg', color:'#df8a43' },
  { name:'dubious', label:'Dubious', group:'Move quality', file:'dubious.svg', color:'#e0ac22' },
  { name:'okay', label:'Okay', group:'Move quality', file:'okay.svg', color:'#acc062' },
  { name:'good', label:'Good', group:'Move quality', file:'good.svg', color:'#7eb455' },
  { name:'best', label:'Best', group:'Move quality', file:'best.svg', color:'#5ab859' },
  { name:'book', label:'Book', group:'Context', file:'book.svg', color:'#b38361' },
  { name:'forced', label:'Forced', group:'Context', file:'forced.svg', color:'#7eb455' },
] as const;

export type DefaultQualityName = typeof DEFAULT_QUALITY_DEFINITIONS[number]['name'];
export const DEFAULT_QUALITY_COLORS: Readonly<Record<DefaultQualityName,string>> = Object.freeze(Object.fromEntries(DEFAULT_QUALITY_DEFINITIONS.map(item => [item.name,item.color])) as Record<DefaultQualityName,string>);

/** Original SVG artwork with only its background fill made substitutable. */
const defaultIconSource: Readonly<Record<string,string>> = {"interesting":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(.35 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"13.5\" font-size=\"12.7\" letter-spacing=\".4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!?</text></g><g color=\"#fff\"><text x=\"9\" y=\"13.5\" font-size=\"12.7\" letter-spacing=\".4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!?</text></g></g></svg>","great":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(0 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"14.45\" font-size=\"15.6\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!</text></g><g color=\"#fff\"><text x=\"9\" y=\"14.45\" font-size=\"15.6\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!</text></g></g></svg>","brilliant":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(0 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"13.9\" font-size=\"14.1\" letter-spacing=\".7\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!!</text></g><g color=\"#fff\"><text x=\"9\" y=\"13.9\" font-size=\"14.1\" letter-spacing=\".7\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">!!</text></g></g></svg>","blunder":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(-.18 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"13.1\" font-size=\"11.8\" letter-spacing=\"-.4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">??</text></g><g color=\"#fff\"><text x=\"9\" y=\"13.1\" font-size=\"11.8\" letter-spacing=\"-.4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">??</text></g></g></svg>","miss":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .55)\"><path d=\"m5.7 5.7 6.6 6.6m0-6.6-6.6 6.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g><g color=\"#fff\"><path d=\"m5.7 5.7 6.6 6.6m0-6.6-6.6 6.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g></svg>","mistake":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(0 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"14.3\" font-size=\"15.2\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">?</text></g><g color=\"#fff\"><text x=\"9\" y=\"14.3\" font-size=\"15.2\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">?</text></g></g></svg>","dubious":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(-.18 0)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><text x=\"9\" y=\"13.5\" font-size=\"12.7\" letter-spacing=\".4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">?!</text></g><g color=\"#fff\"><text x=\"9\" y=\"13.5\" font-size=\"12.7\" letter-spacing=\".4\" font-family=\"Arial Black,Helvetica Neue,Arial,sans-serif\" font-weight=\"900\" text-anchor=\"middle\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\".38\" paint-order=\"stroke fill\" stroke-linejoin=\"round\">?!</text></g></g></svg>","okay":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(9 9) scale(.86) translate(-9 -9)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><path d=\"M4.25 9.15 7.45 12.4 13.75 6.05\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.45\" stroke-linecap=\"square\" stroke-linejoin=\"round\"/></g><g color=\"#fff\"><path d=\"M4.25 9.15 7.45 12.4 13.75 6.05\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.45\" stroke-linecap=\"square\" stroke-linejoin=\"round\"/></g></g></svg>","good":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(0 -.45)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><rect x=\"3.35\" y=\"7.45\" width=\"2.55\" height=\"6.35\" rx=\"1.15\" fill=\"currentColor\"/><path d=\"M6.45 7.45h.92l1.7-3.39c.23-.47.76-.72 1.27-.6.64.15 1.02.8.82 1.42l-.63 1.98h2.64c1.02 0 1.76.98 1.47 1.96l-1.13 3.88a1.53 1.53 0 0 1-1.47 1.1H6.45Z\" fill=\"currentColor\"/></g><g color=\"#fff\"><rect x=\"3.35\" y=\"7.45\" width=\"2.55\" height=\"6.35\" rx=\"1.15\" fill=\"currentColor\"/><path d=\"M6.45 7.45h.92l1.7-3.39c.23-.47.76-.72 1.27-.6.64.15 1.02.8.82 1.42l-.63 1.98h2.64c1.02 0 1.76.98 1.47 1.96l-1.13 3.88a1.53 1.53 0 0 1-1.47 1.1H6.45Z\" fill=\"currentColor\"/></g></g></svg>","best":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(9 9) scale(.89) translate(-9 -9) translate(0 -.45)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><path d=\"M9 2.75c.28 0 .53.16.66.42l1.6 3.24 3.58.52c.29.04.53.24.62.52.09.28.02.58-.19.78l-2.59 2.53.61 3.56c.05.29-.07.58-.31.75a.75.75 0 0 1-.79.06L9 13.45l-3.2 1.68a.75.75 0 0 1-.79-.06.74.74 0 0 1-.3-.75l.6-3.56-2.58-2.53a.74.74 0 0 1-.19-.78c.09-.28.33-.48.62-.52l3.58-.52 1.6-3.24A.73.73 0 0 1 9 2.75Z\" fill=\"currentColor\"/></g><g color=\"#fff\"><path d=\"M9 2.75c.28 0 .53.16.66.42l1.6 3.24 3.58.52c.29.04.53.24.62.52.09.28.02.58-.19.78l-2.59 2.53.61 3.56c.05.29-.07.58-.31.75a.75.75 0 0 1-.79.06L9 13.45l-3.2 1.68a.75.75 0 0 1-.79-.06.74.74 0 0 1-.3-.75l.6-3.56-2.58-2.53a.74.74 0 0 1-.19-.78c.09-.28.33-.48.62-.52l3.58-.52 1.6-3.24A.73.73 0 0 1 9 2.75Z\" fill=\"currentColor\"/></g></g></svg>","book":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\"><path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/><g transform=\"translate(9 9) scale(.95) translate(-9 -9) translate(0 .25)\"><g color=\"#000\" opacity=\".2\" transform=\"translate(0 .5)\"><path d=\"M3.15 4.72c2.3.02 4.05.7 5.28 2.04v6.72c-1.42-1.23-3.14-1.83-5.28-1.83a.7.7 0 0 1-.7-.7V5.42c0-.39.31-.7.7-.7Zm11.7 0c-2.3.02-4.05.7-5.28 2.04v6.72c1.42-1.23 3.14-1.83 5.28-1.83.39 0 .7-.31.7-.7V5.42a.7.7 0 0 0-.7-.7Z\" fill=\"currentColor\"/></g><g color=\"#fff\"><path d=\"M3.15 4.72c2.3.02 4.05.7 5.28 2.04v6.72c-1.42-1.23-3.14-1.83-5.28-1.83a.7.7 0 0 1-.7-.7V5.42c0-.39.31-.7.7-.7Zm11.7 0c-2.3.02-4.05.7-5.28 2.04v6.72c1.42-1.23 3.14-1.83 5.28-1.83.39 0 .7-.31.7-.7V5.42a.7.7 0 0 0-.7-.7Z\" fill=\"currentColor\"/></g></g></svg>","forced":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 18 19\">\n  <path opacity=\".3\" d=\"M9 .5a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/>\n  <path fill=\"__ICON_COLOR__\" d=\"M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z\"/>\n  <g transform=\"translate(0 -.2)\">\n    <path opacity=\".2\" transform=\"translate(0 .5)\" d=\"M14.6 8.73 9.15 3.9a.58.58 0 0 0-.95.44v2.28H3.75a.75.75 0 0 0-.75.75v3.26c0 .41.34.75.75.75H8.2v2.28a.58.58 0 0 0 .95.44l5.45-4.83a.72.72 0 0 0 0-1.08Z\"/>\n    <path fill=\"#fff\" d=\"M14.6 8.73 9.15 3.9a.58.58 0 0 0-.95.44v2.28H3.75a.75.75 0 0 0-.75.75v3.26c0 .41.34.75.75.75H8.2v2.28a.58.58 0 0 0 .95.44l5.45-4.83a.72.72 0 0 0 0-1.08Z\"/>\n  </g>\n</svg>"};

const qualityIcons: Record<string,IconAsset> = Object.fromEntries(DEFAULT_QUALITY_DEFINITIONS.map(item => [item.name, {
  asset:`icons/${item.file}`, color:item.color, label:item.label, group:item.group, scale:1,
}]));

const defaults = {
  pieceSets: { glossy: { pieces:defaultPieces } },
  iconSets: { quality: { icons:qualityIcons } },
  arrowStyles: DEFAULT_ARROW_STYLES,
  squareThemes: { classic: {light:'#e9edcc',dark:'#779556',focus:'#5634ad',dialog:'#fff',dialogText:'#17221b',lastMove:'#eacb4266',selected:'#f4d35e',target:'rgba(64,69,67,.42)',coordinateLight:'#779556',coordinateDark:'#e9edcc'} },
};

function validateName(category: string, name: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new TypeError(`Invalid ${category} name: ${name}`);
}
function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a nonempty string.`);
}
function metric(value: unknown, field: string, positive = false) {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || (positive && value <= 0))) throw new TypeError(`${field} must be ${positive ? 'positive and ' : ''}finite.`);
}
function validatePieceSet(name: string, set: PieceSet) {
  if (!set || !set.pieces || Object.keys(set.pieces).length !== 12 || PIECE_CODES.some(code => !set.pieces[code])) throw new TypeError(`Piece set ${name} must define all twelve pieces.`);
  for (const code of PIECE_CODES) {
    const item=set.pieces[code]; requiredText(item.asset,`Piece set ${name}/${code} asset`);
    metric(item.scale,`Piece set ${name}/${code} scale`,true); metric(item.offsetX,`Piece set ${name}/${code} offsetX`); metric(item.offsetY,`Piece set ${name}/${code} offsetY`);
  }
}
function validateIconSet(name: string, set: IconSet) {
  if (!set || !set.icons || !Object.keys(set.icons).length) throw new TypeError(`Icon set ${name} must contain at least one icon.`);
  for (const [id,item] of Object.entries(set.icons)) {
    validateName('icon',id); requiredText(item?.asset,`Icon set ${name}/${id} asset`);
    if (item.color !== undefined) requiredText(item.color,`Icon set ${name}/${id} color`);
    if (item.label !== undefined) requiredText(item.label,`Icon set ${name}/${id} label`);
    if (item.group !== undefined) requiredText(item.group,`Icon set ${name}/${id} group`);
    if (item.sourceSvg !== undefined) requiredText(item.sourceSvg,`Icon set ${name}/${id} sourceSvg`);
    metric(item.scale,`Icon set ${name}/${id} scale`,true);
  }
}
function merge<T>(category: string, bundled: Readonly<Record<string,T>>, extras: Readonly<Record<string,T>> | undefined, replace: boolean, validate: (name:string,value:T)=>void): Record<string,T> {
  const result = { ...bundled };
  for (const [name,value] of Object.entries(extras ?? {})) {
    validateName(category,name);
    if (Object.hasOwn(result,name) && !replace) throw new TypeError(`${category} ${name} already exists; pass replaceDefaults: true to replace it.`);
    validate(name,value); result[name]=value;
  }
  return result;
}

/** Assemble once at build time; mounts retain independent catalogue references. */
export function createBoardAppearance(options: BoardAppearanceOptions = {}): BoardAppearanceCatalogue {
  const replace = options.replaceDefaults === true;
  const pieceSets = merge('piece set',defaults.pieceSets,options.pieceSets,replace,validatePieceSet);
  const iconSets = merge('icon set',defaults.iconSets,options.iconSets,replace,validateIconSet);
  const arrowStyles = merge('arrow style',defaults.arrowStyles,options.arrowStyles,replace,(name,shape) => { if (typeof shape !== 'function') throw new TypeError(`Arrow style ${name} must be a function.`); });
  const squareThemes = merge('square theme',defaults.squareThemes,options.squareThemes,replace,(name,theme) => {
    if (!theme) throw new TypeError(`Square theme ${name} is missing.`);
    requiredText(theme.light,`Square theme ${name} light`); requiredText(theme.dark,`Square theme ${name} dark`);
    for (const key of ['focus','dialog','dialogText','lastMove','selected','target','coordinateLight','coordinateDark'] as const) if (theme[key] !== undefined) requiredText(theme[key],`Square theme ${name} ${key}`);
  });
  for (const [path,url] of Object.entries(options.assetUrls ?? {})) { requiredText(path,'Asset path'); requiredText(url,`Asset URL for ${path}`); }
  const pieceCopies = Object.fromEntries(Object.entries(pieceSets).map(([name,set]) => {
    const pieces = Object.fromEntries(Object.entries(set.pieces).map(([code,item]) => [code,Object.freeze({...item})]));
    return [name,Object.freeze({pieces:Object.freeze(pieces)})];
  })) as Record<string,PieceSet>;
  const iconCopies = Object.fromEntries(Object.entries(iconSets).map(([name,set]) => {
    const icons = Object.fromEntries(Object.entries(set.icons).map(([id,item]) => [id,Object.freeze({...item})]));
    return [name,Object.freeze({icons:Object.freeze(icons)})];
  }));
  return Object.freeze({
    assetUrls:Object.freeze({...options.assetUrls}),
    pieceSets:Object.freeze(pieceCopies),
    iconSets:Object.freeze(iconCopies),
    arrowStyles:Object.freeze({...arrowStyles}),
    squareThemes:Object.freeze(Object.fromEntries(Object.entries(squareThemes).map(([name,theme]) => [name,Object.freeze({...theme})]))),
  });
}

export const defaultBoardAppearance: BoardAppearanceCatalogue = createBoardAppearance();

/** The fallback resolves package assets; host bundlers may provide emitted URLs in assetUrls. */
export function resolveAppearanceAsset(catalogue: BoardAppearanceCatalogue, asset: string): string {
  requiredText(asset,'Asset');
  if (catalogue.assetUrls[asset]) return catalogue.assetUrls[asset];
  if (/^(?:https?:|data:|blob:|\/)/i.test(asset)) return asset;
  return new URL(`../assets/${asset}`,import.meta.url).href;
}

export function resolveAppearanceSelection(catalogue: BoardAppearanceCatalogue, selection: BoardAppearanceSelection = {}): ResolvedAppearanceSelection {
  const pieceSetName=selection.pieceSet ?? 'glossy', iconSetName=selection.iconSet ?? 'quality', squareThemeName=selection.squareTheme ?? 'classic';
  const pieceSet=catalogue.pieceSets[pieceSetName], iconSet=catalogue.iconSets[iconSetName], squareTheme=catalogue.squareThemes[squareThemeName];
  if (!pieceSet) throw new RangeError(`Unknown piece set: ${pieceSetName}`);
  if (!iconSet) throw new RangeError(`Unknown icon set: ${iconSetName}`);
  if (!squareTheme) throw new RangeError(`Unknown square theme: ${squareThemeName}`);
  return {pieceSetName,iconSetName,squareThemeName,pieceSet,iconSet,squareTheme};
}

/** Check every selected name and palette override before a board or viewer paints. */
export function validateAppearanceSelection(catalogue: BoardAppearanceCatalogue, selection: BoardAppearanceSelection & { qualityColors?: Readonly<Record<string,string>> } = {}): ResolvedAppearanceSelection {
  const resolved=resolveAppearanceSelection(catalogue,selection);
  for (const [id,color] of Object.entries(selection.qualityColors ?? {})) {
    if (!Object.hasOwn(resolved.iconSet.icons,id)) throw new RangeError(`Unknown icon: ${id} in ${resolved.iconSetName}`);
    resolveIconPresentation(catalogue,id,{iconSet:resolved.iconSetName,color});
  }
  return resolved;
}

export interface IconPresentationOptions { iconSet?: string; color?: string; label?: string; }
export interface IconPresentation { src: string; color?: string; label?: string; scale: number; }
/** Return a decorative image URL and separate host-facing label. Default SVGs retain
 * byte-identical asset URLs until a palette override asks for a recolored data URL. */
export function resolveIconPresentation(catalogue: BoardAppearanceCatalogue, id: string, options: IconPresentationOptions = {}): IconPresentation {
  const setName=options.iconSet ?? 'quality', set=catalogue.iconSets[setName];
  if (!set) throw new RangeError(`Unknown icon set: ${setName}`);
  const icon=set.icons[id];
  if (!icon) throw new RangeError(`Unknown icon: ${id} in ${setName}`);
  const color=options.color ?? icon.color;
  if (color !== undefined && !/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError(`Invalid icon color for ${id}.`);
  const label=options.label ?? icon.label;
  const defaultDefinition=DEFAULT_QUALITY_DEFINITIONS.find(item => item.name === id);
  const bundledSource=setName === 'quality' && defaultDefinition && icon.asset === `icons/${defaultDefinition.file}` ? defaultIconSource[id] : undefined;
  const source=icon.sourceSvg ?? bundledSource;
  let src=resolveAppearanceAsset(catalogue,icon.asset);
  if (color !== undefined && (icon.sourceSvg !== undefined || bundledSource && color !== defaultDefinition?.color || !bundledSource && color !== icon.color)) {
    if (!source || !source.includes('__ICON_COLOR__')) throw new TypeError(`Icon ${id} cannot be recolored without sourceSvg containing __ICON_COLOR__.`);
    src=`data:image/svg+xml,${encodeURIComponent(source.replaceAll('__ICON_COLOR__',color))}`;
  }
  return {src,color,label,scale:icon.scale ?? 1};
}
