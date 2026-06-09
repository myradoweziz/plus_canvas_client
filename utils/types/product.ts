import type { CollageLayout } from '~/utils/collageLayout'
import type { CanvasFormat, FrameOption } from '~/utils/productDesignConfig'
import type { MainCategory } from './category'
import type { Faq, Image } from './home'

export type ProductFeature = {
	question: string
	answer: string
}

export type EffectOption = {
	id: number
	name: string
	image_url: string
}

export interface Product {
	id: number
	name: string
	slug: string
	description: string
	price: number
	discount: number
	sku: string
	images: Image[]
	inner_images?: Image[]
	upload_image_count: number
	main_category_id: number
	main_category?: MainCategory
	category_id: number
	sub_category_id: number
	brand_id: number
	banner_id: number
	flag: string
	product_qode: string
	discount_id: number
	/** Filtre (sidebar Renk adı veya API color_id) */
	color?: string
	color_id?: number | null
	canvas_formats?: CanvasFormat[]
	frames?: FrameOption[]
	collage_layout?: CollageLayout | null
	faqs?: Faq[]
	features?: ProductFeature[]
	product_features?: ProductFeature[]
	specifications?: ProductFeature[]
	effects?: EffectOption[]
}
