import type { MainCategory } from './category'
import type { Image } from './home'
import type { CanvasFormat } from '~/utils/productDesignConfig'

export interface Product {
	id: number
	name: string
	slug: string
	description: string
	price: number
	discount: number
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
}
