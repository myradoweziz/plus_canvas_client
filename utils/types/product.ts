import type { CollageLayout } from '~/utils/collageLayout'
import type { CanvasFormat, FrameOption, PrintSizeOption } from '~/utils/productDesignConfig'
import type { MainCategory, FeaturedCategory, SubCategory } from './category'
import type { Faq, Image } from './home'

export type ProductFeature = {
	question: string
	answer: string
}

export type EffectOption = {
	id: number
	name: string
	image_url: string
	image?: string
	sort_order?: number
	is_active?: boolean
}

export type Comment = {
	author_name: string
	comment: string
	is_active: boolean
	rating: number
	updated_at: string
}

export interface Product {
	id: number
	name: string
	slug: string
	description: string
	price: number
	discount: number
	sku: string
	image: Image
	images?: Image[]
	product_images?: Image[]
	upload_image_count: number
	main_category_id: number
	main_category?: MainCategory
	category_id: number
	category?: FeaturedCategory
	sub_category_id: number
	sub_category?: SubCategory
	brand_id: number
	banner_id: number
	flag: string
	product_qode: string
	discount_id: number
	/** Filtre (sidebar Renk adı veya API color_id) */
	color?: string
	color_id?: number | null
	canvas_formats?: CanvasFormat[]
	/** Размеры без привязки к формату — если canvas_formats пуст. */
	canvas_sizes?: PrintSizeOption[]
	frames?: FrameOption[]
	/** Раскладка слотов загрузки (независимо от canvas_formats). */
	collage_layout_id?: number | null
	collage_layout?: CollageLayout | null
	faq?: Faq[]
	features?: ProductFeature[]
	product_features?: ProductFeature[]
	specifications?: ProductFeature[]
	effects?: EffectOption[]
	comments?: Comment[]
	product_dimensions: string
	active_canvas_format_id?: number
	discount_price?: number
	calculated_discount?: any
	product_tags?: { id: number; name: string }[]
	tags?: string[]
}
