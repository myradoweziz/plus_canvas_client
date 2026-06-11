export type CanvasFormat = {
	id: number
	name: string
	sizes: PrintSizeOption[]
	slug?: string
	/** SVG/превью формата с API (canvas_formats.image_url). */
	image_url?: string
	/** Ориентация холста (width / height): Dikey, Kare, Yatay… */
	aspect?: number
	/** «N Parçalı» — холст из N вертикальных панелей (3 Parçalı Simetrik и т.п.). */
	panels?: number
	/** Технический fallback (API не отдал форматы) — в UI не показывается. */
	synthetic?: boolean
}

export type PrintSizeOption = {
	display_name: string
	height: number
	id: number
	price: number
	width: number
}

export type FrameOption = {
	id: string | null
	name: string
	image_url: string
	color_hex: string
	price?: number
}

/** Без рамки — первый пункт в списке çerçeve (API: canvas_frame_id = null). */
export const FRAME_NONE_ID = null

export const FRAME_NONE_OPTION: FrameOption = {
	id: null,
	name: 'Çerçeve yok',
	image_url: '',
	color_hex: '#B0B8C4',
	price: 0
}

export function getFramePrice(frame: FrameOption | null | undefined): number {
	if (!frame || isNoFrame(frame)) return 0
	const p = frame.price ?? 0
	return Number.isFinite(p) && p > 0 ? p : 0
}

export function isNoFrame(frame: FrameOption | null | undefined): boolean {
	if (!frame) return true
	if (frame.id == null || frame.id === 'none') return true
	const n = frame.name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
	return n.includes('cerceve yok') || n.includes('çerçeve yok') || n.includes('no frame') || n.includes('frameless')
}

/** «Çerçeve yok» всегда первым; дубликаты с API убираем. */
export function withNoFrameOption(frames: FrameOption[]): FrameOption[] {
	const rest = frames.filter((f) => !isNoFrame(f))
	return [FRAME_NONE_OPTION, ...rest]
}

/** @deprecated используйте withNoFrameOption */
export const withDefaultNoFrameOption = withNoFrameOption

/** Цвет рамки (#RRGGBB) из API. */
/** Толщина рамки на превью (~3 cm, как PlusCanvas). */
export const CANVAS_FRAME_OUTER_PX = 22

/** Зазор между фото и рамкой (0 — изображение вплотную к рамке). */
export const CANVAS_FRAME_GAP_PX = 0

/** Суммарный отступ коллажа/фото от края области печати при выбранной рамке. */
export const CANVAS_FRAME_EDGE_INSET_PX = CANVAS_FRAME_OUTER_PX + CANVAS_FRAME_GAP_PX

export function normalizeFrameColor(hex: string | undefined | null, fallback = '#6b4f2a'): string {
	const raw = String(hex ?? '').trim()
	if (!raw) return fallback
	if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw
	if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`
	if (/^[0-9a-fA-F]{3}$/.test(raw)) return `#${raw}`
	return fallback
}

const pickString = (...values: unknown[]): string => {
	for (const v of values) {
		if (typeof v === 'string' && v.trim()) return v.trim()
	}
	return ''
}

const normalizeSizes = (sizesRaw: unknown): PrintSizeOption[] => {
	if (!Array.isArray(sizesRaw)) return []
	return sizesRaw
		.map((s) => {
			const size = s as Record<string, unknown>
			const sizeId = Number(size.id)
			const width = Number(size.width)
			const height = Number(size.height)
			const price = Number(size.price)
			const display_name = pickString(size.display_name, size.name, size.label, size.title)
			if (!Number.isFinite(sizeId) || !display_name || width <= 0 || height <= 0) return null
			return {
				id: sizeId,
				display_name,
				width,
				height,
				price: Number.isFinite(price) ? price : 0
			} satisfies PrintSizeOption
		})
		.filter((s): s is PrintSizeOption => s !== null)
}

const parseAspectFromRow = (row: Record<string, unknown>): number | undefined => {
	const direct = Number(row.aspect ?? row.aspect_ratio ?? row.ratio_value)
	if (Number.isFinite(direct) && direct > 0) return direct

	const fw = Number(row.format_width ?? row.canvas_width)
	const fh = Number(row.format_height ?? row.canvas_height)
	if (fw > 0 && fh > 0) return fw / fh

	const ratioStr = pickString(row.ratio, row.aspect_label, row.orientation_ratio)
	const m = ratioStr.match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/)
	if (m) {
		const a = Number(m[1])
		const b = Number(m[2])
		if (a > 0 && b > 0) return a / b
	}

	return undefined
}

const normalizeLabel = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

const FORMAT_ASPECT_RULES: [RegExp, number][] = [
	[/panorama|3\s*[:/]\s*1|3-1/, 3],
	[/yatay\s*2\s*[:/]\s*1|2\s*[:/]\s*1/, 2],
	[/dikey\s*1\s*[:/]\s*2|1\s*[:/]\s*2/, 0.5],
	[/dikey\s*1\s*[:/]\s*3|1\s*[:/]\s*3/, 1 / 3],
	[/yatay|horizontal|landscape/, 4 / 3],
	[/dikey|vertical|portrait/, 3 / 4],
	[/\bkare\b|square/, 1]
]

const parseAspectRatioFromLabel = (label: string): number | null => {
	const m = normalizeLabel(label).match(/(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)/)
	if (!m) return null
	const a = Number(m[1])
	const b = Number(m[2])
	if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
	return a / b
}

const inferFormatAspectFromLabel = (label: string): number | null => {
	const n = normalizeLabel(label)
	if (!n) return null
	for (const [re, aspect] of FORMAT_ASPECT_RULES) {
		if (re.test(n)) return aspect
	}
	return parseAspectRatioFromLabel(label)
}

/** По названию формата (Dikey, Kare, Yatay 2/1…). name и slug проверяются отдельно. */
export function inferFormatAspectFromName(name: string, slug?: string): number | null {
	for (const label of [name, slug]) {
		if (!label?.trim()) continue
		const aspect = inferFormatAspectFromLabel(label)
		if (aspect != null) return aspect
	}
	return null
}

/** «3 Parçalı Simetrik» / «5-parcali» → число панелей; 1 — обычный холст. */
export function parseFormatPanelCount(name: string, slug?: string): number {
	for (const label of [name, slug]) {
		if (!label?.trim()) continue
		const m = normalizeLabel(label).match(/(\d+)\s*-?\s*parcal/)
		if (m) {
			const n = Number(m[1])
			if (Number.isFinite(n) && n > 1 && n <= 10) return Math.round(n)
		}
	}
	return 1
}

export function formatPanelCount(format: CanvasFormat | null | undefined): number {
	const n = Number(format?.panels ?? 1)
	return Number.isFinite(n) && n > 1 ? Math.round(n) : 1
}

/** Размер у «parçalı»-форматов часто задан на одну панель — итоговый холст шире. */
const totalAspectForPanels = (aspect: number, panels: number): number =>
	panels > 1 && aspect <= 1.05 ? aspect * panels : aspect

export function normalizeCanvasFormats(raw: unknown): CanvasFormat[] {
	const list = Array.isArray(raw)
		? raw
		: raw && typeof raw === 'object'
			? Object.values(raw as Record<string, unknown>)
			: []
	return list
		.map((item) => {
			const row = item as Record<string, unknown>
			const id = Number(row.id)
			const name = pickString(row.name, row.title, row.label)
			const slug = pickString(row.slug, row.code, row.key)
			const sizes = normalizeSizes(
				row.sizes ?? row.canvas_format_sizes ?? row.format_sizes ?? row.print_sizes ?? row.canvas_sizes
			)
			if (!Number.isFinite(id) || !name || !sizes.length) return null
			const image_url = pickString(row.image_url, row.image, row.src, row.url, row.thumbnail, row.preview_image)
			const panelsRaw = Number(row.panels ?? row.panel_count ?? row.piece_count ?? row.pieces)
			const panels =
				Number.isFinite(panelsRaw) && panelsRaw > 1 ? Math.round(panelsRaw) : parseFormatPanelCount(name, slug)
			const format: CanvasFormat = {
				id,
				name,
				sizes,
				...(slug ? { slug } : {}),
				...(image_url ? { image_url } : {}),
				...(panels > 1 ? { panels } : {})
			}
			const fromApi = parseAspectFromRow(row)
			const fromName = inferFormatAspectFromName(name, slug)
			const aspect = fromName ?? fromApi
			if (aspect && aspect > 0) format.aspect = aspect
			return format
		})
		.filter((f): f is CanvasFormat => f !== null)
}

/** canvas_formats из ответа canvas-products/:id (разные ключи API). */
export function extractCanvasFormatsFromProduct(product: unknown): CanvasFormat[] {
	if (!product || typeof product !== 'object') return []
	const row = product as Record<string, unknown>
	return normalizeCanvasFormats(row.canvas_formats)
}

export function normalizeCanvasFrames(raw: unknown): FrameOption[] {
	const list = Array.isArray(raw)
		? raw
		: raw && typeof raw === 'object'
			? Object.values(raw as Record<string, unknown>)
			: []

	return list
		.map((item) => {
			const row = item as Record<string, unknown>
			const idRaw = row.id ?? row.frame_id ?? row.uuid
			const id = idRaw != null && String(idRaw).trim() !== '' ? String(idRaw).trim() : ''
			const name = pickString(row.name, row.title, row.label)
			const image_url = pickString(row.image_url, row.image, row.src, row.url, row.thumbnail)
			const color_hex = normalizeFrameColor(
				pickString(row.color_hex, row.color, row.hex, row.border_color, row.frame_color)
			)
			const priceRaw = Number(row.price ?? row.frame_price ?? row.additional_price)
			const price = Number.isFinite(priceRaw) ? priceRaw : undefined
			if (!id || !name) return null
			const frame: FrameOption = {
				id,
				name,
				image_url,
				color_hex,
				...(price !== undefined ? { price } : {})
			}
			return frame
		})
		.filter((f): f is FrameOption => f !== null)
}

export function extractCanvasFramesFromProduct(product: unknown): FrameOption[] {
	if (!product || typeof product !== 'object') return [FRAME_NONE_OPTION]
	const row = product as Record<string, unknown>
	const raw = row.frames ?? row.canvas_frames ?? row.frame_options ?? row.product_frames
	return withNoFrameOption(normalizeCanvasFrames(raw))
}

export function getDefaultSize(format: CanvasFormat): PrintSizeOption {
	return format.sizes[0]
}

/** Пропорции холста по формату (Dikey / Kare / Yatay) — для полосы форматов и canvas. */
export function formatOrientationAspect(format: CanvasFormat): number {
	const panels = formatPanelCount(format)
	const fromName = inferFormatAspectFromName(format.name, format.slug)
	if (fromName) return totalAspectForPanels(fromName, panels)

	const s = getDefaultSize(format)
	if (s.height > 0 && s.width > 0) {
		const fromDefaultSize = s.width / s.height
		if (Number.isFinite(fromDefaultSize) && fromDefaultSize > 0) {
			return totalAspectForPanels(fromDefaultSize, panels)
		}
	}

	if (format.aspect && format.aspect > 0) return totalAspectForPanels(format.aspect, panels)
	return panels > 1 ? totalAspectForPanels(3 / 4, panels) : 1
}

/** Пропорции по выбранному размеру (Boyut), если задан. */
export function sizeAspect(size: PrintSizeOption): number {
	return size.height > 0 ? size.width / size.height : 1
}

export function formatAspect(format: CanvasFormat, size?: PrintSizeOption | null): number {
	if (size) return totalAspectForPanels(sizeAspect(size), formatPanelCount(format))
	return formatOrientationAspect(format)
}

export function printBoxInViewport(aspect: number, maxW: number, maxH: number): { width: number; height: number } {
	let width = maxW
	let height = width / aspect
	if (height > maxH) {
		height = maxH
		width = height * aspect
	}
	return { width, height }
}
