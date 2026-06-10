/**
 * Раскладка панелей холста из SVG формата (canvas_formats[].image_url).
 * SVG с API — источник правды: каждый <rect> в нём = панель холста
 * («3 Parçalı Simetrik» и т.п.), включая асимметричные раскладки.
 */

export type FormatPanelRect = {
	/** Центр панели, нормализован 0..1 от общего bbox панелей. */
	left: number
	top: number
	/** Размеры панели, нормализованы 0..1 от общего bbox панелей. */
	width: number
	height: number
}

export type FormatPanelLayout = {
	/** width / height общего bbox панелей — пропорция холста. */
	aspect: number
	panels: FormatPanelRect[]
}

type RawRect = { x: number; y: number; w: number; h: number }

const readSvgLength = (el: Element, attr: string, fallback = 0): number => {
	const raw = el.getAttribute(attr)
	if (raw == null || raw.trim() === '') return fallback
	const n = Number.parseFloat(raw)
	return Number.isFinite(n) ? n : fallback
}

const rectContains = (outer: RawRect, inner: RawRect): boolean =>
	inner.x >= outer.x - 0.5 &&
	inner.y >= outer.y - 0.5 &&
	inner.x + inner.w <= outer.x + outer.w + 0.5 &&
	inner.y + inner.h <= outer.y + outer.h + 0.5

/** Рамки/подложки иконки (rect, содержащий все остальные) — не панели. */
const dropBackgroundRects = (rects: RawRect[]): RawRect[] => {
	let list = [...rects]
	let changed = true
	while (changed && list.length > 1) {
		changed = false
		for (let i = 0; i < list.length; i++) {
			const others = list.filter((_, j) => j !== i)
			if (others.every((o) => rectContains(list[i], o))) {
				list = others
				changed = true
				break
			}
		}
	}
	return list
}

export function parseFormatSvgLayout(svgText: string): FormatPanelLayout | null {
	if (!import.meta.client || !svgText.trim()) return null

	let doc: Document
	try {
		doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
	} catch {
		return null
	}
	if (doc.querySelector('parsererror')) return null

	const rawRects: RawRect[] = []
	for (const el of Array.from(doc.querySelectorAll('rect'))) {
		const w = readSvgLength(el, 'width')
		const h = readSvgLength(el, 'height')
		if (w <= 0 || h <= 0) continue
		rawRects.push({ x: readSvgLength(el, 'x'), y: readSvgLength(el, 'y'), w, h })
	}

	const panels = dropBackgroundRects(rawRects)
	if (!panels.length) return null

	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	for (const r of panels) {
		minX = Math.min(minX, r.x)
		minY = Math.min(minY, r.y)
		maxX = Math.max(maxX, r.x + r.w)
		maxY = Math.max(maxY, r.y + r.h)
	}
	const bboxW = maxX - minX
	const bboxH = maxY - minY
	if (bboxW <= 0 || bboxH <= 0) return null

	return {
		aspect: bboxW / bboxH,
		panels: panels.map((r) => ({
			left: (r.x + r.w / 2 - minX) / bboxW,
			top: (r.y + r.h / 2 - minY) / bboxH,
			width: r.w / bboxW,
			height: r.h / bboxH
		}))
	}
}

const layoutCacheByUrl = new Map<string, Promise<FormatPanelLayout | null>>()

/** Загрузка + парсинг SVG формата; кэш по URL. URL должен быть уже проксирован. */
export function loadFormatPanelLayout(url: string): Promise<FormatPanelLayout | null> {
	const u = String(url ?? '').trim()
	if (!u || !import.meta.client) return Promise.resolve(null)

	let cached = layoutCacheByUrl.get(u)
	if (!cached) {
		cached = fetch(u)
			.then((res) => (res.ok ? res.text() : ''))
			.then((text) => parseFormatSvgLayout(text))
			.catch(() => null)
		layoutCacheByUrl.set(u, cached)
	}
	return cached
}
