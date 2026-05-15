export type CanvasFormat = {
	id: number
	name: string
	sizes: PrintSizeOption[]
	slug?: string
	/** Ориентация холста (width / height): Dikey, Kare, Yatay… */
	aspect?: number
}

export type PrintSizeOption = {
	display_name: string
	height: number
	id: number
	price: number
	width: number
}

export type FrameOption = {
	id: string
	label: string
	/** null = çerçeve yok */
	src: string | null
	borderWidth?: number
}

export const FRAME_OPTIONS: FrameOption[] = [
	{ id: 'none', label: 'Çerçeve yok', src: null },
	{ id: 'wood-light', label: 'Açık ahşap', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'wood-dark', label: 'Koyu ahşap', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'black', label: 'Siyah', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'white', label: 'Beyaz', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'gold', label: 'Altın', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'silver', label: 'Gümüş', src: '/images/cerceve.png', borderWidth: 12 },
	{ id: 'natural', label: 'Doğal', src: '/images/cerceve.png', borderWidth: 14 },
	{ id: 'walnut', label: 'Ceviz', src: '/images/cerceve.png', borderWidth: 14 }
]

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

const normalizeLabel = (value: string) =>
	value
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.trim()

/** По названию формата (Dikey, Kare, Yatay 2/1…). */
export function inferFormatAspectFromName(name: string, slug?: string): number | null {
	const n = normalizeLabel([name, slug].filter(Boolean).join(' '))

	const rules: [RegExp, number][] = [
		[/panorama|3\s*[:/]\s*1|3-1/, 3],
		[/yatay\s*2\s*[:/]\s*1|2\s*[:/]\s*1/, 2],
		[/dikey\s*1\s*[:/]\s*2|1\s*[:/]\s*2/, 0.5],
		[/dikey\s*1\s*[:/]\s*3|1\s*[:/]\s*3/, 1 / 3],
		[/kare|square/, 1],
		[/dikey|vertical|portrait/, 3 / 4],
		[/yatay|horizontal|landscape/, 4 / 3]
	]

	for (const [re, aspect] of rules) {
		if (re.test(n)) return aspect
	}
	return null
}

export function normalizeCanvasFormats(raw: unknown): CanvasFormat[] {
	const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw as Record<string, unknown>) : []
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
			const format: CanvasFormat = { id, name, sizes, ...(slug ? { slug } : {}) }
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
	const raw =
		row.canvas_formats ??
		row.canvasFormats ??
		row.formats ??
		row.canvas_format ??
		row.canvas_product_formats
	return normalizeCanvasFormats(raw)
}

export function getDefaultSize(format: CanvasFormat): PrintSizeOption {
	return format.sizes[0]
}

/** Пропорции холста по формату (Dikey / Kare / Yatay) — для полосы форматов и canvas. */
export function formatOrientationAspect(format: CanvasFormat): number {
	// Имя формата — главный источник (полоса Dikey/Kare/Yatay)
	const fromName = inferFormatAspectFromName(format.name, format.slug)
	if (fromName) return fromName

	if (format.aspect && format.aspect > 0) return format.aspect

	// Размеры только у этого формата (не общий список с бэка)
	const s = getDefaultSize(format)
	if (s.height > 0) return s.width / s.height
	return 1
}

/** Пропорции по выбранному размеру (Boyut), если задан. */
export function sizeAspect(size: PrintSizeOption): number {
	return size.height > 0 ? size.width / size.height : 1
}

export function formatAspect(format: CanvasFormat, size?: PrintSizeOption | null): number {
	if (size) return sizeAspect(size)
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
