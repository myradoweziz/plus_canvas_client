import type { Image } from '~/utils/types'

export type CollageLayoutSlot = {
	/** Индекс в uploadImages */
	slot: number
	x: number
	y: number
	w: number
	h: number
}

export type SlotCoordinateMode = 'fraction' | 'percent' | 'absolute'

export type CollageLayout = {
	id?: number
	name?: string
	layout_json: CollageLayoutSlot[]
	/** Размер макета с бэкенда (если слоты в пикселях). */
	reference_width?: number
	reference_height?: number
}

export function getProductImageUrl(img: Image): string {
	const url = String(img.url ?? '').trim()
	if (url) return url
	return String(img.path ?? '').trim()
}

export function extractProductImageUrls(product: unknown): string[] {
	if (!product || typeof product !== 'object') return []
	const row = product as Record<string, unknown>
	const list = row.images ?? row.product_images
	if (!Array.isArray(list)) return []
	return list
		.map((item) => getProductImageUrl(item as Image))
		.filter((u) => u.length > 0)
}

export function getPrimaryProductBackgroundUrl(product: unknown): string | null {
	return extractProductImageUrls(product)[0] ?? null
}

const normalizeSlot = (raw: unknown): CollageLayoutSlot | null => {
	if (!raw || typeof raw !== 'object') return null
	const row = raw as Record<string, unknown>
	const slot = Number(row.slot ?? row.index ?? row.image_index ?? 0)
	const x = Number(row.x)
	const y = Number(row.y)
	const w = Number(row.w ?? row.width)
	const h = Number(row.h ?? row.height)
	if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return null
	if (w <= 0 || h <= 0) return null
	return { slot: Number.isFinite(slot) ? slot : 0, x, y, w, h }
}

export function parseLayoutJson(raw: unknown): CollageLayoutSlot[] {
	if (raw == null) return []

	let data: unknown = raw
	if (typeof raw === 'string') {
		try {
			data = JSON.parse(raw) as unknown
		} catch {
			return []
		}
	}

	let list: unknown[] = []
	if (Array.isArray(data)) {
		list = data
	} else if (data && typeof data === 'object') {
		const row = data as Record<string, unknown>
		const nested = row.slots ?? row.layout
		list = Array.isArray(nested) ? nested : Object.values(row)
	}

	return list.map(normalizeSlot).filter((s): s is CollageLayoutSlot => s !== null)
}

export function extractCollageLayoutFromProduct(product: unknown): CollageLayout | null {
	if (!product || typeof product !== 'object') return null
	const row = product as Record<string, unknown>
	const raw = row.collage_layout ?? row.collageLayout
	if (!raw || typeof raw !== 'object') return null

	const layoutRow = raw as Record<string, unknown>
	const slots = parseLayoutJson(layoutRow.layout_json ?? layoutRow.layoutJson ?? layoutRow.slots)
	if (!slots.length) return null

	const refW = Number(layoutRow.canvas_width ?? layoutRow.reference_width ?? layoutRow.width)
	const refH = Number(layoutRow.canvas_height ?? layoutRow.reference_height ?? layoutRow.height)

	return {
		id: Number(layoutRow.id) || undefined,
		name: typeof layoutRow.name === 'string' ? layoutRow.name : undefined,
		layout_json: slots,
		reference_width: Number.isFinite(refW) && refW > 0 ? refW : undefined,
		reference_height: Number.isFinite(refH) && refH > 0 ? refH : undefined
	}
}

/** Границы макета по слотам (для масштабирования пиксельных координат). */
export function collageLayoutReferenceBounds(
	slots: CollageLayoutSlot[],
	override?: { width?: number; height?: number }
): { width: number; height: number } {
	const w = override?.width
	const h = override?.height
	if (w && h) return { width: w, height: h }

	let maxX = 0
	let maxY = 0
	for (const s of slots) {
		maxX = Math.max(maxX, s.x + s.w)
		maxY = Math.max(maxY, s.y + s.h)
	}
	return { width: Math.max(maxX, 1), height: Math.max(maxY, 1) }
}

export type LayoutImageRect = {
	left: number
	top: number
	width: number
	height: number
	centerX: number
	centerY: number
}

/** Прямоугольник изображения внутри viewport (contain / cover). */
export function fittedImageRectInViewport(
	imageW: number,
	imageH: number,
	viewportW: number,
	viewportH: number,
	viewportCenterX: number,
	viewportCenterY: number,
	fit: 'contain' | 'cover' = 'contain'
): LayoutImageRect {
	const iw = Math.max(imageW, 1)
	const ih = Math.max(imageH, 1)
	const scale =
		fit === 'contain'
			? Math.min(viewportW / iw, viewportH / ih)
			: Math.max(viewportW / iw, viewportH / ih)
	const width = iw * scale
	const height = ih * scale
	const originX = viewportCenterX - viewportW / 2
	const originY = viewportCenterY - viewportH / 2
	const left = originX + (viewportW - width) / 2
	const top = originY + (viewportH - height) / 2
	return {
		left,
		top,
		width,
		height,
		centerX: left + width / 2,
		centerY: top + height / 2
	}
}

/** 0–1 | 0–100 (%) | пиксели макета. */
export function detectSlotCoordinateMode(slots: CollageLayoutSlot[]): SlotCoordinateMode {
	let max = 0
	for (const s of slots) {
		max = Math.max(max, s.x, s.y, s.w, s.h, s.x + s.w, s.y + s.h)
	}
	if (max <= 1) return 'fraction'
	if (max <= 100) return 'percent'
	return 'absolute'
}

/**
 * Прямоугольник слота в контейнере (центр + размер).
 * x,y — левый верхний угол; w,h — ширина и высота в выбранных единицах.
 */
export function slotRectInContainer(
	slot: CollageLayoutSlot,
	containerW: number,
	containerH: number,
	containerCenterX: number,
	containerCenterY: number,
	mode: SlotCoordinateMode,
	refBounds?: { width: number; height: number }
): { left: number; top: number; width: number; height: number } {
	const originX = containerCenterX - containerW / 2
	const originY = containerCenterY - containerH / 2

	if (mode === 'fraction') {
		const width = slot.w * containerW
		const height = slot.h * containerH
		return {
			width,
			height,
			left: originX + slot.x * containerW + width / 2,
			top: originY + slot.y * containerH + height / 2
		}
	}

	if (mode === 'percent') {
		const width = (slot.w / 100) * containerW
		const height = (slot.h / 100) * containerH
		return {
			width,
			height,
			left: originX + (slot.x / 100) * containerW + width / 2,
			top: originY + (slot.y / 100) * containerH + height / 2
		}
	}

	const ref = refBounds ?? collageLayoutReferenceBounds([slot])
	const scale = Math.min(containerW / ref.width, containerH / ref.height)
	const offsetX = (containerW - ref.width * scale) / 2
	const offsetY = (containerH - ref.height * scale) / 2
	const width = slot.w * scale
	const height = slot.h * scale
	return {
		width,
		height,
		left: originX + offsetX + slot.x * scale + width / 2,
		top: originY + offsetY + slot.y * scale + height / 2
	}
}

/** Слот на mockup: те же границы, что и у product.images на canvas (contain). */
export function slotRectOnMockup(
	slot: CollageLayoutSlot,
	slots: CollageLayoutSlot[],
	viewportW: number,
	viewportH: number,
	viewportCenterX: number,
	viewportCenterY: number,
	mockupImageW: number,
	mockupImageH: number,
	layoutRef?: { width?: number; height?: number }
): { left: number; top: number; width: number; height: number } {
	const imageRect = fittedImageRectInViewport(
		mockupImageW,
		mockupImageH,
		viewportW,
		viewportH,
		viewportCenterX,
		viewportCenterY,
		'contain'
	)
	const mode = detectSlotCoordinateMode(slots)
	const refBounds = collageLayoutReferenceBounds(slots, {
		width: layoutRef?.width ?? mockupImageW,
		height: layoutRef?.height ?? mockupImageH
	})
	return slotRectInContainer(
		slot,
		imageRect.width,
		imageRect.height,
		imageRect.centerX,
		imageRect.centerY,
		mode,
		refBounds
	)
}

/** Слоты слева направо, сверху вниз — upload[0] → slots[0] и т.д. */
export function sortLayoutSlots(slots: CollageLayoutSlot[]): CollageLayoutSlot[] {
	return [...slots].sort((a, b) => {
		if (a.slot !== b.slot) return a.slot - b.slot
		if (a.y !== b.y) return a.y - b.y
		return a.x - b.x
	})
}

/** Небольшой отступ внутрь «дырки» рамки. */
export function insetSlotRect(
	rect: { left: number; top: number; width: number; height: number },
	ratio = 0.025
): { left: number; top: number; width: number; height: number } {
	const w = Math.max(1, rect.width * (1 - ratio * 2))
	const h = Math.max(1, rect.height * (1 - ratio * 2))
	return { left: rect.left, top: rect.top, width: w, height: h }
}

/** @deprecated используйте slotRectInContainer */
export function slotRectInPrintArea(
	slot: CollageLayoutSlot,
	printW: number,
	printH: number,
	printCenterX: number,
	printCenterY: number
): { left: number; top: number; width: number; height: number } {
	const mode = detectSlotCoordinateMode([slot])
	return slotRectInContainer(slot, printW, printH, printCenterX, printCenterY, mode)
}
