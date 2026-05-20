import { useFabricImageLoader } from '~/composables/useFabricImageLoader'
import {
	extractCollageLayoutFromProduct,
	getPrimaryProductBackgroundUrl,
	insetSlotRect,
	slotRectOnMockup,
	sortLayoutSlots,
	type CollageLayoutSlot,
	detectSlotCoordinateMode,
	collageLayoutReferenceBounds,
	slotRectInContainer
} from '~/utils/collageLayout'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'
import {
	formatOrientationAspect,
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
const FRAME_BORDER_WIDTH = 14

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
	const productBackgroundUrl = computed(() => getPrimaryProductBackgroundUrl(options.product?.value))
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
	let viewportBgImage: import('fabric').fabric.Image | null = null
	let mockupNaturalW = 0
	let mockupNaturalH = 0
	let printAreaRect: import('fabric').fabric.Rect | null = null
	let frameObject: import('fabric').fabric.Object | null = null
	let frameBorderRect: import('fabric').fabric.Rect | null = null

	const uploadImages = computed(() => designStore.getSessionImages(options.productId.value))

	const activeImage = computed(() => designStore.getActiveImage(options.productId.value))

	const activeImageIndex = computed(() => {
		if (designStore.productId !== options.productId.value) return 0
		return designStore.activeImageIndex
	})

	const isThumbActive = (index: number) => activeImageIndex.value === index

	const previewUrl = (url: string) => {
		const raw = String(url ?? '').trim()
		if (!raw) return ''
		if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
		return mediaUrlForCanvas(raw)
	}

	const getViewportSize = () => {
		const el = options.wrapRef.value
		if (!el) return { width: DEFAULT_VIEWPORT_W, height: DEFAULT_VIEWPORT_H }
		const w = Math.max(1, Math.floor(el.clientWidth))
		const h = Math.max(1, Math.floor(el.clientHeight))
		return { width: w, height: h }
	}

	const applyWrapLayoutStyles = () => {
		const wrap = options.wrapRef.value
		if (!wrap) return
		wrap.style.position = 'relative'
		wrap.style.overflow = 'hidden'
		wrap.style.borderRadius = '20px'

		const container = wrap.querySelector('.canvas-container') as HTMLElement | null
		if (container) {
			container.style.borderRadius = '20px'
			container.style.overflow = 'hidden'
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
		return printBoxInViewport(formatOrientationAspect(format), maxW, maxH)
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
		if (frameBorderRect) {
			fabricCanvas.moveTo(frameBorderRect, z)
			z += 1
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
			const mockupFit = hasCollageLayout.value ? 'contain' : 'cover'
			fitImageInViewport(img, mockupFit)
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
		if (frameObject && fabricCanvas) {
			fabricCanvas.remove(frameObject)
			frameObject = null
		}
		if (frameBorderRect && fabricCanvas) {
			fabricCanvas.remove(frameBorderRect)
			frameBorderRect = null
		}
	}

	const updateFrame = async () => {
		if (!fabricCanvas || !fabricLib || !printAreaRect) return
		removeFrame()
		
		if (hasCollageLayout.value) {
			fabricCanvas.requestRenderAll()
			return
		}

		const frame = selectedFrame.value
		if (!frame || isNoFrame(frame)) {
			fabricCanvas.requestRenderAll()
			return
		}

		const pw = printAreaRect.width ?? 0
		const ph = printAreaRect.height ?? 0
		const bw = FRAME_BORDER_WIDTH
		const borderColor = normalizeFrameColor(frame.color_hex)

		frameBorderRect = new fabricLib.Rect({
			width: pw + bw * 2,
			height: ph + bw * 2,
			left: cx(),
			top: cy(),
			originX: 'center',
			originY: 'center',
			fill: 'transparent',
			stroke: borderColor,
			strokeWidth: bw,
			selectable: false,
			evented: false
		})
		fabricCanvas.add(frameBorderRect)

		const imageUrl = frame.image_url?.trim()
		if (imageUrl) {
			try {
				const el = await loadHtmlImage(mediaUrlForCanvas(imageUrl))
				const img = new fabricLib.Image(el, {
					left: cx(),
					top: cy(),
					originX: 'center',
					originY: 'center',
					selectable: false,
					evented: false
				})
				const scale = Math.max((pw + bw * 2) / (img.width || 1), (ph + bw * 2) / (img.height || 1))
				img.set({ scaleX: scale, scaleY: scale })
				frameObject = img
				fabricCanvas.add(frameObject)
			} catch {
				/* только цветная обводка */
			}
		}

		reorderLayers()
		fabricCanvas.requestRenderAll()
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
		const rawRect = slotRectOnMockup(
			slotDef,
			allSlots,
			viewportW.value,
			viewportH.value,
			cx(),
			cy(),
			mockupW,
			mockupH,
			layoutRef
		)
		const rect = insetSlotRect(rawRect)

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

	const syncCollageSlots = async () => {
		if (!fabricCanvas || !fabricLib || !printAreaRect || !collageLayout.value) return

		removeSinglePhoto()
		removeCollagePhotos()

		const uploads = uploadImages.value.filter((u) => u?.url?.trim())
		if (!uploads.length) return

		const layout = collageLayout.value
		const allSlots = layout.layout_json
		const sortedSlots = sortLayoutSlots(allSlots)
		const mockupW = layout.reference_width || mockupNaturalW || viewportW.value
		const mockupH = layout.reference_height || mockupNaturalH || viewportH.value
		const layoutRef = { width: layout.reference_width, height: layout.reference_height }

		const slotCount = sortedSlots.length
		const imageCount = uploads.length
		const pairCount = Math.min(slotCount, imageCount)

		for (let i = 0; i < pairCount; i++) {
			const upload = uploads[i]
			const slotDef = sortedSlots[i]
			if (!upload?.url || !slotDef) continue

			try {
				await addUploadToCollageSlot(upload, slotDef, allSlots, mockupW, mockupH, layoutRef)
			} catch {
				/* слот без фото */
			}
		}

		await updateFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
		emitDesign()
	}

	const syncPhotos = async () => {
		if (!fabricCanvas || !fabricLib || !printAreaRect) return

		isLoadingImage.value = true
		try {
			const useTemplateBg = Boolean(productBackgroundUrl.value)
			if (printAreaRect) {
				printAreaRect.set({
					fill: useTemplateBg ? 'transparent' : '#ffffff'
				})
			}

			if (hasCollageLayout.value) {
				await syncCollageSlots()
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
				reorderLayers()
				fabricCanvas.requestRenderAll()
				emitDesign()
			}
		} finally {
			isLoadingImage.value = false
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

		await syncPhotos()
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
		} finally {
			if (manageLoading) isLoadingImage.value = false
		}
	}

	const selectUploadImage = async (index: number) => {
		const list = uploadImages.value
		if (index < 0 || index >= list.length) return
		designStore.setActiveImageIndex(index)
		await syncPhotos()
	}

	const applyFormat = async (format: CanvasFormat) => {
		selectedFormat.value = format
		selectedSize.value = getDefaultSize(format)
		if (!fabricCanvas) {
			await tryInitOrSyncFormats()
			return
		}
		// printAreaRect + photo/collage пересчитываются по formatOrientationAspect(format)
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
		await updateFrame()
		emitDesign()
	}

	const applyFrameByIndex = async (index: number) => {
		const frame = frameOptions.value[index]
		if (frame) await applyFrame(frame)
	}

	const resizeCanvasToContainer = async () => {
		if (!fabricCanvas || !options.wrapRef.value) return
		const { width, height } = getViewportSize()
		if (width === viewportW.value && height === viewportH.value) return
		viewportW.value = width
		viewportH.value = height
		fabricCanvas.setDimensions({ width, height })
		fabricCanvas.calcOffset()
		if (viewportBgImage) {
			fitImageInViewport(viewportBgImage, hasCollageLayout.value ? 'contain' : 'cover')
		}
		applyWrapLayoutStyles()
		await syncPrintArea()
		fabricCanvas.requestRenderAll()
	}

	const disposeCanvas = () => {
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
		viewportBgImage = null
		mockupNaturalW = 0
		mockupNaturalH = 0
		printAreaRect = null
		frameObject = null
		frameBorderRect = null
		if (options.wrapRef.value) options.wrapRef.value.innerHTML = ''
	}

	const initCanvas = async () => {
		if (!import.meta.client || !options.wrapRef.value) return
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
			backgroundColor: '#b8b8b8',
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

		await resizeCanvasToContainer()
		if (!isActiveCanvasInit(initId)) return

		syncSelectionFromFormats()
		syncFrameSelection()
		await syncPrintArea()
		if (!isActiveCanvasInit(initId)) return

		await syncPhotos()

		canvasReady = true
	}

	const tryInitOrSyncFormats = async () => {
		if (!import.meta.client || !formatPresets.value.length) return
		if (!options.wrapRef.value) return
		if (!designStore.hasSessionFor(options.productId.value)) return

		syncSelectionFromFormats()

		if (!fabricCanvas || !canvasReady) {
			try {
				await initCanvas()
			} catch {
				/* aborted */
			}
			return
		}

		await syncPrintArea()
	}

	watch(formatPresets, () => void tryInitOrSyncFormats())
	watch(frameOptions, syncFrameSelection)
	watch([hasCollageLayout, uploadImages, collageLayout, productBackgroundUrl], () => {
		if (!fabricCanvas || !canvasReady) return
		void (async () => {
			await applyViewportBackground()
			await syncPhotos()
		})()
	})

	watch(
		() => options.wrapRef.value,
		(wrap) => {
			if (wrap) void tryInitOrSyncFormats()
		}
	)

	watch(
		() => options.productId.value,
		async () => {
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
		activeImage,
		activeImageIndex,
		isThumbActive,
		previewUrl,
		isLoadingImage,
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
		selectUploadImage,
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
