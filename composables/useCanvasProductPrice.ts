import { isNoFrame, type FrameOption } from '~/utils/productDesignConfig'
import { productApiPath } from '~/utils/productRoute'
import type { CanvasProductCalculatePriceBody, CanvasProductPriceQuote } from '~/utils/types/canvasProductPrice'

const unwrapPriceQuote = (raw: unknown): CanvasProductPriceQuote | null => {
	if (!raw || typeof raw !== 'object') return null
	const row = raw as Record<string, unknown>
	if (row.data && typeof row.data === 'object') return unwrapPriceQuote(row.data)
	if (typeof row.total_price !== 'number') return null
	return row as CanvasProductPriceQuote
}

export const resolveCanvasFrameId = (frameId: string | null, frames: FrameOption[]): number | null => {
	if (frameId == null || frameId === 'none') return null
	const frame = frames.find((f) => f.id != null && String(f.id) === String(frameId))
	if (!frame || isNoFrame(frame)) return null
	const n = Number(frameId)
	return Number.isFinite(n) ? n : null
}

export function useCanvasProductPrice(opts: {
	productId: MaybeRefOrGetter<string | number | null | undefined>
	formatId: MaybeRefOrGetter<number | null | undefined>
	sizeId: MaybeRefOrGetter<number | null | undefined>
	frameId: MaybeRefOrGetter<string | null | undefined>
	frames: MaybeRefOrGetter<FrameOption[]>
}) {
	const quote = ref<CanvasProductPriceQuote | null>(null)
	const isPriceLoading = ref(false)
	let requestSeq = 0

	const fetchPrice = async () => {
		const productId = toValue(opts.productId)
		const formatId = toValue(opts.formatId)
		const sizeId = toValue(opts.sizeId)
		const frameId = toValue(opts.frameId)
		const frames = toValue(opts.frames) ?? []

		if (productId == null || productId === '' || formatId == null || sizeId == null) {
			quote.value = null
			return
		}

		const seq = ++requestSeq
		isPriceLoading.value = true

		const body: CanvasProductCalculatePriceBody = {
			canvas_format_id: Number(formatId),
			canvas_size_id: Number(sizeId),
			canvas_frame_id: resolveCanvasFrameId(frameId ?? null, frames)
		}

		try {
			const $customFetch = useNuxtApp().$customFetch
			const raw = await $customFetch<unknown>(`${productApiPath(String(productId))}/calculate-price`, {
				method: 'POST',
				body
			})
			if (seq !== requestSeq) return
			quote.value = unwrapPriceQuote(raw)
		} catch {
			if (seq !== requestSeq) return
			quote.value = null
		} finally {
			if (seq === requestSeq) isPriceLoading.value = false
		}
	}

	watch(
		() =>
			[
				toValue(opts.productId),
				toValue(opts.formatId),
				toValue(opts.sizeId),
				toValue(opts.frameId),
				toValue(opts.frames)
			] as const,
		() => {
			void fetchPrice()
		},
		{ immediate: true, deep: true }
	)

	return {
		quote,
		isPriceLoading,
		refreshPrice: fetchPrice
	}
}
