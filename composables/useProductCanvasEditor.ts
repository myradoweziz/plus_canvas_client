import { useFabricImageLoader } from '~/composables/useFabricImageLoader'
import {
	centerRectsIntersect,
	clampCenterRectToFrameInner,
	collageSlotsBoundsInPrintArea,
	collageSlotsBoundsOnMockup,
	collageSlotsToLoad,
	extractCollageLayoutFromProduct,
	extractProductImageUrls,
	getProductCollageImages,
	getProductImageUrl,
	getProductMockupImages,
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
import { loadFormatPanelLayout, type FormatPanelLayout } from '~/utils/formatSvgLayout'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'
import {
	CANVAS_FRAME_GAP_PX,
	CANVAS_FRAME_OUTER_PX,
	formatAspect,
	formatOrientationAspect,
	formatPanelCount,
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
import type { EffectOption, Product, ProductDesignPayload, TempDesignImage } from '~/utils/types'

const DEFAULT_VIEWPORT_W = 560
const DEFAULT_VIEWPORT_H = 520
/** Область печати на холсте — чуть меньше viewport, чтобы дизайн не прилипал к краям. */
const PRINT_AREA_VIEWPORT_RATIO = 0.85
/** Цвет «загиба» между холстом и рамкой (как PlusCanvas). */
const FRAME_GAP_FILL = '#E8E4DC'

export function useProductCanvasEditor(options: {
	productId: Ref<string>
	wrapRef: Ref<HTMLElement | null>
	canvasFormats: Ref<CanvasFormat[]>
	canvasFrames?: Ref<FrameOption[]>
	product?: Ref<Product | null | undefined>
	onDesignUpdate?: (payload: ProductDesignPayload) => void
	/** Редактор загрузки: один mockup из product.image[0] */
	useFirstProductImageOnly?: boolean
	/** Серый mockup (CANVAS_PAINTING_STATIC_BG), без product.image на фоне и в миниатюрах */
	useStaticMockupBackground?: boolean
}) {
	const designStore = useProductDesignStore()
	const { loadHtmlImage } = useFabricImageLoader()
	const useStaticMockupBackground = computed(() => options.useStaticMockupBackground === true)

	const formatPresets = computed(() => {
		const fromApi = options.canvasFormats.value
		if (fromApi.length) return fromApi
		if (isCanvasPaintingGallery.value) return [getCanvasPaintingDefaultFormat()]
		// Продукт без canvas_formats (например, только collage_layout) —
		// дефолтный формат, иначе canvas не инициализируется. В UI его не показываем.
		if (options.product?.value) return [{ ...getCanvasPaintingDefaultFormat(), synthetic: true }]
		return []
	})

	/** Форматы для UI (полоса/сайдбар) — без технического fallback. */
	const displayFormatPresets = computed(() => formatPresets.value.filter((f) => !f.synthetic))
	const frameOptions = computed(() => withNoFrameOption(options.canvasFrames?.value ?? []))
	const collageLayout = computed(() => extractCollageLayoutFromProduct(options.product?.value))
	const isCanvasPaintingGallery = computed(() => isCanvasPaintingGalleryProduct(options.product?.value))
	const useStaticFormatPreviews = computed(() => isCanvasPaintingGallery.value)
	const canvasPaintingArtworkUrl = computed(() => getCanvasPaintingArtworkUrl(options.product?.value))
	const activeProductImageIndex = ref(0)
	/** Цвета sceneSettings по индексу mockup в product.image */
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
		// Дефолт — active_canvas_format_id продукта; выбор пользователя не перетираем.
		const activeId = Number(options.product?.value?.active_canvas_format_id)
		const productDefault = Number.isFinite(activeId)
			? formats.find((f) => Number(f.id) === activeId)
			: undefined
		const format =
			current && formats.some((f) => f.id === current.id) ? current : (productDefault ?? formats[0])
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
	const activeEffectId = ref<number | null>(null)
	const activeEffectOpacity = ref(100)

	type CropTransform = {
		left: number
		top: number
		scaleX: number
		scaleY: number
		angle: number
	}

	type CropTarget = {
		kind: 'single' | 'collage'
		image: import('fabric').fabric.Image
		group?: import('fabric').fabric.Group
	}

	const isCropModeActive = ref(false)
	const cropSizeLabel = ref('—')
	const cropPositionLabel = ref('X:0 Y:0')
	const cropStateByUploadIndex = new Map<number, CropTransform>()
	let cropHistory: CropTransform[] = []
	let cropHistoryIndex = -1
	let cropModifiedHandler: ((e: import('fabric').fabric.IEvent) => void) | null = null
	let cropSelectionHandler: ((e: import('fabric').fabric.IEvent) => void) | null = null
	const CROP_ZOOM_FACTOR = 1.12

	const uploadImages = computed(() => designStore.getSessionImages(options.productId.value))

	const innerThumbImages = computed((): TempDesignImage[] =>
		uploadImages.value.filter((u) => String(u?.url ?? '').trim().length > 0)
	)

	const limitProductBackgroundThumbs = (items: TempDesignImage[]) => {
		if (!options.useFirstProductImageOnly || items.length <= 1) return items
		return items.slice(0, 1)
	}

	/** Слева — product.image (mockup / background). */
	const productBackgroundThumbs = computed((): TempDesignImage[] => {
		if (useStaticMockupBackground.value) return []

		const p = options.product?.value
		if (!p) return []

		if (isCanvasPaintingGallery.value) {
			return limitProductBackgroundThumbs(getCanvasPaintingThumbImages(p))
		}

		const fromImages = getProductMockupImages(p)
			.map((img, idx) => ({
				url: getProductImageUrl(img),
				id: idx + 1,
				session_id: 'product-image',
				mockupScene: parseMockupSceneFromImage(img)
			}))
			.filter((item) => item.url.length > 0)

		if (fromImages.length) return limitProductBackgroundThumbs(fromImages)

		return limitProductBackgroundThumbs(
			extractProductImageUrls(p).map((url, idx) => ({
				url,
				id: idx + 1,
				session_id: 'product-image'
			}))
		)
	})

	/** Миниатюры слева: mockup из product.image; personalized — uploads из сессии. */
	const thumbImages = computed((): TempDesignImage[] => {
		const bg = productBackgroundThumbs.value
		if (bg.length || isCanvasPaintingGallery.value) return bg
		return innerThumbImages.value
	})

	const thumbsAreProductImages = computed(() => productBackgroundThumbs.value.length > 0)

	/** Коллаж на product.image mockup — слоты по layout на стене, не в центре print area. */
	const shouldPlaceCollageOnMockup = computed(
		() =>
			!useStaticMockupBackground.value &&
			!isCanvasPaintingGallery.value &&
			thumbsAreProductImages.value &&
			Boolean(productBackgroundUrl.value) &&
			hasCollageLayout.value
	)

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
		if (useStaticMockupBackground.value) return false
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

	/** Тот же URL mockup, что и в левом слайдере (product.image). */
	const productBackgroundUrl = computed(() => {
		if (isCanvasPaintingGallery.value || useStaticMockupBackground.value) {
			return CANVAS_PAINTING_STATIC_BG
		}
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
	/** Только коллаж/фото + рамка (без mockup) — слой поверх фона в полосе форматов. */
	const canvasDesignPreviewSrc = ref('')
	const formatPreviewById = ref<Record<number, string>>({})
	const formatDesignPreviewById = ref<Record<number, string>>({})
	const thumbPreviewByIndex = ref<Record<number, string>>({})
	/** Слева: коллаж-слой (прозрачный PNG поверх mockup в слайде). */
	const productThumbCollageByIndex = ref<Record<number, string>>({})
	let productThumbPreviewSyncId = 0
	let productThumbPreviewTimer: ReturnType<typeof setTimeout> | null = null
	let framePreviewSyncId = 0
	let suppressFormatPreviewWatch = false
	/** Boyut выбран вручную в сайдбаре — иначе ориентация формата (Dikey/Kare/Yatay). */
	const sizeChosenByUser = ref(false)

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
						multiplier: 0.9
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
					multiplier: 0.9
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
		const designSnap = captureFormatDesignOverlay()
		if (designSnap) {
			canvasDesignPreviewSrc.value = designSnap
			const id = selectedFormat.value?.id
			if (id != null) {
				formatDesignPreviewById.value = {
					...formatDesignPreviewById.value,
					[Number(id)]: designSnap
				}
			}
		}
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

	/** Реактивные превью миниатюр (Fabric-снимок слота / коллаж mockup). */
	const thumbOverlayByIndex = computed((): Record<number, string> => {
		const out: Record<number, string> = {}
		const count = thumbImages.value.length
		for (let i = 0; i < count; i++) {
			const collageOverlay = productThumbCollageByIndex.value[i]?.trim()
			if (collageOverlay) {
				out[i] = collageOverlay
				continue
			}
			const fromCanvas = thumbPreviewByIndex.value[i]?.trim()
			if (fromCanvas) {
				out[i] = fromCanvas
				continue
			}
			if (thumbsAreProductImages.value) {
				const bg = getProductThumbBackgroundSrc(i)
				if (bg) out[i] = bg
				continue
			}
			const url = innerThumbImages.value[i]?.url
			if (url) out[i] = previewUrl(url)
		}
		return out
	})

	let canvasPreviewSyncId = 0

	const scheduleCanvasPreview = (opts?: { productThumbsActiveOnly?: boolean }) => {
		if (!import.meta.client || !isCanvasAlive()) return
		const syncId = ++canvasPreviewSyncId
		nextTick(() => {
			requestAnimationFrame(() => {
				if (syncId !== canvasPreviewSyncId) return
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

	/** Скрыть холст на время off-screen снимков — без «увеличился/уменьшился» в UI. */
	const withCanvasCaptureHidden = async <T>(fn: () => Promise<T>): Promise<T> => {
		const container = options.wrapRef.value?.querySelector('.canvas-container') as HTMLElement | null
		if (container) container.style.visibility = 'hidden'
		try {
			return await fn()
		} finally {
			if (container) container.style.visibility = ''
			fabricCanvas?.requestRenderAll()
		}
	}

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

	/** Галерея: активная миниатюра product.image, не только [0]. */
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

	/** Зазор между панелями для fallback-сплита (когда SVG формата не распарсился). */
	const PANEL_GAP_PX = 14

	const getPanelGapPx = () => (hasActiveFrame() ? 2 * CANVAS_FRAME_OUTER_PX + 10 : PANEL_GAP_PX)

	/** Раскладка панелей из SVG формата (image_url) — источник правды для «parçalı». */
	const panelLayoutByFormatId = new Map<number, FormatPanelLayout | null>()

	const ensureFormatPanelLayout = async (
		format: CanvasFormat | null | undefined
	): Promise<FormatPanelLayout | null> => {
		if (!format || !import.meta.client) return null
		const id = Number(format.id)
		if (panelLayoutByFormatId.has(id)) return panelLayoutByFormatId.get(id) ?? null
		const url = format.image_url?.trim()
		const layout = url ? await loadFormatPanelLayout(mediaUrlForCanvas(url)) : null
		panelLayoutByFormatId.set(id, layout)
		return layout
	}

	/** Во время прохода превью форматов — панели снимаемого формата, не выбранного. */
	let panelFormatOverride: CanvasFormat | null = null

	const getActivePanelFormat = () => panelFormatOverride ?? selectedFormat.value

	const getActivePanelLayout = (): FormatPanelLayout | null => {
		const format = getActivePanelFormat()
		if (!format) return null
		const layout = panelLayoutByFormatId.get(Number(format.id)) ?? null
		return layout && layout.panels.length > 1 ? layout : null
	}

	const getActivePanelCount = () =>
		getActivePanelLayout()?.panels.length ?? formatPanelCount(getActivePanelFormat())

	const getPanelRects = (
		faceW: number,
		faceH: number,
		centerLeft: number,
		centerTop: number
	): { left: number; top: number; width: number; height: number }[] => {
		const layout = getActivePanelLayout()
		if (layout) {
			const originLeft = centerLeft - faceW / 2
			const originTop = centerTop - faceH / 2
			return layout.panels.map((p) => ({
				left: originLeft + p.left * faceW,
				top: originTop + p.top * faceH,
				width: Math.max(1, p.width * faceW),
				height: Math.max(1, p.height * faceH)
			}))
		}

		// SVG не распарсился — равномерный вертикальный сплит по числу панелей из имени.
		const panels = getActivePanelCount()
		const gap = getPanelGapPx()
		const panelW = Math.max(1, (faceW - gap * (panels - 1)) / panels)
		const rects: { left: number; top: number; width: number; height: number }[] = []
		for (let i = 0; i < panels; i++) {
			rects.push({
				left: centerLeft - faceW / 2 + i * (panelW + gap) + panelW / 2,
				top: centerTop,
				width: panelW,
				height: faceH
			})
		}
		return rects
	}

	/** Clip «лица» холста: один Rect или группа панелей для «N parçalı». */
	const buildPanelClipPath = (
		faceW: number,
		faceH: number,
		center: { left: number; top: number }
	): import('fabric').fabric.Object | undefined => {
		if (!fabricLib) return undefined
		const panels = getActivePanelCount()
		if (panels <= 1) {
			return new fabricLib.Rect({
				width: faceW,
				height: faceH,
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center',
				absolutePositioned: true
			})
		}
		const rects = getPanelRects(faceW, faceH, center.left, center.top).map(
			(r) =>
				new fabricLib!.Rect({
					width: r.width,
					height: r.height,
					left: r.left,
					top: r.top,
					originX: 'center',
					originY: 'center'
				})
		)
		return new fabricLib.Group(rects, { absolutePositioned: true })
	}

	/** Белая подложка области печати тоже режется на панели. */
	const updatePrintAreaPanelClip = () => {
		if (!printAreaRect || !fabricLib) return
		if (getActivePanelCount() <= 1) {
			printAreaRect.clipPath = undefined
		} else {
			const pw = printAreaRect.width ?? 1
			const ph = printAreaRect.height ?? 1
			printAreaRect.clipPath = buildPanelClipPath(pw, ph, getPrintAreaCenter())
		}
		printAreaRect.dirty = true
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
		photoObject.clipPath = buildPanelClipPath(width, height, getPrintAreaCenter())
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

	const getPrintDimensionsForFormat = (
		format: CanvasFormat,
		size: PrintSizeOption | null,
		opts?: { preferSize?: boolean }
	) => {
		const maxW = viewportW.value * PRINT_AREA_VIEWPORT_RATIO
		const maxH = viewportH.value * PRINT_AREA_VIEWPORT_RATIO

		// Многопанельный формат: пропорция холста — из SVG с API, не из имени/размера.
		const svgLayout = panelLayoutByFormatId.get(Number(format.id))
		const svgAspect = svgLayout && svgLayout.panels.length > 1 ? svgLayout.aspect : null

		const aspect =
			svgAspect ??
			(opts?.preferSize && size && size.height > 0
				? formatAspect(format, size)
				: formatOrientationAspect(format))

		return printBoxInViewport(aspect, maxW, maxH)
	}

	/** Ориентация области печати: по формату (Dikey/Kare/Yatay); Boyut — только при preferSize. */
	const getPrintDimensions = (opts?: { preferSize?: boolean }) => {
		const format = selectedFormat.value
		if (!format) {
			return printBoxInViewport(
				1,
				viewportW.value * PRINT_AREA_VIEWPORT_RATIO,
				viewportH.value * PRINT_AREA_VIEWPORT_RATIO
			)
		}
		return getPrintDimensionsForFormat(format, selectedSize.value, opts)
	}

	/** Refit под формат для снимка превью — без смены selectedFormat (нет мигания UI). */
	const applyFormatPreviewLayout = async (format: CanvasFormat, size: PrintSizeOption | null) => {
		if (!fabricCanvas) return
		await ensureFormatPanelLayout(format)
		panelFormatOverride = format
		try {
			const { width, height } = getPrintDimensionsForFormat(format, size)
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
			updatePrintAreaPanelClip()
			if (hasCollageLayout.value && collagePhotoObjects.length) {
				refitCollageSlotRects()
			} else if (photoObject) {
				fitPhotoInPrintArea()
			}
			await updateFrame({ render: false })
			reorderLayers()
		} finally {
			panelFormatOverride = null
		}
	}

	const layoutRefForCollage = (allSlots: CollageLayoutSlot[]) => {
		const layout = collageLayout.value
		return resolveLayoutRefBounds(allSlots, {
			width: layout?.reference_width,
			height: layout?.reference_height
		})
	}

	/** Позиция слота: на mockup (product.image) или в области печати (загрузка без фона). */
	const rawSlotRectForCollage = (
		slotDef: CollageLayoutSlot,
		allSlots: CollageLayoutSlot[],
		layoutRef?: { width?: number; height?: number },
		mockupW?: number,
		mockupH?: number
	) => {
		const layout = collageLayout.value
		const mW = mockupW ?? (mockupNaturalW > 0 ? mockupNaturalW : layout?.reference_width || viewportW.value)
		const mH = mockupH ?? (mockupNaturalH > 0 ? mockupNaturalH : layout?.reference_height || viewportH.value)

		if (shouldPlaceCollageOnMockup.value) {
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

		if (printAreaRect) {
			const pw = printAreaRect.width ?? 1
			const ph = printAreaRect.height ?? 1
			return slotRectInPrintArea(slotDef, allSlots, pw, ph, cx(), cy(), layoutRef)
		}

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

	const readCropTransform = (img: import('fabric').fabric.Image): CropTransform => ({
		left: img.left ?? 0,
		top: img.top ?? 0,
		scaleX: img.scaleX ?? 1,
		scaleY: img.scaleY ?? 1,
		angle: img.angle ?? 0
	})

	const applyCropTransform = (img: import('fabric').fabric.Image, transform: CropTransform) => {
		img.set({
			left: transform.left,
			top: transform.top,
			scaleX: transform.scaleX,
			scaleY: transform.scaleY,
			angle: transform.angle
		})
		img.setCoords()
	}

	const readInnerCrop = (inner: import('fabric').fabric.Image | undefined): CropTransform | null => {
		if (!inner) return null
		const saved = (inner as { data?: { crop?: CropTransform } }).data?.crop
		return saved ?? null
	}

	const persistCropTransform = (target: CropTarget, uploadIndex = activeImageIndex.value) => {
		const transform = readCropTransform(target.image)
		cropStateByUploadIndex.set(uploadIndex, transform)
		target.image.set({
			data: { ...((target.image as { data?: Record<string, unknown> }).data ?? {}), crop: transform }
		})
	}

	/** Фото по центру области печати, cover (заполняет «лицо» холста). */
	const fitPhotoInPrintArea = () => {
		if (!photoObject || !printAreaRect) return
		const saved = cropStateByUploadIndex.get(activeImageIndex.value)
		if (saved) {
			applyCropTransform(photoObject, saved)
			updatePhotoClipPath()
			fabricCanvas?.requestRenderAll()
			return
		}
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
			originY: 'center',
			angle: 0
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

	/** Фон canvas — изображение товара (product.image), без паттерна PlusCanvas. */
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

	const isFormatDesignOverlayObject = (obj: import('fabric').fabric.Object) => {
		if (isThumbOverlayObject(obj)) return true
		if (obj === photoObject) return true
		return false
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

	const captureDesignOverlay = (
		exportBounds: { left: number; top: number; width: number; height: number },
		isOverlayObject: (obj: import('fabric').fabric.Object) => boolean,
		multiplier = 0.38
	): string | null => {
		if (!fabricCanvas) return null

		const { left, top, width, height } = exportBounds
		const toggled: { obj: import('fabric').fabric.Object; visible: boolean }[] = []
		for (const obj of fabricCanvas.getObjects()) {
			if (!isOverlayObject(obj)) {
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
				multiplier,
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

	/** PNG коллажа + рамка (без mockup) — слой поверх фона в левом слайдере. */
	const captureProductThumbCollageOverlay = (): string | null => {
		if (!fabricCanvas || !collagePhotoObjects.length) return null
		const exportBounds = getProductThumbCollageExportBounds()
		if (!exportBounds) return null
		return captureDesignOverlay(exportBounds, isThumbOverlayObject)
	}

	/** PNG дизайна (коллаж/фото + рамка) без mockup — полоса форматов. */
	const captureFormatDesignOverlay = (): string | null => {
		if (!fabricCanvas) return null
		if (!collagePhotoObjects.length && !photoObject) return null
		const exportBounds = getProductThumbCollageExportBounds()
		if (!exportBounds) return null
		return captureDesignOverlay(exportBounds, isFormatDesignOverlayObject, 0.42)
	}

	const refreshActiveProductThumbCollage = () => {
		if (!isCanvasAlive() || !thumbsAreProductImages.value || !hasCollageLayout.value) return
		if (!getCollageUploads().length) return
		if (isCanvasInitializing.value) return
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
		const { width, height } = getPrintDimensions({ preferSize: sizeChosenByUser.value })
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
		updatePrintAreaPanelClip()
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

		await withCanvasCaptureHidden(async () => {
			try {
				for (let i = 0; i < count; i++) {
					if (syncId !== productThumbPreviewSyncId) break
					activeProductImageIndex.value = i
					await applyViewportBackground()
					refitCollageSlotRects()
					await updateFrame({ render: false })
					reorderLayers()
					fabricCanvas!.requestRenderAll()
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
		})
	}

	/** Превью всех форматов в полосе (только refit, без перезагрузки фото). */
	const refreshAllFormatPreviewsLight = async (syncId: number) => {
		if (!fabricCanvas || !canvasReady || !formatPresets.value.length) return

		const next = { ...formatPreviewById.value }
		const nextDesign = { ...formatDesignPreviewById.value }

		suppressFormatPreviewWatch = true
		try {
			await withCanvasCaptureHidden(async () => {
				for (const format of formatPresets.value) {
					if (syncId !== framePreviewSyncId) return
					await applyFormatPreviewLayout(format, getDefaultSize(format))
					fabricCanvas!.requestRenderAll()
					const snap = captureCanvasPreview()
					const designSnap = captureFormatDesignOverlay()
					if (snap) next[Number(format.id)] = snap
					if (designSnap) {
						nextDesign[Number(format.id)] = designSnap
					}
				}

				if (syncId !== framePreviewSyncId) return
				formatPreviewById.value = next
				formatDesignPreviewById.value = nextDesign
				await restoreCanvasLayoutAfterPreviewPass()
			})
		} finally {
			suppressFormatPreviewWatch = false
		}
	}

	const refreshLayoutDerivedPreviews = async (opts?: {
		refreshAllFormatPreviews?: boolean
		refreshLeftThumbs?: boolean
	}) => {
		if (!fabricCanvas || !canvasReady) return
		canvasPreviewSyncId++
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

		if (printAreaRect && !shouldPlaceCollageOnMockup.value) {
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
			if (printAreaRect && !shouldPlaceCollageOnMockup.value) {
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

	/** Рамка снаружи области печати; фото вплотную к рамке (без белой полосы). */
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

		const drawFrameBars = (b: { left: number; top: number; width: number; height: number }) => {
			const w = b.width
			const h = b.height
			const cxB = b.left
			const cyB = b.top
			const halfW = w / 2
			const halfH = h / 2

			if (gap > 0) {
				addBar(w, gap, cxB, cyB - halfH + gap / 2, 'frame-gap', FRAME_GAP_FILL)
				addBar(w, gap, cxB, cyB + halfH - gap / 2, 'frame-gap', FRAME_GAP_FILL)
				const gapSideH = Math.max(1, h - 2 * gap)
				addBar(gap, gapSideH, cxB - halfW + gap / 2, cyB, 'frame-gap', FRAME_GAP_FILL)
				addBar(gap, gapSideH, cxB + halfW - gap / 2, cyB, 'frame-gap', FRAME_GAP_FILL)
			}

			// Рамка сразу снаружи print area / панели.
			addBar(w + 2 * bw, bw, cxB, cyB - halfH - bw / 2, 'frame-border', borderFill)
			addBar(w + 2 * bw, bw, cxB, cyB + halfH + bw / 2, 'frame-border', borderFill)
			const frameSideH = h + 2 * bw
			addBar(bw, frameSideH, cxB - halfW - bw / 2, cyB, 'frame-border', borderFill)
			addBar(bw, frameSideH, cxB + halfW + bw / 2, cyB, 'frame-border', borderFill)
		}

		// «N parçalı» — отдельная рамка вокруг каждой панели.
		const panels = hasCollageLayout.value ? 1 : getActivePanelCount()
		const boundsList =
			panels > 1 ? getPanelRects(pw, ph, frameCx, frameCy) : [{ left: frameCx, top: frameCy, width: pw, height: ph }]
		for (const b of boundsList) drawFrameBars(b)
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
		const savedCrop = readInnerCrop(inner)
		if (inner && !savedCrop) {
			inner.set({ scaleX: 1, scaleY: 1, left: 0, top: 0, angle: 0 })
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
		if (inner && savedCrop) {
			applyCropTransform(inner, savedCrop)
		}
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

	const updateFrame = async (opts?: { render?: boolean }) => {
		if (!fabricCanvas || !fabricLib) return
		if (!hasCollageLayout.value && !printAreaRect) return
		removeFrame()

		const frame = selectedFrame.value
		if (!frame || isNoFrame(frame)) {
			if (photoObject && !hasCollageLayout.value) fitPhotoInPrintArea()
			if (opts?.render !== false) fabricCanvas.requestRenderAll()
			return
		}

		await drawSelectedFrame()
		if (photoObject && !hasCollageLayout.value) fitPhotoInPrintArea()
		reorderLayers()
		if (opts?.render !== false) fabricCanvas.requestRenderAll()
	}

	const getPhotoImagesForEffect = (): import('fabric').fabric.Image[] => {
		const images: import('fabric').fabric.Image[] = []
		if (photoObject) images.push(photoObject)
		for (const obj of collagePhotoObjects) {
			const group = obj as import('fabric').fabric.Group
			const inner = group.getObjects?.()?.[0]
			if (inner?.type === 'image') images.push(inner as import('fabric').fabric.Image)
		}
		return images
	}

	/** Fabric-фильтры по названию эффекта (image_url — только превью в сайдбаре). */
	const buildEffectFilters = (
		effect: EffectOption,
		opacityPercent: number
	): import('fabric').fabric.IBaseFilter[] => {
		const filtersLib = fabricLib?.Image?.filters as Record<string, new (opts?: object) => import('fabric').fabric.IBaseFilter> | undefined
		if (!filtersLib) return []

		const name = effect.name.toLowerCase()
		const strength = Math.min(1, Math.max(0, opacityPercent / 100))
		const filters: import('fabric').fabric.IBaseFilter[] = []

		if (/siyah|beyaz|grayscale|grey|gray|monokrom|monochrome/.test(name)) {
			if (filtersLib.Grayscale) filters.push(new filtersLib.Grayscale())
			return filters
		}

		if (/sepia|vintage|esk[iı]/.test(name)) {
			if (filtersLib.Sepia) filters.push(new filtersLib.Sepia())
			return filters
		}

		if (/invert|negatif|negative/.test(name)) {
			if (filtersLib.Invert) filters.push(new filtersLib.Invert())
			return filters
		}

		if (/kontrast|contrast|keskin|sharp/.test(name)) {
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: strength * 0.65 }))
		}

		if (/parlak|bright|neon|canl[ıi]|vivid/.test(name)) {
			if (filtersLib.Brightness) filters.push(new filtersLib.Brightness({ brightness: strength * 0.35 }))
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: strength * 0.45 }))
			if (filtersLib.Saturate) filters.push(new filtersLib.Saturate({ saturation: strength * 0.55 }))
		}

		if (/soluk|fade|soft|yumu[sş]ak/.test(name)) {
			if (filtersLib.Brightness) filters.push(new filtersLib.Brightness({ brightness: strength * 0.12 }))
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: -(strength * 0.25) }))
		}

		if (/so[gğ]uk|cool|mavi|blue|cold/.test(name)) {
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#60a5fa', mode: 'multiply', alpha: strength * 0.45 }))
			}
		}

		if (/s[ıi]cak|warm|sicak|turuncu|orange/.test(name)) {
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#f97316', mode: 'multiply', alpha: strength * 0.4 }))
			}
		}

		if (/pembe|pink|rose/.test(name)) {
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#f472b6', mode: 'multiply', alpha: strength * 0.4 }))
			}
		}

		if (filters.length) return filters

		if (filtersLib.Contrast) return [new filtersLib.Contrast({ contrast: strength * 0.3 })]
		return []
	}

	const clearEffectFiltersFromPhotos = () => {
		for (const img of getPhotoImagesForEffect()) {
			img.filters = []
			img.applyFilters()
			img.dirty = true
		}
		for (const group of collagePhotoObjects) {
			group.dirty = true
			group.setCoords()
		}
	}

	const applyEffectFiltersToPhotos = (effect: EffectOption) => {
		if (!fabricCanvas) return
		const filters = buildEffectFilters(effect, activeEffectOpacity.value)
		for (const img of getPhotoImagesForEffect()) {
			img.filters = filters
			img.applyFilters()
			img.dirty = true
		}
		for (const group of collagePhotoObjects) {
			group.dirty = true
			group.setCoords()
		}
		fabricCanvas.requestRenderAll()
	}

	const removeEffectFromPhotos = () => {
		clearEffectFiltersFromPhotos()
		fabricCanvas?.requestRenderAll()
		scheduleCanvasPreview()
		emitDesign()
	}

	const findActiveEffect = () =>
		(options.product?.value?.effects ?? []).find((item) => Number(item.id) === Number(activeEffectId.value))

	const applyEffectById = async (effectId: number | null, opacityPercent?: number) => {
		if (opacityPercent != null && Number.isFinite(opacityPercent)) {
			activeEffectOpacity.value = Math.min(100, Math.max(0, Math.round(opacityPercent)))
		}
		activeEffectId.value = effectId

		if (!fabricCanvas || !fabricLib || !canvasReady) return

		if (effectId == null) {
			removeEffectFromPhotos()
			return
		}

		const effect = (options.product?.value?.effects ?? []).find(
			(item) => Number(item.id) === Number(effectId)
		)
		if (!effect) return
		if (!getPhotoImagesForEffect().length) return

		clearEffectFiltersFromPhotos()
		applyEffectFiltersToPhotos(effect)
		emitDesign()
		scheduleCanvasPreview()
	}

	const setEffectOpacity = (opacityPercent: number) => {
		if (!Number.isFinite(opacityPercent)) return
		activeEffectOpacity.value = Math.min(100, Math.max(0, Math.round(opacityPercent)))
		if (activeEffectId.value == null) return

		const effect = findActiveEffect()
		if (!effect || !getPhotoImagesForEffect().length) {
			void applyEffectById(activeEffectId.value, activeEffectOpacity.value)
			return
		}

		applyEffectFiltersToPhotos(effect)
		emitDesign()
		scheduleCanvasPreview()
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
		layoutRef?: { width?: number; height?: number },
		uploadIndex?: number
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
		const savedCrop = uploadIndex != null ? cropStateByUploadIndex.get(uploadIndex) : null
		if (savedCrop) {
			applyCropTransform(img, savedCrop)
			img.set({ data: { crop: savedCrop } })
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
		if (activeEffectId.value != null) {
			await applyEffectById(activeEffectId.value, activeEffectOpacity.value)
		}
	}

	const getUploadIndexForCollageGroup = (group: import('fabric').fabric.Object): number => {
		const metrics = getCollageMetrics()
		if (!metrics) return 0
		const uploads = getCollageUploads()
		const pairs = collageSlotsToLoad(metrics.sortedSlots, metrics.allSlots, uploads.length)
		const layoutSlot = (group as { data?: { layoutSlot?: number } }).data?.layoutSlot
		const pair =
			layoutSlot != null
				? pairs.find((p) => p.slotDef.slot === layoutSlot)
				: pairs[collagePhotoObjects.indexOf(group)]
		return pair?.uploadIndex ?? 0
	}

	const findCollageGroupForUploadIndex = (uploadIndex: number) => {
		if (!collagePhotoObjects.length) return null
		const metrics = getCollageMetrics()
		if (!metrics) return collagePhotoObjects[uploadIndex] ?? collagePhotoObjects[0] ?? null

		const uploads = getCollageUploads()
		const pairs = collageSlotsToLoad(metrics.sortedSlots, metrics.allSlots, uploads.length)
		const pair = pairs.find((p) => p.uploadIndex === uploadIndex) ?? pairs[uploadIndex] ?? pairs[0]
		if (!pair) return collagePhotoObjects[0] ?? null

		const slot = pair.slotDef.slot
		return (
			collagePhotoObjects.find(
				(g) => (g as { data?: { layoutSlot?: number } }).data?.layoutSlot === slot
			) ??
			collagePhotoObjects[uploadIndex] ??
			collagePhotoObjects[0] ??
			null
		)
	}

	const getActiveCropTarget = (): CropTarget | null => {
		if (!fabricCanvas) return null

		if (hasCollageLayout.value && collagePhotoObjects.length) {
			const group = findCollageGroupForUploadIndex(activeImageIndex.value)
			if (!group || group.type !== 'group') return null
			const collageGroup = group as import('fabric').fabric.Group
			const inner = collageGroup.getObjects()[0] as import('fabric').fabric.Image | undefined
			if (!inner) return null
			return { kind: 'collage', group: collageGroup, image: inner }
		}

		if (photoObject) {
			return { kind: 'single', image: photoObject }
		}

		return null
	}

	const updateCropPanelInfo = () => {
		const target = getActiveCropTarget()
		if (!target) {
			cropSizeLabel.value = '—'
			cropPositionLabel.value = 'X:0 Y:0'
			return
		}

		if (target.kind === 'collage' && target.group) {
			const w = Math.round(target.group.width ?? 0)
			const h = Math.round(target.group.height ?? 0)
			cropSizeLabel.value = `${w} x ${h} px`
		} else {
			const { width, height } = getPhotoFaceSize()
			cropSizeLabel.value = `${Math.round(width)} x ${Math.round(height)} px`
		}

		const img = target.image
		cropPositionLabel.value = `X:${Math.round(img.left ?? 0)} Y:${Math.round(img.top ?? 0)}`
	}

	const enableCropOnImage = (img: import('fabric').fabric.Image) => {
		img.set({
			selectable: true,
			evented: true,
			lockMovementX: false,
			lockMovementY: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
			hoverCursor: 'move',
			moveCursor: 'move'
		})
	}

	const lockCollageGroup = (group: import('fabric').fabric.Group) => {
		group.set({ subTargetCheck: false, evented: false })
		lockFabricObject(group)
		const inner = group.getObjects()[0] as import('fabric').fabric.Image | undefined
		if (inner) lockFabricObject(inner)
	}

	const lockAllCropTargets = () => {
		if (photoObject) lockPhotoInteractions(photoObject)
		for (const obj of collagePhotoObjects) {
			if (obj.type === 'group') lockCollageGroup(obj as import('fabric').fabric.Group)
		}
	}

	const resetCropHistoryForActive = () => {
		const target = getActiveCropTarget()
		if (!target) {
			cropHistory = []
			cropHistoryIndex = -1
			return
		}
		const current = readCropTransform(target.image)
		cropHistory = [current]
		cropHistoryIndex = 0
	}

	const restoreCropHistoryState = () => {
		const target = getActiveCropTarget()
		if (!target || cropHistoryIndex < 0 || cropHistoryIndex >= cropHistory.length) return
		applyCropTransform(target.image, cropHistory[cropHistoryIndex])
		persistCropTransform(target)
		target.image.dirty = true
		if (target.group) {
			target.group.dirty = true
			target.group.setCoords()
		}
		fabricCanvas?.requestRenderAll()
		updateCropPanelInfo()
	}

	const pushCropHistory = () => {
		const target = getActiveCropTarget()
		if (!target) return
		const current = readCropTransform(target.image)
		const last = cropHistory[cropHistoryIndex]
		if (
			last &&
			last.left === current.left &&
			last.top === current.top &&
			last.scaleX === current.scaleX &&
			last.scaleY === current.scaleY &&
			last.angle === current.angle
		) {
			return
		}
		cropHistory = cropHistory.slice(0, cropHistoryIndex + 1)
		cropHistory.push(current)
		cropHistoryIndex = cropHistory.length - 1
	}

	const detachCropModifiedListener = () => {
		if (!fabricCanvas || !cropModifiedHandler) return
		fabricCanvas.off('object:modified', cropModifiedHandler)
		cropModifiedHandler = null
	}

	const detachCropSelectionListener = () => {
		if (!fabricCanvas || !cropSelectionHandler) return
		fabricCanvas.off('mouse:down', cropSelectionHandler)
		cropSelectionHandler = null
	}

	const attachCropSelectionListener = () => {
		if (!fabricCanvas || !hasCollageLayout.value) return
		detachCropSelectionListener()
		cropSelectionHandler = (opt) => {
			if (!isCropModeActive.value || !collagePhotoObjects.length) return
			const subTargets = (opt as { subTargets?: import('fabric').fabric.Object[] }).subTargets
			const hit = subTargets?.[0] ?? opt.target
			if (!hit) return

			for (const obj of collagePhotoObjects) {
				const group = obj as import('fabric').fabric.Group
				const inner = group.getObjects()[0]
				if (hit !== inner && hit !== group) continue

				const uploadIdx = getUploadIndexForCollageGroup(group)
				if (
					designStore.productId === options.productId.value &&
					designStore.activeImageIndex !== uploadIdx
				) {
					designStore.setActiveImageIndex(uploadIdx)
				} else if (isCropModeActive.value) {
					refreshCropModeTargets()
				}
				return
			}
		}
		fabricCanvas.on('mouse:down', cropSelectionHandler)
	}

	const attachCropModifiedListener = () => {
		if (!fabricCanvas) return
		detachCropModifiedListener()
		cropModifiedHandler = (e) => {
			if (!isCropModeActive.value) return
			const target = getActiveCropTarget()
			if (!target || e.target !== target.image) return
			pushCropHistory()
			persistCropTransform(target)
			updateCropPanelInfo()
			scheduleCanvasPreview()
		}
		fabricCanvas.on('object:modified', cropModifiedHandler)
	}

	const refreshCropModeTargets = () => {
		if (!fabricCanvas) return
		lockAllCropTargets()

		const target = getActiveCropTarget()
		if (!target) {
			updateCropPanelInfo()
			return
		}

		if (target.kind === 'collage' && target.group) {
			for (const obj of collagePhotoObjects) {
				const group = obj as import('fabric').fabric.Group
				const isActive = group === target.group
				const inner = group.getObjects()[0] as import('fabric').fabric.Image | undefined
				group.set({
					subTargetCheck: true,
					evented: true,
					selectable: false,
					hoverCursor: isActive ? 'move' : 'pointer'
				})
				if (inner) {
					if (isActive) enableCropOnImage(inner)
					else lockFabricObject(inner)
				}
			}
		} else {
			enableCropOnImage(target.image)
		}
		fabricCanvas.setActiveObject(target.image)
		target.image.setCoords()
		if (target.group) {
			target.group.dirty = true
			target.group.setCoords()
		}
		resetCropHistoryForActive()
		updateCropPanelInfo()
		fabricCanvas.requestRenderAll()
	}

	const setCropModeActive = (active: boolean) => {
		isCropModeActive.value = active
		if (!fabricCanvas || !canvasReady) return

		if (active) {
			attachCropModifiedListener()
			attachCropSelectionListener()
			refreshCropModeTargets()
			return
		}

		detachCropModifiedListener()
		detachCropSelectionListener()
		const target = getActiveCropTarget()
		if (target) persistCropTransform(target)
		lockAllCropTargets()
		fabricCanvas.discardActiveObject()
		fabricCanvas.requestRenderAll()
	}

	const applyCropZoom = (direction: 'in' | 'out') => {
		const target = getActiveCropTarget()
		if (!target) return
		const factor = direction === 'in' ? CROP_ZOOM_FACTOR : 1 / CROP_ZOOM_FACTOR
		const img = target.image
		img.set({
			scaleX: (img.scaleX ?? 1) * factor,
			scaleY: (img.scaleY ?? 1) * factor
		})
		img.setCoords()
		if (target.group) {
			target.group.dirty = true
			target.group.setCoords()
		}
		pushCropHistory()
		persistCropTransform(target)
		fabricCanvas?.requestRenderAll()
		updateCropPanelInfo()
		scheduleCanvasPreview()
	}

	const cropZoomIn = () => applyCropZoom('in')
	const cropZoomOut = () => applyCropZoom('out')

	const cropRotate = () => {
		const target = getActiveCropTarget()
		if (!target) return
		const img = target.image
		img.set({ angle: ((img.angle ?? 0) + 90) % 360 })
		img.setCoords()
		if (target.group) {
			target.group.dirty = true
			target.group.setCoords()
		}
		pushCropHistory()
		persistCropTransform(target)
		fabricCanvas?.requestRenderAll()
		updateCropPanelInfo()
		scheduleCanvasPreview()
	}

	const cropUndo = () => {
		if (cropHistoryIndex <= 0) return
		cropHistoryIndex -= 1
		restoreCropHistoryState()
		scheduleCanvasPreview()
	}

	const cropRedo = () => {
		if (cropHistoryIndex >= cropHistory.length - 1) return
		cropHistoryIndex += 1
		restoreCropHistoryState()
		scheduleCanvasPreview()
	}

	const applyCrop = () => {
		const target = getActiveCropTarget()
		if (target) persistCropTransform(target)
		emitDesign()
		scheduleCanvasPreview()
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
				productCollageTotal: 0,
				productCollageWithUrl: 0,
				sessionUploads: hasArt ? 1 : 0,
				layoutSlots,
				expected: Math.max(hasArt ? 1 : 0, layoutSlots > 0 ? layoutSlots : 0)
			}
		}

		const p = options.product?.value
		const productCollageRaw = getProductCollageImages(p)
		const productCollageWithUrl = productCollageRaw
			.map((img) => getProductImageUrl(img))
			.filter((u) => u.length > 0)
		const sessionUploads = getSessionUploads()
		const layoutSlots = collageLayout.value?.layout_json.length ?? 0
		return {
			productCollageTotal: productCollageRaw.length,
			productCollageWithUrl: productCollageWithUrl.length,
			sessionUploads: sessionUploads.length,
			layoutSlots,
			expected: Math.max(
				productCollageWithUrl.length,
				sessionUploads.length,
				layoutSlots > 0 ? layoutSlots : 0
			)
		}
	}

	const expectedCollageUploadCount = () => getCollageSourceStats().expected

	const getSessionUploads = (): TempDesignImage[] =>
		uploadImages.value.filter((u) => String(u?.url ?? '').trim().length > 0)

	const getProductCollageUploads = (): TempDesignImage[] => {
		const p = options.product?.value
		if (!p) return []
		return getProductCollageImages(p)
			.map((img, idx) => ({
				url: getProductImageUrl(img),
				id: idx + 1,
				session_id: 'product-image'
			}))
			.filter((item) => item.url.length > 0)
	}

	const getCollageUploads = (): TempDesignImage[] => {
		if (isCanvasPaintingGallery.value) {
			const url = getGalleryArtworkUrl()
			if (!url) return []
			return [{ url, id: 1, session_id: 'canvas-artwork' }]
		}
		const session = getSessionUploads()
		if (session.length) return session
		return getProductCollageUploads()
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
		layoutRef?: { width?: number; height?: number },
		uploadIndex?: number
	) => {
		const maxAttempts = 3
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				await addUploadToCollageSlot(upload, slotDef, allSlots, mockupW, mockupH, layoutRef, uploadIndex)
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

			const ok = await loadOneCollageSlot(
				upload,
				slotDef,
				allSlots,
				mockupW,
				mockupH,
				layoutRef,
				uploadIndex
			)
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
		await ensureFormatPanelLayout(selectedFormat.value)
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
		updatePrintAreaPanelClip()

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
				await ensureFormatPanelLayout(format)
				selectedFormat.value = format
				selectedSize.value = getDefaultSize(format)
				sizeChosenByUser.value = false
				if (!fabricCanvas || !canvasReady) {
					await tryInitOrSyncFormats()
					return
				}
				await syncPrintArea({ manageLoading: false })
				if (fabricCanvas && printAreaRect) {
					if (hasCollageLayout.value && collagePhotoObjects.length) {
						refitCollageSlotRects()
					} else if (photoObject) {
						fitPhotoInPrintArea()
					}
					await updateFrame()
					reorderLayers()
					fabricCanvas.requestRenderAll()
				}
				await refreshLayoutDerivedPreviews({
					refreshAllFormatPreviews: formatPresets.value.length > 1,
					refreshLeftThumbs: true
				})
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
				sizeChosenByUser.value = true
				await syncPrintArea({ preferSize: true, manageLoading: false })
				emitDesign()
				await refreshLayoutDerivedPreviews({
					refreshAllFormatPreviews: formatPresets.value.length > 1,
					refreshLeftThumbs: true
				})
			} finally {
				suppressFormatPreviewWatch = false
			}
		})
	}

	const applyFrame = async (frame: FrameOption) => {
		await runWithCanvasLoading(async () => {
			selectedFrame.value = frame
			if (!fabricCanvas || !canvasReady) {
				emitDesign()
				return
			}

			if (hasCollageLayout.value && !collagePhotoObjects.length) {
				await syncCollageSlots({ manageLoading: false })
			} else if (formatPresets.value.length <= 1) {
				await updateFrame()
				reorderLayers()
				fabricCanvas.requestRenderAll()
			}
			emitDesign()
			if (formatPresets.value.length > 1) {
				await refreshLayoutDerivedPreviews({
					refreshAllFormatPreviews: true,
					refreshLeftThumbs: true
				})
			} else {
				await refreshLayoutDerivedPreviews({ refreshLeftThumbs: true })
			}
		})
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
		formatDesignPreviewById.value = {}
		thumbPreviewByIndex.value = {}
		productThumbCollageByIndex.value = {}
		productThumbPreviewSyncId++
		framePreviewSyncId++
		if (productThumbPreviewTimer) {
			clearTimeout(productThumbPreviewTimer)
			productThumbPreviewTimer = null
		}
		canvasPreviewSrc.value = ''
		canvasDesignPreviewSrc.value = ''
		canvasLoadingDepth = 0
		isLoadingImage.value = false
		canvasInitId++
		canvasReady = false
		resizeObserver?.disconnect()
		resizeObserver = null
		detachCropModifiedListener()
		detachCropSelectionListener()
		isCropModeActive.value = false
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
		activeEffectId.value = null
		activeEffectOpacity.value = 100
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
				if (isLoadingImage.value) return
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
			if (suppressFormatPreviewWatch) return
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
			cropStateByUploadIndex.clear()
			if (fabricCanvas && uploadImages.value.length) {
				await selectUploadImage(0)
			}
		}
	)

	watch(activeImageIndex, () => {
		if (!isCropModeActive.value) return
		refreshCropModeTargets()
	})

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
		thumbOverlayByIndex,
		getThumbPreviewSrc,
		getProductThumbBackgroundSrc,
		getProductThumbCollageSrc,
		canvasPreviewSrc,
		canvasDesignPreviewSrc,
		formatPreviewById,
		formatDesignPreviewById,
		getFormatStripBackgroundSrc: () => previewUrl(productBackgroundUrl.value || CANVAS_PAINTING_STATIC_BG),
		activeImage,
		activeImageIndex,
		isThumbActive,
		previewUrl,
		isLoadingImage,
		isCanvasLoading,
		selectedFormat,
		selectedSize,
		selectedFrame,
		formatPresets: displayFormatPresets,
		collageLayout,
		hasCollageLayout,
		productBackgroundUrl,
		sizeOptions: computed(() => (selectedFormat.value?.synthetic ? [] : (selectedFormat.value?.sizes ?? []))),
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
		applyEffectById,
		setEffectOpacity,
		activeEffectId,
		activeEffectOpacity,
		setCropModeActive,
		cropUndo,
		cropRedo,
		cropZoomIn,
		cropZoomOut,
		cropRotate,
		applyCrop,
		cropSizeLabel,
		cropPositionLabel,
		isCropModeActive,
		activeFormatId: computed(() => selectedFormat.value?.id ?? null),
		isFormatActive: (id: number) => Number(selectedFormat.value?.id) === Number(id),
		activeFrameId: computed(() => selectedFrame.value?.id ?? null),
		isFrameActive: (id: string | null) => selectedFrame.value?.id === id,
		isMockupSceneActive,
		activeMockupSceneSettings,
		setMockupSceneColor,
		isCanvasPaintingGallery,
		useStaticFormatPreviews
	}
}
