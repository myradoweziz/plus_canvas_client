type FabricNS = typeof import('fabric').fabric
type FabricFilter = import('fabric').fabric.IBaseFilter

type EffectAmountBlendFilter = FabricFilter & {
	effectAmount: number
	originalElement: CanvasImageSource
	_originalCacheKey?: string
	_originalCacheData?: ImageData
}

let filterRegistered = false

const readOriginalImageData = (
	fabric: FabricNS,
	element: CanvasImageSource,
	width: number,
	height: number
) => {
	const canvas = fabric.util.createCanvasElement()
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas 2D context is unavailable')
	ctx.drawImage(element, 0, 0, width, height)
	return ctx.getImageData(0, 0, width, height)
}

/** WebGL-фильтры не вызывают applyTo2d — для смешивания нужен 2D backend. */
export const ensureCanvas2dFilterBackend = (fabric: FabricNS) => {
	const Backend = fabric.Canvas2dFilterBackend as (new () => unknown) | undefined
	if (!Backend) return
	if (!(fabric.filterBackend instanceof Backend)) {
		fabric.filterBackend = new Backend()
	}
}

export const ensureEffectAmountBlendFilter = (fabric: FabricNS) => {
	if (filterRegistered) return

	const filters = fabric.Image.filters as Record<string, unknown>
	if (filters.EffectAmountBlend) {
		filterRegistered = true
		return
	}

	filters.EffectAmountBlend = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
		type: 'EffectAmountBlend',
		mainParameter: 'effectAmount',

		initialize(options: { effectAmount?: number; originalElement?: CanvasImageSource } = {}) {
			this.effectAmount = options.effectAmount ?? 1
			this.originalElement = options.originalElement
			this._originalCacheKey = ''
			this._originalCacheData = undefined
		},

		isNeutralState() {
			return this.effectAmount >= 0.999
		},

		applyTo2d(options: { imageData: ImageData; sourceWidth: number; sourceHeight: number }) {
			const effectAmount = Math.min(1, Math.max(0, this.effectAmount))
			const source = this.originalElement as CanvasImageSource | undefined
			if (!source || effectAmount <= 0) return

			const { imageData, sourceWidth, sourceHeight } = options
			if (effectAmount >= 1) return

			const cacheKey = `${sourceWidth}x${sourceHeight}`
			if (this._originalCacheKey !== cacheKey || !this._originalCacheData) {
				this._originalCacheData = readOriginalImageData(fabric, source, sourceWidth, sourceHeight)
				this._originalCacheKey = cacheKey
			}

			const originalData = this._originalCacheData.data
			const pixels = imageData.data
			const originalWeight = 1 - effectAmount

			for (let i = 0; i < pixels.length; i += 4) {
				pixels[i] = Math.round(originalData[i]! * originalWeight + pixels[i]! * effectAmount)
				pixels[i + 1] = Math.round(originalData[i + 1]! * originalWeight + pixels[i + 1]! * effectAmount)
				pixels[i + 2] = Math.round(originalData[i + 2]! * originalWeight + pixels[i + 2]! * effectAmount)
			}
		}
	}) as new (options?: {
		effectAmount?: number
		originalElement?: CanvasImageSource
	}) => EffectAmountBlendFilter

	filterRegistered = true
}

export const createEffectAmountBlendFilter = (
	fabric: FabricNS,
	originalElement: CanvasImageSource,
	effectAmount: number
): FabricFilter | null => {
	ensureCanvas2dFilterBackend(fabric)
	ensureEffectAmountBlendFilter(fabric)

	const amount = Math.min(1, Math.max(0, effectAmount))
	if (amount <= 0) return null

	const FilterCtor = fabric.Image.filters.EffectAmountBlend as
		| (new (options?: { effectAmount?: number; originalElement?: CanvasImageSource }) => EffectAmountBlendFilter)
		| undefined
	if (!FilterCtor) return null

	return new FilterCtor({
		effectAmount: amount,
		originalElement
	})
}
