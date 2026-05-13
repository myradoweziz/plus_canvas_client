export interface FilterColor {
	id: number | null
	name: string
	hex_code: string
	is_active: boolean
	image?: string
	image_url?: string
}

export interface FilterBrand {
	id: number | null
	name: string
	slug: string
	is_active: boolean
	featured_order: number
}

export interface FilterProduct {
	main_category_id: number | null
	category_id: number | null
	sub_category_id: number | null
	brand_id: number | null
	color_id: number | null
	limit?: number
	offset?: number
	sort_by: string | null
	/** Drawer: çoklu kategori (category_id ürün alanı) */
	categories?: number[]
}
