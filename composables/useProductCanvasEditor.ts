import { useFabricImageLoader } from '~/composables/useFabricImageLoader'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'
import { createPlusCanvasWatermarkTile } from '~/utils/plusCanvasWatermarkPattern'
import {
	FRAME_OPTIONS,
	MAIN_CANVAS_FORMATS,
	PRINT_SIZES,
	printBoxInViewport,
	type CanvasFormat,
	type FrameOption,
	type PrintSizeOption
} from '~/utils/productDesignConfig'
import type { ProductDesignPayload, TempDesignImage } from '~/utils/types'

const DEFAULT_VIEWPORT_W = 560
const DEFAULT_VIEWPORT_H = 520

export function useProductCanvasEditor(options: {
	productId: Ref<string>
	wrapRef: Ref<HTMLElement | null>
	onDesignUpdate?: (payload: ProductDesignPayload) => void
}) {
	const designStore = useProductDesignStore()
	const { loadHtmlImage } = useFabricImageLoader()

	const selectedFormat = ref<CanvasFormat>(MAIN_CANVAS_FORMATS[0])
	const selectedSize = ref<PrintSizeOption>(PRINT_SIZES[0])
	const selectedFrame = ref<FrameOption>(FRAME_OPTIONS[0])
	const isLoadingImage = ref(false)
	const viewportW = ref(DEFAULT_VIEWPORT_W)
	const viewportH = ref(DEFAULT_VIEWPORT_H)

	let fabricLib: typeof import('fabric').fabric | null = null
	let resizeObserver: ResizeObserver | null = null
	let fabricCanvas: import('fabric').fabric.Canvas | null = null
	let photoObject: import('fabric').fabric.Image | null = null
	let printAreaRect: import('fabric').fabric.Rect | null = null
	let frameObject: import('fabric').fabric.Object | null = null
	let watermarkBg: import('fabric').fabric.Rect | null = null

	const uploadImages = computed(() => designStore.getSessionImages(options.productId.value))

	const activeImage = computed(() => designStore.getActiveImage(options.productId.value))

	const activeImageIndex = computed(() => {
		if (designStore.productId !== options.productId.value) return 0
		return designStore.activeImageIndex
	})

	const isThumbActive = (index: number) => activeImageIndex.value === index

	const previewUrl = (url: string) => mediaUrlForCanvas(url)

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
			printSizeLabel: selectedSize.value.label,
			formatId: selectedFormat.value.id,
			formatLabel: selectedFormat.value.label,
			frameId: selectedFrame.value.id
		}
		options.onDesignUpdate(payload)
	}

	const makeClipRect = (w: number, h: number) => {
		if (!fabricLib) return undefined
		return new fabricLib.Rect({
			width: w,
			height: h,
			left: cx(),
			top: cy(),
			originX: 'center',
			originY: 'center',
			absolutePositioned: true
		})
	}

	const getPrintDimensions = () => {
		const maxW = viewportW.value * 0.9
		const maxH = viewportH.value * 0.9
		return printBoxInViewport(selectedFormat.value.aspect, maxW, maxH)
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
	}

	const lockPhotoInteractions = (img: import('fabric').fabric.Image) => {
		img.set({
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
		img.setControlsVisibility({
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

	const constrainPhoto = () => {
		if (!photoObject || !printAreaRect || !fabricLib) return
		const pw = (printAreaRect.width ?? 0) * (printAreaRect.scaleX ?? 1)
		const ph = (printAreaRect.height ?? 0) * (printAreaRect.scaleY ?? 1)
		const padX = ((photoObject.width ?? 0) * (photoObject.scaleX ?? 1)) / 2
		const padY = ((photoObject.height ?? 0) * (photoObject.scaleY ?? 1)) / 2
		const minX = cx() - pw / 2 + padX * 0.35
		const maxX = cx() + pw / 2 - padX * 0.35
		const minY = cy() - ph / 2 + padY * 0.35
		const maxY = cy() + ph / 2 - padY * 0.35
		const left = Math.min(maxX, Math.max(minX, photoObject.left ?? cx()))
		const top = Math.min(maxY, Math.max(minY, photoObject.top ?? cy()))
		photoObject.set({ left, top })
		photoObject.setCoords()
	}

	const reorderLayers = () => {
		if (!fabricCanvas) return
		if (watermarkBg) fabricCanvas.sendToBack(watermarkBg)
		let z = 1
		if (printAreaRect) {
			fabricCanvas.moveTo(printAreaRect, z)
			z += 1
		}
		if (frameObject) {
			fabricCanvas.moveTo(frameObject, z)
			z += 1
		}
		if (photoObject) fabricCanvas.moveTo(photoObject, z)
	}

	const applyWatermarkBackground = async () => {
		if (!fabricCanvas || !fabricLib) return
		const tile = await createPlusCanvasWatermarkTile()
		const pattern = new fabricLib.Pattern({
			source: tile as unknown as HTMLImageElement,
			repeat: 'repeat'
		})
		if (!watermarkBg) {
			watermarkBg = new fabricLib.Rect({
				left: 0,
				top: 0,
				width: viewportW.value,
				height: viewportH.value,
				fill: pattern,
				selectable: false,
				evented: false
			})
			fabricCanvas.add(watermarkBg)
		} else {
			watermarkBg.set('fill', pattern)
		}
		reorderLayers()
	}

	const removeFrame = () => {
		if (frameObject && fabricCanvas) {
			fabricCanvas.remove(frameObject)
			frameObject = null
		}
	}

	const updateFrame = async () => {
		if (!fabricCanvas || !fabricLib || !printAreaRect) return
		removeFrame()
		const frame = selectedFrame.value
		if (frame.id === 'none' || !frame.src) {
			fabricCanvas.requestRenderAll()
			return
		}
		const pw = printAreaRect.width ?? 0
		const ph = printAreaRect.height ?? 0
		const bw = frame.borderWidth ?? 12
		const src = frame.src.startsWith('http') ? frame.src : `${window.location.origin}${frame.src}`
		try {
			const el = await loadHtmlImage(src)
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
			if (photoObject) fabricCanvas.bringToFront(photoObject)
		} catch {
			frameObject = new fabricLib.Rect({
				width: pw + bw * 2,
				height: ph + bw * 2,
				left: cx(),
				top: cy(),
				originX: 'center',
				originY: 'center',
				fill: 'transparent',
				stroke: '#6b4f2a',
				strokeWidth: bw,
				selectable: false,
				evented: false
			})
			fabricCanvas.add(frameObject)
			if (photoObject) fabricCanvas.bringToFront(photoObject)
		}
		reorderLayers()
		fabricCanvas.requestRenderAll()
	}

	const syncPrintArea = async () => {
		if (!fabricCanvas || !fabricLib) return

		const { width, height } = getPrintDimensions()

		if (!printAreaRect) {
			printAreaRect = new fabricLib.Rect({
				width,
				height,
				left: cx(),
				top: cy(),
				originX: 'center',
				originY: 'center',
				fill: '#ffffff',
				stroke: '#d1d5db',
				strokeWidth: 1,
				selectable: false,
				evented: false
			})
			fabricCanvas.add(printAreaRect)
		} else {
			printAreaRect.set({ width, height, left: cx(), top: cy() })
			printAreaRect.setCoords()
		}

		if (photoObject) {
			photoObject.clipPath = makeClipRect(width, height)
			fitPhotoCover()
			lockPhotoInteractions(photoObject)
			fabricCanvas.bringToFront(photoObject)
		}

		await updateFrame()
		reorderLayers()
		fabricCanvas.requestRenderAll()
		emitDesign()
	}

	const setPhotoFromUrl = async (url: string, meta?: TempDesignImage | null) => {
		if (!fabricCanvas || !fabricLib) return
		isLoadingImage.value = true
		try {
			const el = await loadHtmlImage(url)
			if (photoObject) {
				fabricCanvas.remove(photoObject)
				photoObject = null
			}
			const img = new fabricLib.Image(el, {
				originX: 'center',
				originY: 'center',
				left: cx(),
				top: cy()
			})
			lockPhotoInteractions(img)
			const { width, height } = getPrintDimensions()
			img.clipPath = makeClipRect(width, height)
			fabricCanvas.add(img)
			photoObject = img
			fabricCanvas.discardActiveObject()
			fitPhotoCover()
			await updateFrame()
			reorderLayers()
			fabricCanvas.requestRenderAll()
			emitDesign()
		} finally {
			isLoadingImage.value = false
		}
	}

	const selectUploadImage = async (index: number) => {
		const list = uploadImages.value
		if (index < 0 || index >= list.length) return
		designStore.setActiveImageIndex(index)
		const img = list[index]
		await setPhotoFromUrl(img.url, img)
	}

	const applyFormat = async (format: CanvasFormat) => {
		selectedFormat.value = format
		await syncPrintArea()
	}

	const applyFormatById = async (formatId: string) => {
		const f = MAIN_CANVAS_FORMATS.find((x) => x.id === formatId)
		if (f) await applyFormat(f)
	}

	const applySizeById = async (sizeId: string) => {
		const s = PRINT_SIZES.find((x) => x.id === sizeId)
		if (s) {
			selectedSize.value = s
			emitDesign()
		}
	}

	const applyFrame = async (frame: FrameOption) => {
		selectedFrame.value = frame
		await updateFrame()
		emitDesign()
	}

	const applyFrameByIndex = async (index: number) => {
		const frame = FRAME_OPTIONS[index]
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
		if (watermarkBg) {
			watermarkBg.set({ left: 0, top: 0, width, height })
			watermarkBg.setCoords()
		}
		await syncPrintArea()
		fabricCanvas.requestRenderAll()
	}

	const disposeCanvas = () => {
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
		printAreaRect = null
		frameObject = null
		watermarkBg = null
		if (options.wrapRef.value) options.wrapRef.value.innerHTML = ''
	}

	const initCanvas = async () => {
		if (!import.meta.client || !options.wrapRef.value) return
		disposeCanvas()
		const mod = await import('fabric')
		fabricLib = mod.fabric

		applyWrapLayoutStyles()
		await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
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

		resizeObserver = new ResizeObserver(() => {
			void resizeCanvasToContainer()
		})
		resizeObserver.observe(options.wrapRef.value)

		await applyWatermarkBackground()

		await resizeCanvasToContainer()
		await syncPrintArea()
		const list = uploadImages.value
		if (list.length > 0) {
			await selectUploadImage(designStore.activeImageIndex)
		}
	}

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
		fabricLib = null
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
		formatPresets: MAIN_CANVAS_FORMATS,
		frameOptions: FRAME_OPTIONS,
		printSizes: PRINT_SIZES,
		initCanvas,
		selectUploadImage,
		applyFormat,
		applyFormatById,
		applySizeById,
		applyFrame,
		applyFrameByIndex,
		isFormatActive: (id: string) => selectedFormat.value.id === id,
		isFrameActive: (id: string) => selectedFrame.value.id === id
	}
}
