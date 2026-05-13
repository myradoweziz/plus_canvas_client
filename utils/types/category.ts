import type { Image } from './home'

export const FEATURED_CATEGORY = 'Öne Çıkan Kategoriler'
export const MOST_SEARCHED_CATEGORY = 'En Çok Aranan Kategoriler'
export const CANVAS_PAINTING_CATEGORY = 'Kanvas Tablo Galerisi'
export const CANVAS_PAINTING_CATEGORY_SLUG = 'kanvas-tablo-galerisi'
export const PERSONALIZED_CANVAS_PAINTINGS_CATEGORY = 'Kişiye Özel Kanvas Tablo'
export const PERSONALIZED_CANVAS_SLUG = 'kisiye-ozel-kanvas-tablo'

export type CategoryType = typeof CANVAS_PAINTING_CATEGORY | typeof PERSONALIZED_CANVAS_PAINTINGS_CATEGORY
export type FeaturedCategoryType = typeof FEATURED_CATEGORY | typeof MOST_SEARCHED_CATEGORY

export type MainCategory = {
	id: number | null
	name: string
	slug: string
	description: string
	images: Image[]
	is_active: boolean
	featured_order: number
	category_type: CategoryType
}

export type MainCategoryPayload = Omit<MainCategory, 'id'>

export type FeaturedCategory = {
	id: number | null
	main_category_id: number | null
	main_category?: MainCategory | null
	name: string
	slug: string
	image: string
	image_url: string
	description: string
	is_active: boolean
	featured_order: number
	category_type: FeaturedCategoryType
	/** Ürün sayısı (API) */
	products_count?: number | null
	subcategories?: SubCategory[]
}

export type FeaturedCategoryPayload = Omit<FeaturedCategory, 'id'>

export type SubCategory = {
	id: number | null
	category_id: number | null
	category?: FeaturedCategory | null
	name: string
	slug: string
	is_active: boolean
	featured_order: number
	/** Ürün sayısı (API) */
	products_count?: number | null
}

export type SubCategoryPayload = Omit<SubCategory, 'id'>
