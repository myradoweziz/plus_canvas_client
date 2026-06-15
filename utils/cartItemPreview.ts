import { getProductImageUrl } from '~/utils/collageLayout'
import { mediaUrlForCanvas } from '~/utils/mediaUrl'

type CartItemLike = {
	id?: number
	preview_url?: string | null
	options?: Record<string, unknown> | null
	canvas_product?: {
		name?: string
		image?: unknown
	} | null
	resolved_options?: {
		canvas_format?: { image_url?: string | null; name?: string } | null
	} | null
}

const pickPreviewString = (...values: unknown[]): string => {
	for (const value of values) {
		const raw = String(value ?? '').trim()
		if (raw) return raw
	}
	return ''
}

/** Превью позиции корзины: снимок canvas → API preview → artwork товара. */
export function getCartItemThumbSrc(item: CartItemLike | null | undefined): string {
	if (!item) return ''

	const fromItem = pickPreviewString(item.preview_url, item.options?.preview_url, item.options?.preview_src)
	if (fromItem) return mediaUrlForCanvas(fromItem)

	const productImage = item.canvas_product?.image
	if (productImage) {
		const url = getProductImageUrl(productImage as Parameters<typeof getProductImageUrl>[0])
		if (url) return mediaUrlForCanvas(url)
	}

	const formatImage = item.resolved_options?.canvas_format?.image_url
	if (formatImage) return mediaUrlForCanvas(formatImage)

	return ''
}

export function cartItemHasFormatOptions(item: CartItemLike | null | undefined): boolean {
	return Boolean(item?.resolved_options?.canvas_format || item?.resolved_options?.canvas_size)
}
