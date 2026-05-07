export interface BreadcrumbItem {
	label: string
	link?: string
}

export type CategoryType = 'Kişiye Özel Kanvas ' | 'Tablo  Kanvas Tablo Galerisi'
export type FeaturedCategoryType = 'Öne Çıkan Kategorile' | 'En Çok Aranan Kategoriler'

export type MainCategory = {
	id: number | null
	name: string
	slug: string
	description: string
	images: string[]
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
	description: string
	is_active: boolean
	featured_order: number
	category_type: FeaturedCategoryType
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
}

export type SubCategoryPayload = Omit<SubCategory, 'id'>
