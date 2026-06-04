import { useFabricImageLoader } from '~/composables/useFabricImageLoader'
import {
	centerRectsIntersect,
	clampCenterRectToFrameInner,
	collageSlotsBoundsInPrintArea,
	collageSlotsBoundsOnMockup,
	collageSlotsToLoad,
	extractCollageLayoutFromProduct,
	extractProductImageUrls,
	getProductImageUrl,
	insetCenterRectByPx,
	resolveLayoutRefBounds,
	slotRectInPrintArea,
	slotRectOnMockup,
	sortLayoutSlots,
	type CollageLayoutSlot
} from '~/utils/collageLayout'
import {
	CANVAS_PAINTING_STATIC_BG,
	getCanvasPaintingArtworkUrl,
	getCanvasPaintingDefaultFormat,
	getCanvasPaintingThumbImages,
	isCanvasPaintingGalleryProduct
} from '~/utils/canvasPaintingDisplay'
import {
	buildMockupSceneUrl,
	getDefaultPaletteForSetting,
	getInitialSceneColors,
	getSettingPoint,
	parseMockupSceneFromImage
} from '~/utils/mockupScene'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'
import {
	CANVAS_FRAME_GAP_PX,
	CANVAS_FRAME_OUTER_PX,
	formatAspect,
	formatOrientationAspect,
	FRAME_NONE_OPTION,
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
/** Цвет «загиба» между холстом и рамкой (как PlusCanvas). */
const FRAME_GAP_FILL = '#E8E4DC'

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

	const formatPresets = computed(() => {
		const fromApi = options.canvasFormats.value
		if (fromApi.length) return fromApi
		if (isCanvasPaintingGallery.value) return [getCanvasPaintingDefaultFormat()]
		return []
	})
	const frameOptions = computed(() => withNoFrameOption(options.canvasFrames?.value ?? []))
	const collageLayout = computed(() => extractCollageLayoutFromProduct(options.product?.value))
	const isCanvasPaintingGallery = computed(() => isCanvasPaintingGalleryProduct(options.product?.value))
	const useStaticFormatPreviews = computed(() => isCanvasPaintingGallery.value)
	const canvasPaintingArtworkUrl = computed(() => getCanvasPaintingArtworkUrl(options.product?.value))
	const activeProductImageIndex = ref(0)
	/** Цвета sceneSettings по индексу mockup в product.images */
	const mockupSceneColors = ref<Record<number, string[]>>({})

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
	let canvasLoadingDepth = 0

	const beginCanvasLoading = () => {
		canvasLoadingDepth++
		isLoadingImage.value = true
	}

	const endCanvasLoading = () => {
		canvasLoadingDepth = Math.max(0, canvasLoadingDepth - 1)
		if (canvasLoadingDepth === 0) isLoadingImage.value = false
	}

	const runWithCanvasLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
		beginCanvasLoading()
		try {
			return await fn()
		} finally {
			endCanvasLoading()
		}
	}

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

		if (isCanvasPaintingGallery.value) {
			return getCanvasPaintingThumbImages(p)
		}

		const fromImages = Array.isArray(p.images)
			? p.images
					.map((img, idx) => ({
						url: getProductImageUrl(img),
						id: idx + 1,
						session_id: 'product-image',
						mockupScene: parseMockupSceneFromImage(img)
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

	/** Миниатюры слева: images товара; personalized — uploads из сессии (не inner_images на UI). */
	const thumbImages = computed((): TempDesignImage[] => {
		const bg = productBackgroundThumbs.value
		if (bg.length || isCanvasPaintingGallery.value) return bg
		return innerThumbImages.value
	})

	const thumbsAreProductImages = computed(() => productBackgroundThumbs.value.length > 0)

	const mockupSceneUrlOptions = () => ({
		formatId: selectedFormat.value?.id ?? null,
		sizeId: selectedSize.value?.id ?? null,
		frameId: selectedFrame.value?.id ?? null,
		productId: options.product?.value?.id ?? null,
		width: 1400,
		height: 720
	})

	const ensureMockupSceneColors = (thumbIndex: number) => {
		const scene = productBackgroundThumbs.value[thumbIndex]?.mockupScene
		if (!scene?.settings.length) return
		if (mockupSceneColors.value[thumbIndex]?.length === scene.settings.length) return
		mockupSceneColors.value = {
			...mockupSceneColors.value,
			[thumbIndex]: getInitialSceneColors(scene)
		}
	}

	watch(
		productBackgroundThumbs,
		(thumbs) => {
			const next = { ...mockupSceneColors.value }
			let changed = false
			thumbs.forEach((thumb, index) => {
				const scene = thumb.mockupScene
				if (!scene?.settings.length) return
				if (next[index]?.length === scene.settings.length) return
				next[index] = getInitialSceneColors(scene)
				changed = true
			})
			if (changed) mockupSceneColors.value = next
		},
		{ immediate: true, deep: true }
	)

	const resolveMockupBackgroundUrl = (thumbIndex: number): string | null => {
		const bg = productBackgroundThumbs.value
		if (thumbIndex < 0 || thumbIndex >= bg.length) return null
		const raw = String(bg[thumbIndex]?.url ?? '').trim()
		if (!raw) return null

		const scene = bg[thumbIndex]?.mockupScene
		if (!scene?.settings.length) return raw

		ensureMockupSceneColors(thumbIndex)
		const colors =
			mockupSceneColors.value[thumbIndex] ?? scene.settings.map((s) => s.value)
		return buildMockupSceneUrl(raw, colors, mockupSceneUrlOptions())
	}

	const isMockupSceneActive = computed(() => {
		const idx = activeProductImageIndex.value
		return (productBackgroundThumbs.value[idx]?.mockupScene?.settings.length ?? 0) > 0
	})

	const activeMockupSceneSettings = computed(() => {
		const idx = activeProductImageIndex.value
		const scene = productBackgroundThumbs.value[idx]?.mockupScene
		if (!scene?.settings.length) return []

		const colors =
			mockupSceneColors.value[idx] ?? getInitialSceneColors(scene)

		return scene.settings.map((setting, index) => ({
			index,
			name: setting.name,
			value: colors[index] ?? setting.value,
			x: getSettingPoint(setting).x,
			y: getSettingPoint(setting).y,
			palette: setting.palette?.length ? setting.palette : getDefaultPaletteForSetting(setting.name)
		}))
	})

	/** Тот же URL mockup, что и в левом слайдере (product.images). */
	const productBackgroundUrl = computed(() => {
		if (isCanvasPaintingGallery.value) return CANVAS_PAINTING_STATIC_BG
		return resolveMockupBackgroundUrl(activeProductImageIndex.value)
	})

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
	/** Слева: только коллаж inner_images (прозрачный PNG поверх mockup в слайде). */
	const productThumbCollageByIndex = ref<Record<number, string>>({})
	let productThumbPreviewSyncId = 0
	let productThumbPreviewTimer: ReturnType<typeof setTimeout> | null = null
	let framePreviewSyncId = 0
	let suppressFormatPreviewWatch = false

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

	const scheduleActiveProductThumbCollage = () => {
		if (!import.meta.client || !shouldSyncProductThumbPreviews()) return
		requestAnimationFrame(() => refreshActiveProductThumbCollage())
	}

	const syncCanvasDerivedPreviews = () => {
		if (!isCanvasAlive()) return
		captureSlotThumbnails()
		scheduleActiveProductThumbCollage()
		const snap = captureCanvasPreview()
		if (!snap) return
		canvasPreviewSrc.value = snap
		const id = selectedFormat.value?.id
		if (id == null) return
		formatPreviewById.value = {
			...formatPreviewById.value,
			[Number(id)]: snap
		}
	}

	const shouldSyncProductThumbPreviews = () =>
		!isCanvasPaintingGallery.value &&
		thumbsAreProductImages.value &&
		hasCollageLayout.value &&
		getCollageUploads().length > 0

	const syncProductThumbPreviews = async (opts?: { manageLoading?: boolean }) => {
		if (!import.meta.client || !shouldSyncProductThumbPreviews()) return
		if (!fabricCanvas || !fabricLib || !canvasReady) return

		const manageLoading = opts?.manageLoading !== false
		if (manageLoading) beginCanvasLoading()
		try {
			await refreshAllProductThumbCollagesLight()
			syncCanvasDerivedPreviews()
		} finally {
			if (manageLoading) endCanvasLoading()
		}
	}

	/** Только активный mockup — после смены рамки/формата без цикла по всем фонам. */
	const refreshActiveProductThumbCollageSoon = () => {
		if (!shouldSyncProductThumbPreviews()) return
		if (productThumbPreviewTimer) clearTimeout(productThumbPreviewTimer)
		productThumbPreviewTimer = setTimeout(() => {
			productThumbPreviewTimer = null
			void refreshActiveProductThumbCollage()
		}, 120)
	}

	const scheduleProductThumbPreviews = () => {
		if (!shouldSyncProductThumbPreviews()) {
			productThumbCollageByIndex.value = {}
			return
		}
		if (productThumbPreviewTimer) clearTimeout(productThumbPreviewTimer)
		productThumbPreviewTimer = setTimeout(() => {
			productThumbPreviewTimer = null
			void syncProductThumbPreviews()
		}, 450)
	}

	const getProductThumbBackgroundSrc = (index: number) => {
		const url = resolveMockupBackgroundUrl(index)
		return url ? previewUrl(url) : ''
	}

	const getProductThumbCollageSrc = (index: number) => productThumbCollageByIndex.value[index] ?? ''

	const getThumbPreviewSrc = (index: number) => {
		if (thumbsAreProductImages.value) {
			if (isCanvasPaintingGallery.value) {
				const url = productBackgroundThumbs.value[index]?.url
				return url ? previewUrl(url) : ''
			}
			return getProductThumbBackgroundSrc(index)
		}
		const fromCanvas = thumbPreviewByIndex.value[index]
		if (fromCanvas) return fromCanvas
		const url = innerThumbImages.value[index]?.url
		return url ? previewUrl(url) : ''
	}

	const scheduleCanvasPreview = (opts?: { productThumbsActiveOnly?: boolean }) => {
		if (!import.meta.client || !isCanvasAlive()) return
		nextTick(() => {
			requestAnimationFrame(() => {
				syncCanvasDerivedPreviews()
				if (opts?.productThumbsActiveOnly) refreshActiveProductThumbCollageSoon()
				else scheduleProductThumbPreviews()
			})
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
	const mockupViewportFit = (): 'contain' | 'cover' => (hasCollageLayout.value ? 'cover' : 'cover')

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

	/** Центр области печати (совпадает с центром фото на холсте). */
	const getPrintAreaCenter = () => {
		if (printAreaRect) {
			printAreaRect.setCoords()
			return {
				left: printAreaRect.left ?? cx(),
				top: printAreaRect.top ?? cy()
			}
		}
		return { left: cx(), top: cy() }
	}

	/** Галерея: активная миниатюра product.images, не только [0]. */
	const getGalleryArtworkUrl = () => {
		const thumbs = productBackgroundThumbs.value
		const idx = activeProductImageIndex.value
		const fromThumb = thumbs[idx]?.url ?? thumbs[0]?.url ?? ''
		if (fromThumb) return fromThumb
		return canvasPaintingArtworkUrl.value ?? ''
	}

	const resolvePrintAreaFill = () => {
		if (isCanvasPaintingGallery.value) return '#ffffff'
		return productBackgroundUrl.value ? 'transparent' : '#ffffff'
	}

	const hasActiveFrame = () => {
		const frame = selectedFrame.value
		return Boolean(frame && !isNoFrame(frame))
	}

	/** Отступ «загиба» между фото и рамкой (PlusCanvas ~2 cm). */
	const getActiveFrameGapPx = () => (hasActiveFrame() ? CANVAS_FRAME_GAP_PX : 0)

	/** Размер лица холста под clip/cover — уже на gap, если выбрана рамка. */
	const getPhotoFaceSize = () => {
		const pw = printAreaRect?.width ?? 1
		const ph = printAreaRect?.height ?? 1
		const g = getActiveFrameGapPx()
		return {
			width: Math.max(1, pw - 2 * g),
			height: Math.max(1, ph - 2 * g)
		}
	}

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
		const { width, height } = getPhotoFaceSize()
		const center = getPrintAreaCenter()
		photoObject.clipPath = new fabricLib.Rect({
			width: width,
			height: height,
			left: center.left,
			top: center.top,
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
		const sx = img.scaleX || 1
		const sy = img.scaleY || 1
		const iw = (img.width || 1) / sx
		const ih = (img.height || 1) / sy
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

	/** Ориентация области печати: по формату (Dikey/Kare/Yatay); Boyut — только при preferSize. */
	const getPrintDimensions = (opts?: { preferSize?: boolean }) => {
		const maxW = viewportW.value * 0.9
		const maxH = viewportH.value * 0.9
		const format = selectedFormat.value
		if (!format) return printBoxInViewport(1, maxW, maxH)

		const size = selectedSize.value
		const aspect =
			opts?.preferSize && size && size.height > 0
				? formatAspect(format, size)
				: formatOrientationAspect(format)

		return printBoxInViewport(aspect, maxW, maxH)
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

	/** Фото по центру области печати, cover (заполняет «лицо» холста). */
	const fitPhotoInPrintArea = () => {
		if (!photoObject || !printAreaRect) return
		const { width: pw, height: ph } = getPhotoFaceSize()
		const iw = photoObject.width || 1
		const ih = photoObject.height || 1
		const scale = Math.max(pw / iw, ph / ih)
		const center = getPrintAreaCenter()
		photoObject.set({
			scaleX: scale,
			scaleY: scale,
			left: center.left,
			top: center.top,
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
		fitPhotoInPrintArea()
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
			if (role === 'frame-gap') {
				fabricCanvas.moveTo(obj, z)
				z += 1
			}
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
			if (role === 'frame-border' || role === 'frame-gap' || role === 'frame-image') {
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

	const isThumbOverlayObject = (obj: import('fabric').fabric.Object) => {
		if (collagePhotoObjects.includes(obj)) return true
		if (obj === frameObject) return true
		const role = (obj as { data?: { role?: string } }).data?.role
		return role === 'frame-border' || role === 'frame-gap'
	}

	const getProductThumbCollageExportBounds = () => {
		const outer = getFrameOuterBounds()
		if (outer && outer.width >= 1 && outer.height >= 1) {
			const padRatio = 0.1
			const w = outer.width * (1 + padRatio * 2)
			const h = outer.height * (1 + padRatio * 2)
			return {
				left: Math.max(0, Math.floor(outer.left - w / 2)),
				top: Math.max(0, Math.floor(outer.top - h / 2)),
				width: Math.min(viewportW.value, Math.ceil(w)),
				height: Math.min(viewportH.value, Math.ceil(h))
			}
		}

		const bounds = getCollageBoundsFromObjects()
		if (!bounds || bounds.width < 1 || bounds.height < 1) return null

		const padRatio = 0.06
		const w = bounds.width * (1 + padRatio * 2)
		const h = bounds.height * (1 + padRatio * 2)
		return {
			left: Math.max(0, Math.floor(bounds.left - w / 2)),
			top: Math.max(0, Math.floor(bounds.top - h / 2)),
			width: Math.min(viewportW.value, Math.ceil(w)),
			height: Math.min(viewportH.value, Math.ceil(h))
		}
	}

	/** PNG коллажа + рамка (без mockup) — слой поверх фона в левом слайдере. */
	const captureProductThumbCollageOverlay = (): string | null => {
		if (!fabricCanvas || !collagePhotoObjects.length) return null
		const exportBounds = getProductThumbCollageExportBounds()
		if (!exportBounds) return null

		const { left, top, width, height } = exportBounds
		const toggled: { obj: import('fabric').fabric.Object; visible: boolean }[] = []
		for (const obj of fabricCanvas.getObjects()) {
			if (!isThumbOverlayObject(obj)) {
				toggled.push({ obj, visible: obj.visible !== false })
				obj.visible = false
			}
		}
		const prevBg = fabricCanvas.backgroundColor
		fabricCanvas.backgroundColor = 'transparent'

		try {
			fabricCanvas.renderAll()
			return fabricCanvas.toDataURL({
				format: 'png',
				quality: 0.9,
				multiplier: 0.38,
				left,
				top,
				width,
				height
			})
		} catch {
			return null
		} finally {
			for (const { obj, visible } of toggled) obj.visible = visible
			if (viewportBgImage) viewportBgImage.visible = true
			fabricCanvas.backgroundColor = prevBg
			reorderLayers()
			fabricCanvas.requestRenderAll()
		}
	}

	const refreshActiveProductThumbCollage = () => {
		if (!isCanvasAlive() || !thumbsAreProductImages.value || !hasCollageLayout.value) return
		if (!getCollageUploads().length) return
		if (isLoadingImage.value) return
		const snap = captureProductThumbCollageOverlay()
		if (!snap) return
		productThumbCollageByIndex.value = {
			...productThumbCollageByIndex.value,
			[activeProductImageIndex.value]: snap
		}
	}

	const restoreCanvasLayoutAfterPreviewPass = async () => {
		if (!fabricCanvas || !canvasReady) return
		const format = selectedFormat.value
		if (!format) return
		const { width, height } = getPrintDimensions()
		if (printAreaRect) {
			printAreaRect.set({
				width,
				height,
				scaleX: 1,
				scaleY: 1,
				left: cx(),
				top: cy()
			})
			printAreaRect.setCoords()
		}
		if (hasCollageLayout.value && collagePhotoObjects.length) {
			refitCollageSlotRects()
		} else if (photoObject) {
			fitPhotoInPrintArea()
		}
		await updateFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
	}

	/** Лёгкое обновление миниатюр слева: refit + снимок, без syncCollageSlots. */
	const refreshAllProductThumbCollagesLight = async () => {
		if (!shouldSyncProductThumbPreviews() || !fabricCanvas || !canvasReady) return

		const count = productBackgroundThumbs.value.length
		if (count <= 1) {
			refreshActiveProductThumbCollage()
			return
		}

		const syncId = ++productThumbPreviewSyncId
		const savedIdx = activeProductImageIndex.value
		const next = { ...productThumbCollageByIndex.value }

		try {
			for (let i = 0; i < count; i++) {
				if (syncId !== productThumbPreviewSyncId) break
				activeProductImageIndex.value = i
				await applyViewportBackground()
				refitCollageSlotRects()
				await updateFrame()
				reorderLayers()
				fabricCanvas.requestRenderAll()
				const snap = captureProductThumbCollageOverlay()
				if (snap) next[i] = snap
			}
			if (syncId === productThumbPreviewSyncId) {
				productThumbCollageByIndex.value = next
			}
		} finally {
			if (syncId !== productThumbPreviewSyncId) return
			activeProductImageIndex.value = savedIdx
			await applyViewportBackground()
			await restoreCanvasLayoutAfterPreviewPass()
		}
	}

	/** Превью всех форматов в полосе (только refit, без перезагрузки фото). */
	const refreshAllFormatPreviewsLight = async (syncId: number) => {
		if (!fabricCanvas || !canvasReady || !formatPresets.value.length) return

		const savedFormat = selectedFormat.value
		const savedSize = selectedSize.value
		const next = { ...formatPreviewById.value }

		suppressFormatPreviewWatch = true
		try {
			for (const format of formatPresets.value) {
				if (syncId !== framePreviewSyncId) return
				selectedFormat.value = format
				selectedSize.value = getDefaultSize(format)
				const { width, height } = getPrintDimensions()
				if (printAreaRect) {
					printAreaRect.set({
						width,
						height,
						scaleX: 1,
						scaleY: 1,
						left: cx(),
						top: cy()
					})
					printAreaRect.setCoords()
				}
				if (hasCollageLayout.value && collagePhotoObjects.length) {
					refitCollageSlotRects()
				} else if (photoObject) {
					fitPhotoInPrintArea()
				}
				await updateFrame()
				reorderLayers()
				fabricCanvas.requestRenderAll()
				const snap = captureCanvasPreview()
				if (snap) next[Number(format.id)] = snap
			}

			if (syncId !== framePreviewSyncId) return
			if (savedFormat) selectedFormat.value = savedFormat
			if (savedSize) selectedSize.value = savedSize
			formatPreviewById.value = next
			await restoreCanvasLayoutAfterPreviewPass()
		} finally {
			suppressFormatPreviewWatch = false
		}
	}

	const refreshLayoutDerivedPreviews = async (opts?: {
		refreshAllFormatPreviews?: boolean
		refreshLeftThumbs?: boolean
	}) => {
		if (!fabricCanvas || !canvasReady) return
		await waitNextPaint()

		if (opts?.refreshAllFormatPreviews && formatPresets.value.length) {
			const syncId = ++framePreviewSyncId
			await refreshAllFormatPreviewsLight(syncId)
			if (syncId !== framePreviewSyncId) return
		}

		if (opts?.refreshLeftThumbs !== false) {
			await refreshAllProductThumbCollagesLight()
		}

		syncCanvasDerivedPreviews()
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

		const mockupW = mockupNaturalW > 0 ? mockupNaturalW : layout.reference_width || viewportW.value
		const mockupH = mockupNaturalH > 0 ? mockupNaturalH : layout.reference_height || viewportH.value
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

	const resolveFrameBarFill = async (
		frame: FrameOption
	): Promise<string | import('fabric').fabric.Pattern> => {
		const lib = fabricLib
		if (!lib) return normalizeFrameColor(frame.color_hex)

		const url = frame.image_url?.trim()
		if (!url) return normalizeFrameColor(frame.color_hex)

		try {
			const el = await loadHtmlImage(mediaUrlForCanvas(url))
			return new lib.Pattern({
				source: el,
				repeat: 'repeat'
			})
		} catch {
			return normalizeFrameColor(frame.color_hex)
		}
	}

	/** Рамка снаружи холста + зазор (PlusCanvas: ~3 cm рамка, ~2 cm «загиб»). */
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
		const bw = CANVAS_FRAME_OUTER_PX
		const gap = CANVAS_FRAME_GAP_PX
		const borderFill = await resolveFrameBarFill(frame)

		const addBar = (
			width: number,
			height: number,
			left: number,
			top: number,
			role: 'frame-border' | 'frame-gap',
			fill: string | import('fabric').fabric.Pattern
		) => {
			const rect = new lib.Rect({
				width,
				height,
				left,
				top,
				originX: 'center',
				originY: 'center',
				fill,
				stroke: role === 'frame-gap' ? FRAME_GAP_FILL : undefined,
				strokeWidth: role === 'frame-gap' ? 0 : 1,
				objectCaching: false
			})
			rect.set({ data: { role } })
			lockFabricObject(rect)
			canvas.add(rect)
		}

		const halfW = pw / 2
		const halfH = ph / 2

		// Зазор внутри print area — между фото и рамкой (видимый «загиб»).
		addBar(pw, gap, frameCx, frameCy - halfH + gap / 2, 'frame-gap', FRAME_GAP_FILL)
		addBar(pw, gap, frameCx, frameCy + halfH - gap / 2, 'frame-gap', FRAME_GAP_FILL)
		const gapSideH = Math.max(1, ph - 2 * gap)
		addBar(gap, gapSideH, frameCx - halfW + gap / 2, frameCy, 'frame-gap', FRAME_GAP_FILL)
		addBar(gap, gapSideH, frameCx + halfW - gap / 2, frameCy, 'frame-gap', FRAME_GAP_FILL)

		// Рамка сразу снаружи print area (после зазора).
		addBar(pw + 2 * bw, bw, frameCx, frameCy - halfH - bw / 2, 'frame-border', borderFill)
		addBar(pw + 2 * bw, bw, frameCx, frameCy + halfH + bw / 2, 'frame-border', borderFill)
		const frameSideH = ph + 2 * bw
		addBar(bw, frameSideH, frameCx - halfW - bw / 2, frameCy, 'frame-border', borderFill)
		addBar(bw, frameSideH, frameCx + halfW + bw / 2, frameCy, 'frame-border', borderFill)
	}

	/** Рамка снаружи области печати — слоты коллажа не сжимаем при выборе çerçeve. */
	const getCollageContainerInsetPx = () => 0

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

	const resolveCollageSlotRect = (rawRect: { left: number; top: number; width: number; height: number }) => {
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
		if (inner) {
			inner.set({ scaleX: 1, scaleY: 1 })
			fitImageInSlot(inner, rect.width, rect.height, 0, 0)
		}

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
			scaleX: 1,
			scaleY: 1,
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

	const refitCollageSlotRects = (uploadCount?: number) => {
		if (!fabricCanvas || !fabricLib || !collagePhotoObjects.length) return

		const metrics = getCollageMetrics()
		if (!metrics) return

		const { allSlots, sortedSlots, mockupW, mockupH, layoutRef } = metrics
		const count = uploadCount ?? getCollageUploads().length
		const pairs = collageSlotsToLoad(sortedSlots, allSlots, count)

		for (let i = 0; i < collagePhotoObjects.length; i++) {
			const group = collagePhotoObjects[i] as import('fabric').fabric.Group
			const layoutSlot = (group as { data?: { layoutSlot?: number } }).data?.layoutSlot
			const slotDef =
				layoutSlot != null
					? (pairs.find((p) => p.slotDef.slot === layoutSlot)?.slotDef ?? sortedSlots[i])
					: (pairs[i]?.slotDef ?? sortedSlots[i])
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
			if (photoObject && !hasCollageLayout.value) fitPhotoInPrintArea()
			fabricCanvas.requestRenderAll()
			return
		}

		await drawSelectedFrame()
		if (photoObject && !hasCollageLayout.value) fitPhotoInPrintArea()
		reorderLayers()
		fabricCanvas.requestRenderAll()
	}

	const getCollageMetrics = () => {
		const layout = collageLayout.value
		if (!layout) return null
		const allSlots = layout.layout_json
		const mockupW = mockupNaturalW > 0 ? mockupNaturalW : layout.reference_width || viewportW.value
		const mockupH = mockupNaturalH > 0 ? mockupNaturalH : layout.reference_height || viewportH.value

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
		group.set({ data: { role: 'collage-photo', layoutSlot: slotDef.slot } })
		lockFabricObject(group)

		fabricCanvas.add(group)
		collagePhotoObjects.push(group)
	}

	const waitNextPaint = () =>
		new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
		})

	const markCollageGroupsDirty = () => {
		for (const obj of collagePhotoObjects) {
			obj.dirty = true
			obj.setCoords()
		}
	}

	const collagePairCount = (uploadCount: number) => {
		const metrics = getCollageMetrics()
		if (!metrics || uploadCount <= 0) return 0
		return collageSlotsToLoad(metrics.sortedSlots, metrics.allSlots, uploadCount).length
	}

	const finalizeCollageCanvas = async (uploadCount?: number) => {
		if (!fabricCanvas || !collagePhotoObjects.length) return
		const count = uploadCount ?? getCollageUploads().length
		refitCollageSlotRects(count)
		markCollageGroupsDirty()
		await updateFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
		await waitNextPaint()
		refitCollageSlotRects(count)
		markCollageGroupsDirty()
		reorderLayers()
		fabricCanvas.requestRenderAll()
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

	const getCollageSourceStats = () => {
		if (isCanvasPaintingGallery.value) {
			const artwork = getGalleryArtworkUrl()
			const layoutSlots = collageLayout.value?.layout_json.length ?? 0
			const hasArt = Boolean(artwork)
			return {
				innerImagesTotal: 0,
				innerImagesWithUrl: 0,
				sessionUploads: hasArt ? 1 : 0,
				layoutSlots,
				expected: Math.max(hasArt ? 1 : 0, layoutSlots > 0 ? layoutSlots : 0)
			}
		}

		const p = options.product?.value
		const innerRaw = p?.inner_images ?? []
		const innerWithUrl = innerRaw
			.map((img) => getProductImageUrl(img))
			.filter((u) => u.length > 0)
		const sessionUploads = getCollageUploads()
		const layoutSlots = collageLayout.value?.layout_json.length ?? 0
		return {
			innerImagesTotal: innerRaw.length,
			innerImagesWithUrl: innerWithUrl.length,
			sessionUploads: sessionUploads.length,
			layoutSlots,
			expected: Math.max(innerWithUrl.length, sessionUploads.length, layoutSlots > 0 ? layoutSlots : 0)
		}
	}

	const expectedCollageUploadCount = () => getCollageSourceStats().expected

	const getCollageUploads = (): TempDesignImage[] => {
		if (isCanvasPaintingGallery.value) {
			const url = getGalleryArtworkUrl()
			if (!url) return []
			return [{ url, id: 1, session_id: 'canvas-artwork' }]
		}
		return uploadImages.value.filter((u) => u?.url?.trim())
	}

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
		let loaded = 0
		let failed = 0

		for (const { slotDef, uploadIndex } of pairs) {
			if (!fabricCanvas) break

			const upload = uploads[uploadIndex]
			if (!upload?.url || !slotDef) continue

			const ok = await loadOneCollageSlot(upload, slotDef, allSlots, mockupW, mockupH, layoutRef)
			if (ok) loaded++
			else failed++
		}

		return { pairsToLoad: pairs.length, loaded, failed }
	}

	const syncCollageSlots = async (opts?: { manageLoading?: boolean }): Promise<void> => {
		if (!fabricCanvas || !fabricLib || !printAreaRect || !collageLayout.value) return

		const manageLoading = opts?.manageLoading !== false
		if (manageLoading) beginCanvasLoading()
		try {
			if (collageSyncInFlight) {
				await collageSyncInFlight
				await finalizeCollageCanvas()
				return
			}

			const run = async () => {
				if (!isMockupDimensionsReady() && productBackgroundUrl.value) {
					await applyViewportBackground()
				}
				await ensureMockupReady()
				if (!fabricCanvas || !fabricLib || !printAreaRect || !collageLayout.value) return

				const source = getCollageSourceStats()
				const expected = source.expected
				const uploads = await waitForCollageUploadsReady(expected)
				if (!uploads.length) return

				const metrics = getCollageMetrics()
				if (!metrics) return

				removeSinglePhoto()
				removeCollagePhotos()

				const pairs = collageSlotsToLoad(metrics.sortedSlots, metrics.allSlots, uploads.length)
				const expectedLoaded = pairs.length
				let pass = 0
				while (pass < 10 && fabricCanvas) {
					if (pass > 0) {
						removeCollagePhotos()
						await new Promise<void>((r) => setTimeout(r, 200))
					}
					await loadCollageSlotImages(uploads, metrics)
					if (collagePhotoObjects.length >= expectedLoaded) break
					pass++
				}

				if (!fabricCanvas) return
				await finalizeCollageCanvas(uploads.length)
				emitDesign()
				if (canvasReady) syncCanvasDerivedPreviews()
			}

			collageSyncInFlight = run()
			await collageSyncInFlight
		} finally {
			collageSyncInFlight = null
			if (manageLoading) endCanvasLoading()
		}
	}

	const syncPhotos = async (opts?: { syncCollage?: boolean; manageLoading?: boolean }) => {
		if (!fabricCanvas || !fabricLib || !printAreaRect) return

		const shouldSyncCollage = opts?.syncCollage !== false
		const manageLoading = opts?.manageLoading !== false

		if (manageLoading) beginCanvasLoading()
		try {
			if (printAreaRect) {
				printAreaRect.set({ fill: resolvePrintAreaFill() })
			}

			if (hasCollageLayout.value) {
				if (shouldSyncCollage) await syncCollageSlots({ manageLoading: false })
				return
			}

			removeCollagePhotos()
			const artworkUrl = isCanvasPaintingGallery.value ? getGalleryArtworkUrl() : null
			const list = artworkUrl
				? [{ url: artworkUrl, id: 1, session_id: 'canvas-artwork' as const }]
				: uploadImages.value
			if (list.length > 0) {
				if (photoObject) {
					await refitSinglePhoto()
				} else {
					const idx = isCanvasPaintingGallery.value
						? 0
						: Math.min(designStore.activeImageIndex, list.length - 1)
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
			if (manageLoading) endCanvasLoading()
			scheduleCanvasPreview()
		}
	}

	const syncPrintArea = async (opts?: {
		preferSize?: boolean
		syncCollage?: boolean
		manageLoading?: boolean
	}) => {
		if (!fabricCanvas || !fabricLib || !selectedFormat.value) return

		const manageLoading = opts?.manageLoading !== false
		if (manageLoading) beginCanvasLoading()
		try {
		const { width, height } = getPrintDimensions({ preferSize: opts?.preferSize })

		if (!printAreaRect) {
			printAreaRect = new fabricLib.Rect({
				width,
				height,
				left: cx(),
				top: cy(),
				originX: 'center',
				originY: 'center',
				fill: resolvePrintAreaFill(),
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

		await syncPhotos({
			syncCollage: opts?.syncCollage ?? !hasCollageLayout.value,
			manageLoading: false
		})
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
				await syncCollageSlots({ manageLoading: false })
			}
		}
		} finally {
			if (manageLoading) endCanvasLoading()
		}
	}

	const setPhotoFromUrl = async (url: string, meta?: TempDesignImage | null, opts?: { skipBackground?: boolean }) => {
		if (!fabricCanvas || !fabricLib) return
		const manageLoading = !opts?.skipBackground
		if (manageLoading) beginCanvasLoading()
		try {
			if (!opts?.skipBackground && printAreaRect) {
				printAreaRect.set({ fill: resolvePrintAreaFill() })
			}

			const el = await loadHtmlImage(url)
			if (photoObject) {
				fabricCanvas.remove(photoObject)
				photoObject = null
			}
			const center = getPrintAreaCenter()
			const img = new fabricLib.Image(el, {
				originX: 'center',
				originY: 'center',
				left: center.left,
				top: center.top,
				objectCaching: false
			})
			lockPhotoInteractions(img)
			fabricCanvas.add(img)
			photoObject = img
			fabricCanvas.discardActiveObject()
			fitPhotoInPrintArea()
			await updateFrame()
			reorderLayers()
			fabricCanvas.requestRenderAll()
			emitDesign()
			scheduleCanvasPreview()
		} finally {
			if (manageLoading) endCanvasLoading()
		}
	}

	const selectProductBackground = async (index: number) => {
		const count = productBackgroundThumbs.value.length
		if (index < 0 || index >= count) return
		if (activeProductImageIndex.value === index) return

		if (isCanvasPaintingGallery.value) {
			activeProductImageIndex.value = index
			if (!fabricCanvas || !canvasReady) return
			const item = productBackgroundThumbs.value[index]
			if (!item?.url) return
			await setPhotoFromUrl(item.url, item, { skipBackground: true })
			return
		}

		await runWithCanvasLoading(async () => {
			activeProductImageIndex.value = index
			ensureMockupSceneColors(index)
			if (!fabricCanvas || !canvasReady) return

			await applyViewportBackground()
			if (hasCollageLayout.value) {
				await syncCollageSlots({ manageLoading: false })
			} else {
				await syncPhotos({ manageLoading: false })
			}
			if (!fabricCanvas) return
			reorderLayers()
			fabricCanvas.requestRenderAll()
			scheduleCanvasPreview()
			await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
		})
	}

	const setMockupSceneColor = async (settingIndex: number, color: string) => {
		const thumbIndex = activeProductImageIndex.value
		const scene = productBackgroundThumbs.value[thumbIndex]?.mockupScene
		if (!scene?.settings.length || settingIndex < 0 || settingIndex >= scene.settings.length) return

		ensureMockupSceneColors(thumbIndex)
		const next = [...(mockupSceneColors.value[thumbIndex] ?? getInitialSceneColors(scene))]
		next[settingIndex] = color
		mockupSceneColors.value = { ...mockupSceneColors.value, [thumbIndex]: next }

		await runWithCanvasLoading(async () => {
			if (!fabricCanvas || !canvasReady) return
			await applyViewportBackground()
			if (hasCollageLayout.value) {
				await syncCollageSlots({ manageLoading: false })
			} else {
				await syncPhotos({ manageLoading: false })
			}
			if (!fabricCanvas) return
			reorderLayers()
			fabricCanvas.requestRenderAll()
			scheduleCanvasPreview()
			await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
		})
	}

	const selectUploadImage = async (index: number) => {
		const list = uploadImages.value
		if (index < 0 || index >= list.length) return
		await runWithCanvasLoading(async () => {
			designStore.setActiveImageIndex(index)
			await syncPhotos({ manageLoading: false })
		})
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
		await runWithCanvasLoading(async () => {
			suppressFormatPreviewWatch = true
			try {
				selectedFormat.value = format
				selectedSize.value = getDefaultSize(format)
				if (!fabricCanvas || !canvasReady) {
					await tryInitOrSyncFormats()
					return
				}
				await syncPrintArea({ manageLoading: false })
				await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
			} finally {
				suppressFormatPreviewWatch = false
			}
		})
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
		if (!s) return
		await runWithCanvasLoading(async () => {
			suppressFormatPreviewWatch = true
			try {
				selectedSize.value = s
				await syncPrintArea({ preferSize: true, manageLoading: false })
				emitDesign()
				await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
			} finally {
				suppressFormatPreviewWatch = false
			}
		})
	}

	const applyFrame = async (frame: FrameOption) => {
		selectedFrame.value = frame
		if (!fabricCanvas || !canvasReady) {
			emitDesign()
			return
		}

		if (hasCollageLayout.value && !collagePhotoObjects.length) {
			await syncCollageSlots({ manageLoading: false })
		} else {
			await updateFrame()
			reorderLayers()
			fabricCanvas.requestRenderAll()
		}
		emitDesign()
		scheduleCanvasPreview({ productThumbsActiveOnly: true })
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
		productThumbCollageByIndex.value = {}
		productThumbPreviewSyncId++
		framePreviewSyncId++
		if (productThumbPreviewTimer) {
			clearTimeout(productThumbPreviewTimer)
			productThumbPreviewTimer = null
		}
		canvasPreviewSrc.value = ''
		canvasLoadingDepth = 0
		isLoadingImage.value = false
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
					const slotTarget = collagePairCount(uploads.length)
					if (!slotTarget || collagePhotoObjects.length >= slotTarget) break
					await new Promise<void>((r) => setTimeout(r, 120))
					attempts++
				}

				if (collagePhotoObjects.length) {
					await applyFrame(FRAME_NONE_OPTION)
				}
			}
			if (!isActiveCanvasInit(initId)) return

			canvasReady = true
			if (formatPresets.value.length > 1) {
				await refreshLayoutDerivedPreviews({
					refreshAllFormatPreviews: true,
					refreshLeftThumbs: false
				})
			} else {
				syncCanvasDerivedPreviews()
				scheduleCanvasPreview()
			}
			scheduleProductThumbPreviews()
		} finally {
			if (showCollageLoader) {
				isCanvasInitializing.value = false
				if (!canvasReady) isLoadingImage.value = false
			}
		}
	}

	const canInitEditor = () => {
		if (!import.meta.client || !options.wrapRef.value) return false
		if (isCanvasPaintingGallery.value) return Boolean(canvasPaintingArtworkUrl.value)
		return formatPresets.value.length > 0 && designStore.hasSessionFor(options.productId.value)
	}

	const tryInitOrSyncFormats = async () => {
		if (!canInitEditor()) return

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
		() => [options.product?.value?.id, canvasPaintingArtworkUrl.value, options.wrapRef.value] as const,
		() => {
			if (!isCanvasPaintingGallery.value) return
			void tryInitOrSyncFormats()
		},
		{ flush: 'post' }
	)

	watch(
		() => uploadImages.value.length,
		(len) => {
			if (len === 0) {
				productThumbCollageByIndex.value = {}
				return
			}
			if (!fabricCanvas || !canvasReady) {
				void tryInitOrSyncFormats()
				return
			}
			if (hasCollageLayout.value) {
				const uploads = getCollageUploads()
				const slotTarget = collagePairCount(uploads.length)
				if (slotTarget > 0 && collagePhotoObjects.length < slotTarget) {
					void syncCollageSlots()
				}
				scheduleProductThumbPreviews()
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
			mockupSceneColors.value = {}
		}
	)

	watch(
		() => [selectedFormat.value?.id, selectedSize.value?.id, selectedFrame.value?.id] as const,
		async () => {
			if (!isMockupSceneActive.value || !fabricCanvas || !canvasReady) return
			await runWithCanvasLoading(async () => {
				await applyViewportBackground()
				if (hasCollageLayout.value) {
					await syncCollageSlots({ manageLoading: false })
				} else {
					await syncPhotos({ manageLoading: false })
				}
				reorderLayers()
				fabricCanvas?.requestRenderAll()
				scheduleCanvasPreview()
				await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
			})
		}
	)

	watch(
		() => productBackgroundThumbs.value.length,
		(len) => {
			if (len > 0 && activeProductImageIndex.value >= len) {
				activeProductImageIndex.value = 0
			}
			scheduleProductThumbPreviews()
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

	onMounted(() => {
		nextTick(() => void tryInitOrSyncFormats())
	})

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
		getProductThumbBackgroundSrc,
		getProductThumbCollageSrc,
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
		isFrameActive: (id: string) => selectedFrame.value?.id === id,
		isMockupSceneActive,
		activeMockupSceneSettings,
		setMockupSceneColor,
		isCanvasPaintingGallery,
		useStaticFormatPreviews
	}
}
