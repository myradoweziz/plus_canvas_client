import {
	formatOrientationAspect,
	inferFormatAspectFromName,
	type CanvasFormat,
	type PrintSizeOption
} from '~/utils/productDesignConfig'
import { getProductImageUrl } from '~/utils/collageLayout'
import type { Image, Product } from '~/utils/types'
import { CANVAS_PAINTING_CATEGORY_SLUG } from '~/utils/types/category'

/** Статичный фон редактора (как PlusCanvas — серый «холст»). */
export const CANVAS_PAINTING_STATIC_BG = '/images/product-card-bg.svg'

export function isCanvasPaintingGalleryProduct(product: Product | null | undefined): boolean {
	return product?.main_category?.slug === CANVAS_PAINTING_CATEGORY_SLUG
}

/** Одно изображение для Fabric — первый элемент product.images (inner_images не используем). */
export function getCanvasPaintingArtworkUrl(product: Product | null | undefined): string | null {
	if (!product) return null
	const list = Array.isArray(product.images) ? product.images : []
	if (!list.length) return null
	const url = getProductImageUrl(list[0] as Image)
	return url.length > 0 ? url : null
}

/** Миниатюры слева: только product.images. */
export function getCanvasPaintingThumbImages(product: Product | null | undefined) {
	if (!product) return []
	const list = Array.isArray(product.images) ? product.images : []
	return list
		.map((img, idx) => ({
			url: getProductImageUrl(img as Image),
			id: idx + 1,
			session_id: 'product-image' as const
		}))
		.filter((item) => item.url.length > 0)
}

/** SVG-превью формата по ориентации (полоса форматов без снимков Fabric). */
export function getFormatStaticPreviewSvg(format: CanvasFormat): string {
	const aspect = formatOrientationAspect(format)
	const name = inferFormatAspectFromName(format.name, format.slug)

	if (name === 1 || Math.abs(aspect - 1) < 0.08) return '/images/formats/format-kare.svg'
	if (aspect < 0.85 || name === 0.5 || name === 1 / 3) return '/images/formats/format-dikey.svg'
	if (aspect > 1.35 || name === 2 || name === 3) return '/images/formats/format-yatay-wide.svg'
	return '/images/formats/format-yatay.svg'
}

/** Если API не отдал canvas_formats — минимальный формат, чтобы Fabric мог инициализироваться. */
export function getCanvasPaintingDefaultFormat(): CanvasFormat {
	return {
		id: 0,
		name: 'Dikey',
		slug: 'dikey',
		aspect: 3 / 4,
		sizes: [
			{
				id: 0,
				display_name: '30 x 40 cm',
				width: 30,
				height: 40,
				price: 0
			}
		] satisfies PrintSizeOption[]
	}
}
