import { useFabricImageLoader } from '~/composables/useFabricImageLoader'
import {
	extractCollageLayoutFromProduct,
	extractProductImageUrls,
	getProductImageUrl,
	COLLAGE_FRAME_CONTENT_MARGIN_PX,
	centerRectsIntersect,
	clampCenterRectToFrameInner,
	collageSlotsBoundsInPrintArea,
	collageSlotsBoundsOnMockup,
	collageSlotsToLoad,
	insetCenterRectByPx,
	slotRectInPrintArea,
	resolveLayoutRefBounds,
	slotRectOnMockup,
	sortLayoutSlots,
	type CollageLayoutSlot
} from '~/utils/collageLayout'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'
import {
	formatAspect,
	getDefaultSize,
	isNoFrame,
	normalizeFrameColor,
	printBoxInViewport,
	withNoFrameOption,
	type CanvasFormat,
	type FrameOption,
	type PrintSizeOption
} from '~/utils/productDesignConfig'
import type { Product, ProductDesignPayload, TempDesignImage } from '~/utils/types'

const DEFAULT_VIEWPORT_W = 560
const DEFAULT_VIEWPORT_H = 520
const FRAME_BORDER_WIDTH = 20

export function useProductCanvasEditor(options: {
	productId: Ref<string>
	wrapRef: Ref<HTMLElement | null>
	canvasFormats: Ref<CanvasFormat[]>
	canvasFrames?: Ref<FrameOption[]>
	product?: Ref<Product | null | undefined>
	onDesignUpdate?: (payload: ProductDesignPayload) => void
}) {
	const designStore = useProductDesignStore()
	const { loadHtmlImage } = useFabricImageLoader()

	const formatPresets = computed(() => options.canvasFormats.value)
	const frameOptions = computed(() => withNoFrameOption(options.canvasFrames?.value ?? []))
	const collageLayout = computed(() => extractCollageLayoutFromProduct(options.product?.value))
	const activeProductImageIndex = ref(0)

	const productBackgroundUrl = computed(() => {
		const urls = extractProductImageUrls(options.product?.value)
		if (!urls.length) return null
		const idx = Math.min(activeProductImageIndex.value, urls.length - 1)
		return urls[idx] ?? null
	})
	const hasCollageLayout = computed(() => (collageLayout.value?.layout_json.length ?? 0) > 0)
	const selectedFormat = ref<CanvasFormat | null>(null)
	const selectedSize = ref<PrintSizeOption | null>(null)
	const selectedFrame = ref<FrameOption | null>(null)

	const syncFrameSelection = () => {
		const list = frameOptions.value
		if (!list.length) {
			selectedFrame.value = null
			return
		}
		const current = selectedFrame.value
		selectedFrame.value = current && list.some((f) => f.id === current.id) ? current : list[0]
	}

	const syncSelectionFromFormats = () => {
		const formats = formatPresets.value
		if (!formats.length) {
			selectedFormat.value = null
			selectedSize.value = null
			return
		}
		const current = selectedFormat.value
		const format = current && formats.some((f) => f.id === current.id) ? current : formats[0]
		selectedFormat.value = format
		const sizeList = format.sizes
		const sizeCurrent = selectedSize.value
		selectedSize.value =
			sizeCurrent && sizeList.some((s) => s.id === sizeCurrent.id) ? sizeCurrent : getDefaultSize(format)
	}
	const isLoadingImage = ref(false)
	const isCanvasInitializing = ref(false)
	const isCanvasLoading = computed(() => isLoadingImage.value || isCanvasInitializing.value)
	const viewportW = ref(DEFAULT_VIEWPORT_W)
	const viewportH = ref(DEFAULT_VIEWPORT_H)

	let fabricLib: typeof import('fabric').fabric | null = null
	let canvasInitId = 0
	let resizeObserver: ResizeObserver | null = null

	const isActiveCanvasInit = (initId: number) => initId === canvasInitId
	let fabricCanvas: import('fabric').fabric.Canvas | null = null
	let canvasReady = false
	let photoObject: import('fabric').fabric.Image | null = null
	let collagePhotoObjects: import('fabric').fabric.Object[] = []
	let canvasInitInFlight = false
	let canvasInitPending = false
	let collageSyncInFlight: Promise<void> | null = null
	let viewportBgImage: import('fabric').fabric.Image | null = null
	let mockupNaturalW = 0
	let mockupNaturalH = 0
	let printAreaRect: import('fabric').fabric.Rect | null = null
	let frameObject: import('fabric').fabric.Object | null = null

	const uploadImages = computed(() => designStore.getSessionImages(options.productId.value))

	const innerThumbImages = computed((): TempDesignImage[] =>
		uploadImages.value.filter((u) => String(u?.url ?? '').trim().length > 0)
	)

	/** Слева — product.images (mockup / background). */
	const productBackgroundThumbs = computed((): TempDesignImage[] => {
		const p = options.product?.value
		if (!p) return []

		const fromImages = Array.isArray(p.images)
			? p.images
					.map((img, idx) => ({
						url: getProductImageUrl(img),
						id: idx + 1,
						session_id: 'product-image'
					}))
					.filter((item) => item.url.length > 0)
			: []

		if (fromImages.length) return fromImages

		return extractProductImageUrls(p).map((url, idx) => ({
			url,
			id: idx + 1,
			session_id: 'product-image'
		}))
	})

	/** Миниатюры слева: images товара; если их нет — inner_images из сессии. */
	const thumbImages = computed((): TempDesignImage[] => {
		const bg = productBackgroundThumbs.value
		return bg.length ? bg : innerThumbImages.value
	})

	const thumbsAreProductImages = computed(() => productBackgroundThumbs.value.length > 0)

	const activeImage = computed(() => designStore.getActiveImage(options.productId.value))

	const activeImageIndex = computed(() => {
		if (designStore.productId !== options.productId.value) return 0
		return designStore.activeImageIndex
	})

	const isThumbActive = (index: number) => {
		if (thumbsAreProductImages.value) return activeProductImageIndex.value === index
		return activeImageIndex.value === index
	}

	const previewUrl = (url: string) => {
		const raw = String(url ?? '').trim()
		if (!raw) return ''
		if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
		return mediaUrlForCanvas(raw)
	}

	/** Превью полосы форматов и слева: снимки с Fabric (как на холсте). */
	const canvasPreviewSrc = ref('')
	const formatPreviewById = ref<Record<number, string>>({})
	const thumbPreviewByIndex = ref<Record<number, string>>({})

	const isCanvasAlive = () => Boolean(fabricCanvas && fabricLib && canvasReady)

	const getCanvasExportBounds = () => {
		if (!fabricCanvas) return null
		const objects = fabricCanvas.getObjects().filter((o) => o.visible !== false)
		if (!objects.length) return null

		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity

		for (const obj of objects) {
			const br = obj.getBoundingRect(true, true)
			minX = Math.min(minX, br.left)
			minY = Math.min(minY, br.top)
			maxX = Math.max(maxX, br.left + br.width)
			maxY = Math.max(maxY, br.top + br.height)
		}

		const pad = 6
		const left = Math.max(0, Math.floor(minX - pad))
		const top = Math.max(0, Math.floor(minY - pad))
		const width = Math.min(viewportW.value, Math.ceil(maxX - minX + pad * 2))
		const height = Math.min(viewportH.value, Math.ceil(maxY - minY + pad * 2))

		if (width < 2 || height < 2) return null
		return { left, top, width, height }
	}

	const captureCanvasPreview = (): string | null => {
		if (!fabricCanvas) return null
		try {
			const bounds = getCanvasExportBounds()
			const opts: {
				format: 'png'
				quality: number
				multiplier: number
				left?: number
				top?: number
				width?: number
				height?: number
			} = {
				format: 'png',
				quality: 0.92,
				multiplier: 0.55
			}
			if (bounds) {
				opts.left = bounds.left
				opts.top = bounds.top
				opts.width = bounds.width
				opts.height = bounds.height
			}
			return fabricCanvas.toDataURL(opts)
		} catch {
			return null
		}
	}

	const captureSlotThumbnails = () => {
		if (!fabricCanvas) return
		const next: Record<number, string> = {}

		if (hasCollageLayout.value && collagePhotoObjects.length) {
			collagePhotoObjects.forEach((obj, i) => {
				try {
					const url = obj.toDataURL?.({
						format: 'png',
						quality: 0.92,
						multiplier: 0.35
					})
					if (url) next[i] = url
				} catch {
					/* слот ещё не отрисован */
				}
			})
		} else if (photoObject) {
			try {
				const url = photoObject.toDataURL?.({
					format: 'png',
					quality: 0.92,
					multiplier: 0.35
				})
				if (url) next[0] = url
			} catch {
				/* noop */
			}
		}

		thumbPreviewByIndex.value = next
	}

	const syncCanvasDerivedPreviews = () => {
		if (!isCanvasAlive()) return
		captureSlotThumbnails()
		const snap = captureCanvasPreview()
		if (!snap) return
		canvasPreviewSrc.value = snap
		const id = selectedFormat.value?.id
		if (id == null) return
		const activeKey = Number(id)
		const next: Record<number, string> = { [activeKey]: snap }
		for (const format of formatPresets.value) {
			next[Number(format.id)] = snap
		}
		formatPreviewById.value = next
	}

	const getThumbPreviewSrc = (index: number) => {
		if (thumbsAreProductImages.value) {
			const url = productBackgroundThumbs.value[index]?.url
			return url ? previewUrl(url) : ''
		}
		const fromCanvas = thumbPreviewByIndex.value[index]
		if (fromCanvas) return fromCanvas
		const url = innerThumbImages.value[index]?.url
		return url ? previewUrl(url) : ''
	}

	const scheduleCanvasPreview = () => {
		if (!import.meta.client || !isCanvasAlive()) return
		nextTick(() => {
			requestAnimationFrame(() => syncCanvasDerivedPreviews())
		})
	}

	const getViewportSize = () => {
		const el = options.wrapRef.value
		if (!el) return { width: DEFAULT_VIEWPORT_W, height: DEFAULT_VIEWPORT_H }
		const w = Math.max(1, Math.floor(el.offsetWidth || el.clientWidth))
		const h = Math.max(1, Math.floor(el.offsetHeight || el.clientHeight))
		return { width: w, height: h }
	}

	/** Коллаж: mockup заполняет холст (cover), слоты считаются так же. */
	const mockupViewportFit = (): 'contain' | 'cover' =>
		hasCollageLayout.value ? 'cover' : 'cover'

	const applyWrapLayoutStyles = () => {
		const wrap = options.wrapRef.value
		if (!wrap) return
		wrap.style.position = 'relative'
		wrap.style.overflow = 'hidden'
		wrap.style.borderRadius = '20px'
		wrap.style.width = '100%'
		wrap.style.height = '100%'
		wrap.style.minHeight = '620px'
		wrap.style.backgroundColor = '#F5F2ED'
		wrap.style.display = 'block'

		const container = wrap.querySelector('.canvas-container') as HTMLElement | null
		if (container) {
			container.style.position = 'absolute'
			container.style.inset = '0'
			container.style.width = '100%'
			container.style.height = '100%'
			container.style.borderRadius = '20px'
			container.style.overflow = 'hidden'
			container.style.margin = '0'
		}
	}

	const cx = () => viewportW.value / 2
	const cy = () => viewportH.value / 2

	const emitDesign = () => {
		if (!fabricCanvas || !options.onDesignUpdate) return
		const payload: ProductDesignPayload = {
			fabric: fabricCanvas.toJSON() as Record<string, unknown>,
			tempImage: activeImage.value,
			canvasWidth: viewportW.value,
			canvasHeight: viewportH.value,
			printSizeLabel: selectedSize.value?.display_name,
			printSizeId: selectedSize.value?.id,
			printPrice: selectedSize.value?.price,
			formatId: selectedFormat.value?.id,
			formatLabel: selectedFormat.value?.name,
			frameId: selectedFrame.value?.id ?? undefined
		}
		options.onDesignUpdate(payload)
	}

	const updatePhotoClipPath = () => {
		if (!photoObject || !printAreaRect || !fabricLib) return
		const width = printAreaRect.width ?? 1
		const height = printAreaRect.height ?? 1
		photoObject.clipPath = new fabricLib.Rect({
			width: width,
			height: height,
			left: cx(),
			top: cy(),
			originX: 'center',
			originY: 'center',
			absolutePositioned: true
		})
		photoObject.dirty = true
		photoObject.setCoords()
	}

	const removeCollagePhotos = () => {
		if (!fabricCanvas) return
		for (const img of collagePhotoObjects) {
			fabricCanvas.remove(img)
		}
		collagePhotoObjects = []
	}

	const removeSinglePhoto = () => {
		if (photoObject && fabricCanvas) {
			fabricCanvas.remove(photoObject)
			photoObject = null
		}
	}

	const fitImageInSlot = (
		img: import('fabric').fabric.Image,
		slotW: number,
		slotH: number,
		slotCx: number,
		slotCy: number
	) => {
		const iw = img.width || 1
		const ih = img.height || 1
		const scale = Math.max(slotW / iw, slotH / ih)
		img.set({
			scaleX: scale,
			scaleY: scale,
			left: slotCx,
			top: slotCy,
			originX: 'center',
			originY: 'center'
		})
		img.setCoords()
	}

	const getPrintDimensions = () => {
		const maxW = viewportW.value * 0.9
		const maxH = viewportH.value * 0.9
		const format = selectedFormat.value
		if (!format) return printBoxInViewport(1, maxW, maxH)
		return printBoxInViewport(formatAspect(format, selectedSize.value), maxW, maxH)
	}

	const layoutRefForCollage = (allSlots: CollageLayoutSlot[]) => {
		const layout = collageLayout.value
		return resolveLayoutRefBounds(allSlots, {
			width: layout?.reference_width,
			height: layout?.reference_height
		})
	}

	/** Позиция слота: в области печати (формат), иначе на mockup. */
	const rawSlotRectForCollage = (
		slotDef: CollageLayoutSlot,
		allSlots: CollageLayoutSlot[],
		layoutRef?: { width?: number; height?: number },
		mockupW?: number,
		mockupH?: number
	) => {
		if (printAreaRect) {
			const pw = printAreaRect.width ?? 1
			const ph = printAreaRect.height ?? 1
			return slotRectInPrintArea(slotDef, allSlots, pw, ph, cx(), cy(), layoutRef)
		}

		const layout = collageLayout.value
		const mW = mockupW ?? (mockupNaturalW > 0 ? mockupNaturalW : layout?.reference_width || viewportW.value)
		const mH = mockupH ?? (mockupNaturalH > 0 ? mockupNaturalH : layout?.reference_height || viewportH.value)
		return slotRectOnMockup(
			slotDef,
			allSlots,
			viewportW.value,
			viewportH.value,
			cx(),
			cy(),
			mW,
			mH,
			layoutRef,
			mockupViewportFit()
		)
	}

	/** Фото заполняет область печати на 100% (object-fit: cover), фиксированный масштаб. */
	const fitPhotoCover = () => {
		if (!photoObject || !printAreaRect) return
		const pw = printAreaRect.width ?? 1
		const ph = printAreaRect.height ?? 1
		const iw = photoObject.width || 1
		const ih = photoObject.height || 1
		const scale = Math.max(pw / iw, ph / ih)
		photoObject.set({
			scaleX: scale,
			scaleY: scale,
			left: cx(),
			top: cy(),
			originX: 'center',
			originY: 'center'
		})
		photoObject.setCoords()
		updatePhotoClipPath()
		fabricCanvas?.requestRenderAll()
	}

	/** Пересчёт cover + clip без перезагрузки изображения (смена формата / resize). */
	const refitSinglePhoto = async () => {
		if (!fabricCanvas || !photoObject || !printAreaRect || hasCollageLayout.value) return
		fitPhotoCover()
		await updateFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
		emitDesign()
		scheduleCanvasPreview()
	}

	const lockFabricObject = (obj: import('fabric').fabric.Object) => {
		obj.set({
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			lockMovementX: true,
			lockMovementY: true,
			hasControls: false,
			selectable: false,
			evented: false,
			hoverCursor: 'default',
			moveCursor: 'default'
		})
		if ('setControlsVisibility' in obj && typeof obj.setControlsVisibility === 'function') {
			obj.setControlsVisibility({
				tl: false,
				tr: false,
				bl: false,
				br: false,
				ml: false,
				mt: false,
				mr: false,
				mb: false,
				mtr: false
			})
		}
	}

	const lockPhotoInteractions = (img: import('fabric').fabric.Image) => {
		lockFabricObject(img)
	}

	const fitImageInViewport = (img: import('fabric').fabric.Image, fit: 'contain' | 'cover') => {
		const vw = viewportW.value
		const vh = viewportH.value
		const iw = img.width || 1
		const ih = img.height || 1
		const scale = fit === 'contain' ? Math.min(vw / iw, vh / ih) : Math.max(vw / iw, vh / ih)
		img.set({
			scaleX: scale,
			scaleY: scale,
			left: vw / 2,
			top: vh / 2,
			originX: 'center',
			originY: 'center'
		})
		img.setCoords()
	}

	const removeViewportBackground = () => {
		if (viewportBgImage && fabricCanvas) {
			fabricCanvas.remove(viewportBgImage)
			viewportBgImage = null
		}
	}

	const reorderLayers = () => {
		if (!fabricCanvas) return
		if (viewportBgImage) fabricCanvas.sendToBack(viewportBgImage)
		let z = 1
		if (printAreaRect) {
			fabricCanvas.moveTo(printAreaRect, z)
			z += 1
		}
		for (const img of collagePhotoObjects) {
			fabricCanvas.moveTo(img, z)
			z += 1
		}
		if (photoObject) {
			fabricCanvas.moveTo(photoObject, z)
			z += 1
		}
		for (const obj of fabricCanvas.getObjects()) {
			const role = (obj as { data?: { role?: string } }).data?.role
			if (role === 'frame-border') {
				fabricCanvas.moveTo(obj, z)
				z += 1
			}
		}
		if (frameObject) {
			fabricCanvas.moveTo(frameObject, z)
			z += 1
		}
	}

	/** Фон canvas — изображение товара (product.images), без паттерна PlusCanvas. */
	const applyViewportBackground = async (initId?: number) => {
		if (initId !== undefined && !isActiveCanvasInit(initId)) return
		if (!fabricCanvas || !fabricLib) return

		removeViewportBackground()
		const url = productBackgroundUrl.value

		if (!url) {
			fabricCanvas.backgroundColor = '#F5F2ED'
			fabricCanvas.requestRenderAll()
			return
		}

		try {
			const el = await loadHtmlImage(url)
			if (initId !== undefined && !isActiveCanvasInit(initId)) return
			if (!fabricCanvas || !fabricLib) return

			const img = new fabricLib.Image(el, {
				selectable: false,
				evented: false,
				originX: 'center',
				originY: 'center'
			})
			lockPhotoInteractions(img)
			mockupNaturalW = el.naturalWidth || img.width || 1
			mockupNaturalH = el.naturalHeight || img.height || 1
			fitImageInViewport(img, mockupViewportFit())
			viewportBgImage = img
			fabricCanvas.add(viewportBgImage)
			fabricCanvas.backgroundColor = 'transparent'
			reorderLayers()
			fabricCanvas.requestRenderAll()
		} catch {
			fabricCanvas.backgroundColor = '#F5F2ED'
			fabricCanvas.requestRenderAll()
		}
	}

	const removeFrame = () => {
		if (!fabricCanvas) return

		if (frameObject) {
			fabricCanvas.remove(frameObject)
			frameObject = null
		}
		for (const obj of [...fabricCanvas.getObjects()]) {
			const role = (obj as { data?: { role?: string } }).data?.role
			if (role === 'frame-border' || role === 'frame-image') {
				fabricCanvas.remove(obj)
			}
		}

		fabricCanvas.requestRenderAll()
	}

	/** Точные границы коллажа на холсте (после layout + refit). */
	const getCollageBoundsFromObjects = (): {
		left: number
		top: number
		width: number
		height: number
	} | null => {
		if (!collagePhotoObjects.length) return null

		let minL = Infinity
		let minT = Infinity
		let maxR = -Infinity
		let maxB = -Infinity

		for (const obj of collagePhotoObjects) {
			const br = obj.getBoundingRect(true, true)
			minL = Math.min(minL, br.left)
			minT = Math.min(minT, br.top)
			maxR = Math.max(maxR, br.left + br.width)
			maxB = Math.max(maxB, br.top + br.height)
		}

		if (!Number.isFinite(minL) || maxR <= minL || maxB <= minT) return null

		return {
			left: (minL + maxR) / 2,
			top: (minT + maxB) / 2,
			width: maxR - minL,
			height: maxB - minT
		}
	}

	const getCollageBoundsFromLayout = () => {
		const layout = collageLayout.value
		if (!layout?.layout_json.length) return null

		const allSlots = layout.layout_json
		const layoutRef = layoutRefForCollage(allSlots)

		if (printAreaRect) {
			const pw = printAreaRect.width ?? 1
			const ph = printAreaRect.height ?? 1
			return collageSlotsBoundsInPrintArea(allSlots, pw, ph, cx(), cy(), layoutRef)
		}

		const mockupW =
			mockupNaturalW > 0 ? mockupNaturalW : layout.reference_width || viewportW.value
		const mockupH =
			mockupNaturalH > 0 ? mockupNaturalH : layout.reference_height || viewportH.value
		if (!mockupW || !mockupH) return null

		return collageSlotsBoundsOnMockup(
			allSlots,
			viewportW.value,
			viewportH.value,
			cx(),
			cy(),
			mockupW,
			mockupH,
			layoutRef,
			mockupViewportFit()
		)
	}

	/** Коллаж: рамка по области печати (формат) или layout на mockup. */
	const getFrameOuterBounds = (): {
		left: number
		top: number
		width: number
		height: number
	} | null => {
		if (hasCollageLayout.value) {
			if (printAreaRect) {
				return {
					left: cx(),
					top: cy(),
					width: printAreaRect.width ?? 0,
					height: printAreaRect.height ?? 0
				}
			}
			return getCollageBoundsFromLayout() ?? getCollageBoundsFromObjects()
		}

		if (!printAreaRect) return null
		return {
			left: cx(),
			top: cy(),
			width: printAreaRect.width ?? 0,
			height: printAreaRect.height ?? 0
		}
	}

	const drawSelectedFrame = async () => {
		const canvas = fabricCanvas
		const lib = fabricLib
		if (!canvas || !lib) return

		const frame = selectedFrame.value
		if (!frame || isNoFrame(frame)) return

		const outer = getFrameOuterBounds()
		if (!outer || outer.width < 1 || outer.height < 1) return

		const pw = outer.width
		const ph = outer.height
		const frameCx = outer.left
		const frameCy = outer.top
		const bw = FRAME_BORDER_WIDTH
		const borderColor = normalizeFrameColor(frame.color_hex)

		const addBar = (width: number, height: number, left: number, top: number) => {
			const rect = new lib.Rect({
				width,
				height,
				left,
				top,
				originX: 'center',
				originY: 'center',
				fill: borderColor,
				stroke: borderColor,
				strokeWidth: 1,
				objectCaching: false
			})
			rect.set({ data: { role: 'frame-border' } })
			lockFabricObject(rect)
			canvas.add(rect)
		}

		const halfW = pw / 2
		const halfH = ph / 2

		// Полосы по краю коллажа (внутрь), не снаружи — иначе верх/низ обрезаются overflow.
		addBar(pw, bw, frameCx, frameCy - halfH + bw / 2)
		addBar(pw, bw, frameCx, frameCy + halfH - bw / 2)
		addBar(bw, ph, frameCx - halfW + bw / 2, frameCy)
		addBar(bw, ph, frameCx + halfW - bw / 2, frameCy)
	}

	/** Отступ контейнера только при выбранной рамке (полоса + 10px). Без рамки — 0. */
	const getCollageContainerInsetPx = () => {
		const frame = selectedFrame.value
		if (!frame || isNoFrame(frame)) return 0
		return FRAME_BORDER_WIDTH + COLLAGE_FRAME_CONTENT_MARGIN_PX
	}

	const getCollageContentRect = (): {
		left: number
		top: number
		width: number
		height: number
	} | null => {
		const inset = getCollageContainerInsetPx()
		if (inset <= 0) return null

		const outer = getFrameOuterBounds()
		if (!outer) return null
		return insetCenterRectByPx(outer, inset)
	}

	const resolveCollageSlotRect = (rawRect: {
		left: number
		top: number
		width: number
		height: number
	}) => {
		const content = getCollageContentRect()
		if (!content) return rawRect

		const outer = getFrameOuterBounds()
		if (!outer || !centerRectsIntersect(rawRect, outer)) return rawRect

		return clampCenterRectToFrameInner(rawRect, content)
	}

	const applyGroupSlotRect = (
		group: import('fabric').fabric.Group,
		rect: { left: number; top: number; width: number; height: number }
	) => {
		if (!fabricLib) return
		const inner = group.getObjects()[0] as import('fabric').fabric.Image | undefined
		if (inner) fitImageInSlot(inner, rect.width, rect.height, 0, 0)

		const clipRect = new fabricLib.Rect({
			width: rect.width,
			height: rect.height,
			originX: 'center',
			originY: 'center',
			left: 0,
			top: 0,
			absolutePositioned: false
		})

		group.set({
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
			originX: 'center',
			originY: 'center'
		})
		group.clipPath = clipRect
		group.setCoords()
		inner?.setCoords()
	}

	const refitCollageSlotRects = () => {
		if (!fabricCanvas || !fabricLib || !collagePhotoObjects.length) return

		const metrics = getCollageMetrics()
		if (!metrics) return

		const { allSlots, sortedSlots, mockupW, mockupH, layoutRef } = metrics
		const pairs = collageSlotsToLoad(sortedSlots, allSlots, getCollageUploads().length)

		for (let i = 0; i < collagePhotoObjects.length; i++) {
			const group = collagePhotoObjects[i] as import('fabric').fabric.Group
			const slotDef = pairs[i]?.slotDef ?? sortedSlots[i]
			if (!group || !slotDef) continue

			const rawRect = rawSlotRectForCollage(slotDef, allSlots, layoutRef, mockupW, mockupH)
			applyGroupSlotRect(group, resolveCollageSlotRect(rawRect))
		}
	}

	const updateFrame = async () => {
		if (!fabricCanvas || !fabricLib) return
		if (!hasCollageLayout.value && !printAreaRect) return
		removeFrame()

		const frame = selectedFrame.value
		if (!frame || isNoFrame(frame)) {
			fabricCanvas.requestRenderAll()
			return
		}

		await drawSelectedFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
	}

	const getCollageMetrics = () => {
		const layout = collageLayout.value
		if (!layout) return null
		const allSlots = layout.layout_json
		const mockupW =
			mockupNaturalW > 0 ? mockupNaturalW : layout.reference_width || viewportW.value
		const mockupH =
			mockupNaturalH > 0 ? mockupNaturalH : layout.reference_height || viewportH.value

		return {
			layout,
			allSlots,
			sortedSlots: sortLayoutSlots(allSlots),
			mockupW,
			mockupH,
			layoutRef: resolveLayoutRefBounds(allSlots, {
				width: layout.reference_width,
				height: layout.reference_height
			})
		}
	}

	const addUploadToCollageSlot = async (
		upload: TempDesignImage,
		slotDef: CollageLayoutSlot,
		allSlots: CollageLayoutSlot[],
		mockupW: number,
		mockupH: number,
		layoutRef?: { width?: number; height?: number }
	) => {
		if (!fabricCanvas || !fabricLib) return

		const el = await loadHtmlImage(upload.url)
		const rawRect = rawSlotRectForCollage(slotDef, allSlots, layoutRef, mockupW, mockupH)
		const rect = resolveCollageSlotRect(rawRect)

		const img = new fabricLib.Image(el, {
			originX: 'center',
			originY: 'center',
			objectCaching: false
		})
		fitImageInSlot(img, rect.width, rect.height, 0, 0)

		const clipRect = new fabricLib.Rect({
			width: rect.width,
			height: rect.height,
			originX: 'center',
			originY: 'center',
			left: 0,
			top: 0,
			absolutePositioned: false
		})

		const group = new fabricLib.Group([img], {
			left: rect.left,
			top: rect.top,
			originX: 'center',
			originY: 'center',
			width: rect.width,
			height: rect.height,
			selectable: false,
			evented: false,
			objectCaching: false,
			subTargetCheck: false
		})
		group.clipPath = clipRect
		lockFabricObject(group)

		fabricCanvas.add(group)
		collagePhotoObjects.push(group)
	}

	const isMockupDimensionsReady = () => mockupNaturalW > 0 && mockupNaturalH > 0

	const waitForMockupDimensions = async (maxWaitMs = 2500) => {
		if (!productBackgroundUrl.value) return
		if (isMockupDimensionsReady()) return
		const deadline = Date.now() + maxWaitMs
		while (Date.now() < deadline) {
			if (isMockupDimensionsReady()) return
			await new Promise<void>((r) => requestAnimationFrame(() => r()))
		}
	}

	const ensureMockupReady = async () => {
		if (isMockupDimensionsReady()) return
		await applyViewportBackground()
		await waitForMockupDimensions()
	}

	const expectedCollageUploadCount = () => {
		const p = options.product?.value
		const fromProduct = (p?.inner_images ?? [])
			.map((img) => getProductImageUrl(img))
			.filter((u) => u.length > 0).length
		const fromSession = getCollageUploads().length
		const layoutSlots = collageLayout.value?.layout_json.length ?? 0
		return Math.max(fromProduct, fromSession, layoutSlots > 0 ? layoutSlots : 0)
	}

	const getCollageUploads = () => uploadImages.value.filter((u) => u?.url?.trim())

	const waitForCollageUploadsReady = async (minCount: number, maxWaitMs = 3000) => {
		const deadline = Date.now() + maxWaitMs
		while (Date.now() < deadline) {
			const uploads = getCollageUploads()
			if (minCount <= 0 || uploads.length >= minCount) return uploads
			await new Promise<void>((r) => setTimeout(r, 40))
		}
		return getCollageUploads()
	}

	const loadOneCollageSlot = async (
		upload: TempDesignImage,
		slotDef: CollageLayoutSlot,
		allSlots: CollageLayoutSlot[],
		mockupW: number,
		mockupH: number,
		layoutRef?: { width?: number; height?: number }
	) => {
		const maxAttempts = 3
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				await addUploadToCollageSlot(upload, slotDef, allSlots, mockupW, mockupH, layoutRef)
				return true
			} catch {
				if (attempt < maxAttempts - 1) {
					await new Promise<void>((r) => setTimeout(r, 150 * (attempt + 1)))
				}
			}
		}
		return false
	}

	const loadCollageSlotImages = async (
		uploads: TempDesignImage[],
		metrics: NonNullable<ReturnType<typeof getCollageMetrics>>
	) => {
		const { allSlots, sortedSlots, mockupW, mockupH, layoutRef } = metrics
		const pairs = collageSlotsToLoad(sortedSlots, allSlots, uploads.length)

		for (const { slotDef, uploadIndex } of pairs) {
			if (!fabricCanvas) break

			const upload = uploads[uploadIndex]
			if (!upload?.url || !slotDef) continue

			await loadOneCollageSlot(upload, slotDef, allSlots, mockupW, mockupH, layoutRef)
		}

		return pairs.length
	}

	const syncCollageSlots = async (): Promise<void> => {
		if (!fabricCanvas || !fabricLib || !printAreaRect || !collageLayout.value) return

		isLoadingImage.value = true
		try {
			if (collageSyncInFlight) {
				await collageSyncInFlight
				return
			}

			const run = async () => {
				if (!isMockupDimensionsReady() && productBackgroundUrl.value) {
					await applyViewportBackground()
				}
				await ensureMockupReady()
				if (!fabricCanvas || !fabricLib || !printAreaRect || !collageLayout.value) return

				const expected = expectedCollageUploadCount()
				const uploads = await waitForCollageUploadsReady(expected)
				if (!uploads.length) return

				const metrics = getCollageMetrics()
				if (!metrics) return

				removeSinglePhoto()
				removeCollagePhotos()

				const pairs = collageSlotsToLoad(metrics.sortedSlots, metrics.allSlots, uploads.length)
				const expectedLoaded = pairs.length
				let pass = 0
				while (pass < 3 && fabricCanvas) {
					if (pass > 0) {
						removeCollagePhotos()
						await new Promise<void>((r) => setTimeout(r, 200))
					}
					await loadCollageSlotImages(uploads, metrics)
					if (collagePhotoObjects.length >= expectedLoaded) break
					pass++
				}

				if (!fabricCanvas) return
				if (collagePhotoObjects.length > 0) refitCollageSlotRects()
				await updateFrame()
				reorderLayers()
				fabricCanvas.requestRenderAll()
				emitDesign()
				if (canvasReady) syncCanvasDerivedPreviews()
			}

			collageSyncInFlight = run()
			await collageSyncInFlight
		} finally {
			collageSyncInFlight = null
			isLoadingImage.value = false
		}
	}

	const syncPhotos = async (opts?: { syncCollage?: boolean }) => {
		if (!fabricCanvas || !fabricLib || !printAreaRect) return

		const shouldSyncCollage = opts?.syncCollage !== false

		isLoadingImage.value = true
		try {
			const useTemplateBg = Boolean(productBackgroundUrl.value)
			if (printAreaRect) {
				printAreaRect.set({
					fill: useTemplateBg ? 'transparent' : '#ffffff'
				})
			}

			if (hasCollageLayout.value) {
				if (shouldSyncCollage) await syncCollageSlots()
				return
			}

			removeCollagePhotos()
			const list = uploadImages.value
			if (list.length > 0) {
				if (photoObject) {
					await refitSinglePhoto()
				} else {
					const idx = Math.min(designStore.activeImageIndex, list.length - 1)
					await setPhotoFromUrl(list[idx]?.url ?? list[0].url, list[idx] ?? list[0], {
						skipBackground: true
					})
				}
			} else {
				removeSinglePhoto()
				await updateFrame()
				if (!fabricCanvas) return
				reorderLayers()
				fabricCanvas.requestRenderAll()
				emitDesign()
			}
		} finally {
			isLoadingImage.value = false
			scheduleCanvasPreview()
		}
	}

	const syncPrintArea = async () => {
		if (!fabricCanvas || !fabricLib || !selectedFormat.value) return

		const { width, height } = getPrintDimensions()

		const useTemplateBg = Boolean(productBackgroundUrl.value)

		if (!printAreaRect) {
			printAreaRect = new fabricLib.Rect({
				width,
				height,
				left: cx(),
				top: cy(),
				originX: 'center',
				originY: 'center',
				fill: useTemplateBg ? 'transparent' : '#ffffff',
				stroke: hasCollageLayout.value ? 'transparent' : '#d1d5db',
				strokeWidth: hasCollageLayout.value ? 0 : 1,
				selectable: false,
				evented: false
			})
			fabricCanvas.add(printAreaRect)
		} else {
			printAreaRect.set({
				width,
				height,
				scaleX: 1,
				scaleY: 1,
				left: cx(),
				top: cy(),
				stroke: hasCollageLayout.value ? 'transparent' : '#d1d5db',
				strokeWidth: hasCollageLayout.value ? 0 : 1
			})
			printAreaRect.setCoords()
		}

		await syncPhotos({ syncCollage: !hasCollageLayout.value })
		if (!fabricCanvas) return

		if (hasCollageLayout.value) {
			if (collagePhotoObjects.length) {
				refitCollageSlotRects()
				await updateFrame()
				reorderLayers()
				fabricCanvas.requestRenderAll()
				emitDesign()
				scheduleCanvasPreview()
			} else {
				await syncCollageSlots()
			}
		}
	}

	const setPhotoFromUrl = async (url: string, meta?: TempDesignImage | null, opts?: { skipBackground?: boolean }) => {
		if (!fabricCanvas || !fabricLib) return
		const manageLoading = !opts?.skipBackground
		if (manageLoading) isLoadingImage.value = true
		try {
			if (!opts?.skipBackground && printAreaRect) {
				printAreaRect.set({
					fill: productBackgroundUrl.value ? 'transparent' : '#ffffff'
				})
			}

			const el = await loadHtmlImage(url)
			if (photoObject) {
				fabricCanvas.remove(photoObject)
				photoObject = null
			}
			const img = new fabricLib.Image(el, {
				originX: 'center',
				originY: 'center',
				left: cx(),
				top: cy(),
				objectCaching: false
			})
			lockPhotoInteractions(img)
			fabricCanvas.add(img)
			photoObject = img
			fabricCanvas.discardActiveObject()
			fitPhotoCover()
			await updateFrame()
			reorderLayers()
			fabricCanvas.requestRenderAll()
			emitDesign()
			scheduleCanvasPreview()
		} finally {
			if (manageLoading) isLoadingImage.value = false
		}
	}

	const selectProductBackground = async (index: number) => {
		const count = productBackgroundThumbs.value.length
		if (index < 0 || index >= count) return
		if (activeProductImageIndex.value === index) return
		activeProductImageIndex.value = index

		if (!fabricCanvas || !canvasReady) return

		await applyViewportBackground()
		if (hasCollageLayout.value) {
			await syncCollageSlots()
		} else {
			await syncPhotos()
		}
		reorderLayers()
		fabricCanvas.requestRenderAll()
		scheduleCanvasPreview()
	}

	const selectUploadImage = async (index: number) => {
		const list = uploadImages.value
		if (index < 0 || index >= list.length) return
		designStore.setActiveImageIndex(index)
		await syncPhotos()
	}

	/** Клик по миниатюре слева. */
	const selectThumb = async (index: number) => {
		if (thumbsAreProductImages.value) {
			await selectProductBackground(index)
			return
		}
		await selectUploadImage(index)
	}

	const applyFormat = async (format: CanvasFormat) => {
		selectedFormat.value = format
		selectedSize.value = getDefaultSize(format)
		if (!fabricCanvas) {
			await tryInitOrSyncFormats()
			return
		}
		await syncPrintArea()
	}

	const applyFormatById = async (formatId: number) => {
		const id = Number(formatId)
		const f = formatPresets.value.find((x) => Number(x.id) === id)
		if (!f) return
		await applyFormat(f)
	}

	const applySizeById = async (sizeId: number) => {
		const format = selectedFormat.value
		if (!format) return
		const s = format.sizes.find((x) => x.id === sizeId)
		if (s) {
			selectedSize.value = s
			await syncPrintArea()
			emitDesign()
		}
	}

	const applyFrame = async (frame: FrameOption) => {
		selectedFrame.value = frame

		if (hasCollageLayout.value && !collagePhotoObjects.length) {
			await syncCollageSlots()
		} else if (hasCollageLayout.value && collagePhotoObjects.length) {
			refitCollageSlotRects()
		}
		await updateFrame()

		reorderLayers()
		fabricCanvas?.requestRenderAll()
		emitDesign()
		scheduleCanvasPreview()
	}

	const applyFrameByIndex = async (index: number) => {
		const frame = frameOptions.value[index]
		if (frame) await applyFrame(frame)
	}

	const resizeCanvasToContainer = async () => {
		if (!fabricCanvas || !options.wrapRef.value) return
		const { width, height } = getViewportSize()
		if (width < 2 || height < 2) return

		const sizeChanged = width !== viewportW.value || height !== viewportH.value
		if (!sizeChanged && canvasReady) return

		viewportW.value = width
		viewportH.value = height
		fabricCanvas.setDimensions({ width, height })
		fabricCanvas.calcOffset()
		applyWrapLayoutStyles()

		if (viewportBgImage) {
			fitImageInViewport(viewportBgImage, mockupViewportFit())
		}

		if (hasCollageLayout.value && canvasReady) {
			if (isMockupDimensionsReady() || !productBackgroundUrl.value) {
				await syncCollageSlots()
			}
		} else if (!hasCollageLayout.value) {
			await syncPrintArea()
		}

		fabricCanvas.requestRenderAll()
		if (canvasReady) scheduleCanvasPreview()
	}

	const disposeCanvas = () => {
		formatPreviewById.value = {}
		thumbPreviewByIndex.value = {}
		canvasPreviewSrc.value = ''
		canvasInitId++
		canvasReady = false
		resizeObserver?.disconnect()
		resizeObserver = null
		if (fabricCanvas) {
			try {
				fabricCanvas.dispose()
			} catch {
				/* noop */
			}
			fabricCanvas = null
		}
		photoObject = null
		collagePhotoObjects = []
		collageSyncInFlight = null
		viewportBgImage = null
		mockupNaturalW = 0
		mockupNaturalH = 0
		printAreaRect = null
		frameObject = null
		if (options.wrapRef.value) options.wrapRef.value.innerHTML = ''
	}

	const initCanvas = async () => {
		if (!import.meta.client || !options.wrapRef.value) return
		const showCollageLoader = hasCollageLayout.value
		if (showCollageLoader) {
			isCanvasInitializing.value = true
			isLoadingImage.value = true
		}
		try {
		disposeCanvas()
		const initId = canvasInitId

		const mod = await import('fabric')
		if (!isActiveCanvasInit(initId)) return

		const lib = mod.fabric
		if (!lib?.Canvas || !lib.Pattern) return
		fabricLib = lib

		if (!options.wrapRef.value) return

		applyWrapLayoutStyles()
		await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
		if (!isActiveCanvasInit(initId) || !options.wrapRef.value) return

		let { width, height } = getViewportSize()
		if (width < 2 || height < 2) {
			width = DEFAULT_VIEWPORT_W
			height = DEFAULT_VIEWPORT_H
		}
		viewportW.value = width
		viewportH.value = height

		const el = document.createElement('canvas')
		options.wrapRef.value.appendChild(el)

		fabricCanvas = new fabricLib.Canvas(el, {
			width,
			height,
			backgroundColor: '#F5F2ED',
			preserveObjectStacking: true,
			selection: false,
			skipTargetFind: true,
			defaultCursor: 'default',
			hoverCursor: 'default'
		})
		fabricCanvas.calcOffset()
		applyWrapLayoutStyles()

		resizeObserver = new ResizeObserver(() => {
			void resizeCanvasToContainer()
		})
		resizeObserver.observe(options.wrapRef.value)

		await applyViewportBackground(initId)
		if (!isActiveCanvasInit(initId)) return

		if (productBackgroundUrl.value && !isMockupDimensionsReady()) {
			await waitForMockupDimensions()
		}

		await resizeCanvasToContainer()
		if (!isActiveCanvasInit(initId)) return

		syncSelectionFromFormats()
		syncFrameSelection()
		await syncPrintArea()
		if (!isActiveCanvasInit(initId)) return

		if (hasCollageLayout.value) {
			const expected = expectedCollageUploadCount()
			let attempts = 0
			while (attempts < 5 && isActiveCanvasInit(initId)) {
				const uploads = await waitForCollageUploadsReady(expected)
				if (!uploads.length && expected > 0) {
					attempts++
					continue
				}
				if (uploads.length) await syncCollageSlots()
				if (!isActiveCanvasInit(initId)) return
				if (!expected || collagePhotoObjects.length >= expected) break
				await new Promise<void>((r) => setTimeout(r, 120))
				attempts++
			}
		}
		if (!isActiveCanvasInit(initId)) return

		canvasReady = true
		syncCanvasDerivedPreviews()
		scheduleCanvasPreview()
	} finally {
			if (showCollageLoader) {
				isCanvasInitializing.value = false
				if (!canvasReady) isLoadingImage.value = false
			}
		}
	}

	const tryInitOrSyncFormats = async () => {
		if (!import.meta.client || !formatPresets.value.length) return
		if (!options.wrapRef.value) return
		if (!designStore.hasSessionFor(options.productId.value)) return

		syncSelectionFromFormats()

		if (!fabricCanvas || !canvasReady) {
			if (canvasInitInFlight) {
				canvasInitPending = true
				return
			}
			canvasInitInFlight = true
			try {
				await initCanvas()
			} catch {
				/* aborted */
			} finally {
				canvasInitInFlight = false
				if (canvasInitPending) {
					canvasInitPending = false
					void tryInitOrSyncFormats()
				}
			}
			return
		}

		await syncPrintArea()
	}

	watch(formatPresets, () => void tryInitOrSyncFormats())
	watch(frameOptions, syncFrameSelection)

	watch(
		() => uploadImages.value.length,
		(len) => {
			if (len === 0) return
			if (!fabricCanvas || !canvasReady) {
				void tryInitOrSyncFormats()
				return
			}
			if (hasCollageLayout.value) {
				const expected = expectedCollageUploadCount()
				if (expected > 0 && collagePhotoObjects.length < expected) {
					void syncCollageSlots()
				}
			}
		}
	)

	watch([collageLayout, productBackgroundUrl], () => {
		if (!fabricCanvas || !canvasReady) return
		void (async () => {
			await applyViewportBackground()
			if (!fabricCanvas || !canvasReady) return

			if (hasCollageLayout.value) {
				await syncCollageSlots()
			} else {
				await syncPhotos()
			}
		})()
	})

	watch(
		() => options.wrapRef.value,
		(wrap) => {
			if (wrap) void tryInitOrSyncFormats()
		}
	)

	watch(
		() => options.product?.value?.id,
		() => {
			activeProductImageIndex.value = 0
		}
	)

	watch(
		() => productBackgroundThumbs.value.length,
		(len) => {
			if (len > 0 && activeProductImageIndex.value >= len) {
				activeProductImageIndex.value = 0
			}
		}
	)

	watch(
		() => options.productId.value,
		async () => {
			activeProductImageIndex.value = 0
			if (fabricCanvas && uploadImages.value.length) {
				await selectUploadImage(0)
			}
		}
	)

	onUnmounted(() => {
		disposeCanvas()
	})

	return {
		viewportW,
		viewportH,
		uploadImages,
		thumbImages,
		productBackgroundThumbs,
		thumbsAreProductImages,
		innerThumbImages,
		thumbPreviewByIndex,
		getThumbPreviewSrc,
		canvasPreviewSrc,
		formatPreviewById,
		activeImage,
		activeImageIndex,
		isThumbActive,
		previewUrl,
		isLoadingImage,
		isCanvasLoading,
		selectedFormat,
		selectedSize,
		selectedFrame,
		formatPresets,
		collageLayout,
		hasCollageLayout,
		productBackgroundUrl,
		sizeOptions: computed(() => selectedFormat.value?.sizes ?? []),
		frameOptions,
		initCanvas,
		selectThumb,
		selectUploadImage,
		selectProductBackground,
		applyFormat,
		applyFormatById,
		applySizeById,
		applyFrame,
		applyFrameByIndex,
		activeFormatId: computed(() => selectedFormat.value?.id ?? null),
		isFormatActive: (id: number) => Number(selectedFormat.value?.id) === Number(id),
		activeFrameId: computed(() => selectedFrame.value?.id ?? null),
		isFrameActive: (id: string) => selectedFrame.value?.id === id
	}
}
