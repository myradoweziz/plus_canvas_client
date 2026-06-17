import { parseMockupSceneFromImage } from '~/utils/mockupScene'
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
	/** Макс. число загрузок в UploaderModal (API: collage_layout.max_images). */
	max_images?: number
	/** Размер макета с бэкенда (если слоты в пикселях). */
	reference_width?: number
	reference_height?: number
}

const nestedImagePayload = (row: Record<string, unknown>): Record<string, unknown> | null => {
	const nested = row.image
	if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return null
	return nested as Record<string, unknown>
}

export function getProductImageUrl(img: Image | Record<string, unknown>): string {
	const row = img as Record<string, unknown>
	const nested = nestedImagePayload(row)

	const url = String(
		nested?.url ?? nested?.image_url ?? row.url ?? row.image_url ?? ''
	).trim()
	if (url) return url

	const path = String(nested?.path ?? row.path ?? '').trim()
	if (path) return path

	if (typeof row.image === 'string') {
		return row.image.trim()
	}

	return ''
}

export function getProductImageEntry(product: unknown): Image | null {
	if (!product || typeof product !== 'object') return null
	const row = product as Record<string, unknown>
	const single = row.image
	if (single && typeof single === 'object' && !Array.isArray(single)) {
		return single as Image
	}
	return null
}

/** Product: одно поле `image`; категории: массив `images`. */
export function getProductImagesList(product: unknown): Image[] {
	const single = getProductImageEntry(product)
	if (single) return [single]

	if (!product || typeof product !== 'object') return []
	const row = product as Record<string, unknown>
	const list = row.images ?? row.product_images
	if (!Array.isArray(list)) return []
	return list as Image[]
}

export function isProductMockupImage(img: Image | Record<string, unknown>): boolean {
	const row = img as Record<string, unknown>
	if (row.dynamic === true) return true
	return Boolean(parseMockupSceneFromImage(img))
}

/** Фото для слотов коллажа. Одиночное `image` продукта — всегда mockup, не коллаж. */
export function getProductCollageImages(product: unknown): Image[] {
	const list = getProductImagesList(product)
	if (list.length <= 1) return []

	const collageOnly = list.filter((img) => !isProductMockupImage(img))
	if (collageOnly.length) return collageOnly

	return list.slice(1)
}

/** Mockup / фон комнаты — product.image или images[] категории. */
export function getProductMockupImages(product: unknown): Image[] {
	const list = getProductImagesList(product)
	if (!list.length) return []

	const mockups = list.filter((img) => isProductMockupImage(img))
	if (mockups.length) return mockups

	return [list[0]]
}

export function extractProductImageUrls(product: unknown): string[] {
	return getProductImagesList(product)
		.map((item) => getProductImageUrl(item))
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

const readCollageLayoutId = (product: unknown): number | null => {
	if (!product || typeof product !== 'object') return null
	const row = product as Record<string, unknown>
	const id = Number(row.collage_layout_id ?? row.collageLayoutId)
	return Number.isFinite(id) && id > 0 ? id : null
}

/** Товар с upload-коллажем (collage_layout_id или вложенный collage_layout). */
export function productUsesCollageLayout(product: unknown): boolean {
	if (readCollageLayoutId(product) != null) return true
	const layout = extractCollageLayoutFromProduct(product)
	return (layout?.layout_json.length ?? 0) > 0
}

export function extractCollageLayoutFromProduct(product: unknown): CollageLayout | null {
	if (!product || typeof product !== 'object') return null
	const row = product as Record<string, unknown>
	const raw = row.collage_layout ?? row.collageLayout
	const productLayoutId = readCollageLayoutId(product)

	if (row.layout_template === '2-split-vertical') {
		return {
			layout_json: [
				{ slot: 0, x: 0, y: 0, w: 300, h: 295 },
				{ slot: 1, x: 0, y: 305, w: 300, h: 295 }
			],
			reference_width: 300,
			reference_height: 600,
			max_images: 2
		}
	}

	if (!raw || typeof raw !== 'object') {
		const slotsFromRoot = parseLayoutJson(row.layout_json ?? row.layoutJson)
		if (!slotsFromRoot.length) return null
		const refW = Number(row.canvas_width ?? row.reference_width)
		const refH = Number(row.canvas_height ?? row.reference_height)
		const maxImages = Number(row.max_images ?? row.upload_image_count)
		return {
			id: productLayoutId ?? undefined,
			layout_json: slotsFromRoot,
			max_images: Number.isFinite(maxImages) && maxImages > 0 ? maxImages : undefined,
			reference_width: Number.isFinite(refW) && refW > 0 ? refW : undefined,
			reference_height: Number.isFinite(refH) && refH > 0 ? refH : undefined
		}
	}

	const layoutRow = raw as Record<string, unknown>
	const slots = parseLayoutJson(layoutRow.layout_json ?? layoutRow.layoutJson ?? layoutRow.slots)
	if (!slots.length) return null

	const refW = Number(layoutRow.canvas_width ?? layoutRow.reference_width ?? layoutRow.width)
	const refH = Number(layoutRow.canvas_height ?? layoutRow.reference_height ?? layoutRow.height)
	const maxImages = Number(layoutRow.max_images ?? layoutRow.maxImages)
	const nestedId = Number(layoutRow.id)

	return {
		id: (Number.isFinite(nestedId) && nestedId > 0 ? nestedId : productLayoutId) ?? undefined,
		name: typeof layoutRow.name === 'string' ? layoutRow.name : undefined,
		layout_json: slots,
		max_images: Number.isFinite(maxImages) && maxImages > 0 ? maxImages : undefined,
		reference_width: Number.isFinite(refW) && refW > 0 ? refW : undefined,
		reference_height: Number.isFinite(refH) && refH > 0 ? refH : undefined
	}
}

/** Лимит загрузки для UploaderModal: collage_layout.max_images → upload_image_count. */
export function getProductUploadMaxImages(product: unknown): number | undefined {
	if (!product || typeof product !== 'object') return undefined

	const layout = extractCollageLayoutFromProduct(product)
	if (layout?.max_images && layout.max_images > 0) return layout.max_images

	const row = product as Record<string, unknown>
	const fromProduct = Number(row.upload_image_count)
	if (Number.isFinite(fromProduct) && fromProduct > 0) return fromProduct

	return undefined
}

/**
 * Для absolute-координат: если reference с API намного больше реальных слотов,
 * иначе фото в коллаже получаются крошечными.
 */
export function resolveLayoutRefBounds(
	slots: CollageLayoutSlot[],
	override?: { width?: number; height?: number }
): { width?: number; height?: number } | undefined {
	const mode = detectSlotCoordinateMode(slots)
	if (mode !== 'absolute') {
		if (override?.width && override?.height) return { width: override.width, height: override.height }
		return undefined
	}

	const fromSlots = collageLayoutReferenceBounds(slots)
	const ow = override?.width
	const oh = override?.height
	if (!ow || !oh || ow <= 0 || oh <= 0) return fromSlots
	if (ow > fromSlots.width * 1.25 || oh > fromSlots.height * 1.25) return fromSlots
	return { width: ow, height: oh }
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
	const scale = fit === 'contain' ? Math.min(viewportW / iw, viewportH / ih) : Math.max(viewportW / iw, viewportH / ih)
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

/**
 * Коллаж внутри области печати: contain по пропорциям макета,
 * чтобы при Yatay слоты не растягивались на всю ширину и фото не «раздувались».
 */
export function collageLayoutFittedInPrintArea(
	slots: CollageLayoutSlot[],
	printW: number,
	printH: number,
	printCenterX: number,
	printCenterY: number,
	layoutRef?: { width?: number; height?: number }
): LayoutImageRect {
	const ref = collageLayoutReferenceBounds(slots, {
		width: layoutRef?.width,
		height: layoutRef?.height
	})
	return fittedImageRectInViewport(ref.width, ref.height, printW, printH, printCenterX, printCenterY, 'contain')
}

/** Слот внутри области печати (формат Dikey / Kare / Yatay). */
export function slotRectInPrintArea(
	slot: CollageLayoutSlot,
	slots: CollageLayoutSlot[],
	printW: number,
	printH: number,
	printCenterX: number,
	printCenterY: number,
	layoutRef?: { width?: number; height?: number }
): { left: number; top: number; width: number; height: number } {
	const mode = detectSlotCoordinateMode(slots)
	const refBounds = collageLayoutReferenceBounds(slots, {
		width: layoutRef?.width,
		height: layoutRef?.height
	})
	const fitted = collageLayoutFittedInPrintArea(slots, printW, printH, printCenterX, printCenterY, layoutRef)
	return slotRectInContainer(slot, fitted.width, fitted.height, fitted.centerX, fitted.centerY, mode, refBounds)
}

export function collageSlotsBoundsInPrintArea(
	slots: CollageLayoutSlot[],
	printW: number,
	printH: number,
	printCenterX: number,
	printCenterY: number,
	layoutRef?: { width?: number; height?: number }
): { left: number; top: number; width: number; height: number } | null {
	if (!slots.length || printW < 1 || printH < 1) return null

	let minL = Infinity
	let minT = Infinity
	let maxR = -Infinity
	let maxB = -Infinity

	for (const slot of slots) {
		const rect = slotRectInPrintArea(slot, slots, printW, printH, printCenterX, printCenterY, layoutRef)
		const l = rect.left - rect.width / 2
		const r = rect.left + rect.width / 2
		const t = rect.top - rect.height / 2
		const b = rect.top + rect.height / 2
		minL = Math.min(minL, l)
		minT = Math.min(minT, t)
		maxR = Math.max(maxR, r)
		maxB = Math.max(maxB, b)
	}

	if (!Number.isFinite(minL) || maxR <= minL || maxB <= minT) return null

	return {
		left: (minL + maxR) / 2,
		top: (minT + maxB) / 2,
		width: maxR - minL,
		height: maxB - minT
	}
}

/** Слот на mockup: те же границы, что и у product.image на canvas. */
export function slotRectOnMockup(
	slot: CollageLayoutSlot,
	slots: CollageLayoutSlot[],
	viewportW: number,
	viewportH: number,
	viewportCenterX: number,
	viewportCenterY: number,
	mockupImageW: number,
	mockupImageH: number,
	layoutRef?: { width?: number; height?: number },
	mockupFit: 'contain' | 'cover' = 'contain'
): { left: number; top: number; width: number; height: number } {
	const imageRect = fittedImageRectInViewport(
		mockupImageW,
		mockupImageH,
		viewportW,
		viewportH,
		viewportCenterX,
		viewportCenterY,
		mockupFit
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

/** Общая рамка коллажа: bounding box всех слотов на mockup. */
export function collageSlotsBoundsOnMockup(
	slots: CollageLayoutSlot[],
	viewportW: number,
	viewportH: number,
	viewportCenterX: number,
	viewportCenterY: number,
	mockupImageW: number,
	mockupImageH: number,
	layoutRef?: { width?: number; height?: number },
	mockupFit: 'contain' | 'cover' = 'cover'
): { left: number; top: number; width: number; height: number } | null {
	if (!slots.length) return null

	let minL = Infinity
	let minT = Infinity
	let maxR = -Infinity
	let maxB = -Infinity

	for (const slot of slots) {
		const rect = slotRectOnMockup(
			slot,
			slots,
			viewportW,
			viewportH,
			viewportCenterX,
			viewportCenterY,
			mockupImageW,
			mockupImageH,
			layoutRef,
			mockupFit
		)
		const l = rect.left - rect.width / 2
		const r = rect.left + rect.width / 2
		const t = rect.top - rect.height / 2
		const b = rect.top + rect.height / 2
		minL = Math.min(minL, l)
		minT = Math.min(minT, t)
		maxR = Math.max(maxR, r)
		maxB = Math.max(maxB, b)
	}

	if (!Number.isFinite(minL) || maxR <= minL || maxB <= minT) return null

	return {
		left: (minL + maxR) / 2,
		top: (minT + maxB) / 2,
		width: maxR - minL,
		height: maxB - minT
	}
}

/** Слоты слева направо, сверху вниз (по slot / y / x). */
export function sortLayoutSlots(slots: CollageLayoutSlot[]): CollageLayoutSlot[] {
	return [...slots].sort((a, b) => {
		if (a.slot !== b.slot) return a.slot - b.slot
		if (a.y !== b.y) return a.y - b.y
		return a.x - b.x
	})
}

/**
 * Индекс в uploadImages для слота layout.
 * API часто отдаёт slot / image_index с 1 (1..N), а массив загрузок — с 0.
 */
export function uploadIndexForLayoutSlot(
	slotDef: CollageLayoutSlot,
	allSlots: CollageLayoutSlot[],
	sortedIndex: number,
	uploadCount: number
): number {
	if (uploadCount <= 0) return 0
	const fallback = Math.min(Math.max(0, sortedIndex), uploadCount - 1)
	const raw = slotDef.slot
	if (!Number.isFinite(raw)) return fallback

	const values = allSlots.map((s) => s.slot).filter((v) => Number.isFinite(v))
	if (!values.length) return fallback

	const min = Math.min(...values)
	const max = Math.max(...values)

	if (min >= 1 && !values.includes(0) && max <= uploadCount) {
		const idx = raw - 1
		if (idx >= 0 && idx < uploadCount) return idx
	}

	if (raw >= 0 && raw < uploadCount) return raw

	return fallback
}

export type CollageSlotUploadPair = {
	slotDef: CollageLayoutSlot
	uploadIndex: number
}

/** Пары слот layout ↔ индекс upload для загрузки на canvas. */
export function collageSlotsToLoad(
	sortedSlots: CollageLayoutSlot[],
	allSlots: CollageLayoutSlot[],
	uploadCount: number
): CollageSlotUploadPair[] {
	if (!sortedSlots.length || uploadCount <= 0) return []

	const pairs: CollageSlotUploadPair[] = []
	for (let i = 0; i < sortedSlots.length; i++) {
		const slotDef = sortedSlots[i]
		if (!slotDef) continue
		const uploadIndex = uploadIndexForLayoutSlot(slotDef, allSlots, i, uploadCount)
		if (uploadIndex < 0 || uploadIndex >= uploadCount) continue
		pairs.push({ slotDef, uploadIndex })
	}
	return pairs
}

/** Отступ слотов коллажа только от внутренней границы рамки (не между слотами). */
export const COLLAGE_FRAME_INNER_PAD_RATIO = 0.03

/** Отступ контента коллажа от внутреннего края полосы рамки (px). */
export const COLLAGE_FRAME_CONTENT_MARGIN_PX = 10

type CenterRect = { left: number; top: number; width: number; height: number }

export function insetCenterRectByPx(rect: CenterRect, padPx: number): CenterRect {
	const pad = Math.max(0, padPx)
	return {
		left: rect.left,
		top: rect.top,
		width: Math.max(1, rect.width - pad * 2),
		height: Math.max(1, rect.height - pad * 2)
	}
}

/** Уменьшение rect по ratio (для отступа от рамки). */
export function insetSlotRect(
	rect: { left: number; top: number; width: number; height: number },
	ratio = COLLAGE_FRAME_INNER_PAD_RATIO
): { left: number; top: number; width: number; height: number } {
	const w = Math.max(1, rect.width * (1 - ratio * 2))
	const h = Math.max(1, rect.height * (1 - ratio * 2))
	return { left: rect.left, top: rect.top, width: w, height: h }
}

export function centerRectsIntersect(a: CenterRect, b: CenterRect): boolean {
	const aL = a.left - a.width / 2
	const aR = a.left + a.width / 2
	const aT = a.top - a.height / 2
	const aB = a.top + a.height / 2
	const bL = b.left - b.width / 2
	const bR = b.left + b.width / 2
	const bT = b.top - b.height / 2
	const bB = b.top + b.height / 2
	return aL < bR && aR > bL && aT < bB && aB > bT
}

/** Обрезка слота, чтобы фото не вылезали за внутреннюю границу рамки. */
export function clampCenterRectToFrameInner(slot: CenterRect, frame: CenterRect): CenterRect {
	const slotL = slot.left - slot.width / 2
	const slotR = slot.left + slot.width / 2
	const slotT = slot.top - slot.height / 2
	const slotB = slot.top + slot.height / 2

	const fL = frame.left - frame.width / 2
	const fR = frame.left + frame.width / 2
	const fT = frame.top - frame.height / 2
	const fB = frame.top + frame.height / 2

	const iL = Math.max(slotL, fL)
	const iR = Math.min(slotR, fR)
	const iT = Math.max(slotT, fT)
	const iB = Math.min(slotB, fB)

	if (iL >= iR || iT >= iB) {
		return {
			left: frame.left,
			top: frame.top,
			width: Math.max(1, Math.min(slot.width, frame.width)),
			height: Math.max(1, Math.min(slot.height, frame.height))
		}
	}

	return {
		left: (iL + iR) / 2,
		top: (iT + iB) / 2,
		width: Math.max(1, iR - iL),
		height: Math.max(1, iB - iT)
	}
}
