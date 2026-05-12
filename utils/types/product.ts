import type { Image } from './home'

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
	category_id: number
	sub_category_id: number
	brand_id: number
	banner_id: number
	flag: string
	product_qode: string
	discount_id: number
}
