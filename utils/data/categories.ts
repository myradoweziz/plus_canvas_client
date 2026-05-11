import type { FeaturedCategory, MainCategory, SubCategory } from '../types'
import { CANVAS_PAINTING_CATEGORY, PERSONALIZED_CANVAS_PAINTINGS_CATEGORY } from '../types'

// Mock data for the 3-level category structure
export const mainCategories: MainCategory[] = [
	{
		id: 1,
		name: 'Kişiye Özel Kanvas ',
		slug: 'kisiye-ozel-kanvas',
		description: 'Kendi fotoğraflarınızdan özel tablolar',
		images: ['/images/banner.png'],
		is_active: true,
		featured_order: 1,
		category_type: PERSONALIZED_CANVAS_PAINTINGS_CATEGORY
	},
	{
		id: 2,
		name: 'Tablo  Kanvas Tablo Galerisi',
		slug: 'kanvas-tablo-galerisi',
		description: 'Binlerce hazır tasarım arasından seçin',
		images: ['/images/banner.png'],
		is_active: true,
		featured_order: 2,
		category_type: CANVAS_PAINTING_CATEGORY
	}
]

export const featuredCategories: (FeaturedCategory & { subcategories: SubCategory[] })[] = [
	{
		id: 101,
		main_category_id: 2,
		name: 'Manzara Tabloları',
		slug: 'manzara-tablolari',
		image: '/images/banner.png',
		image_url: '/images/banner.png',
		description: 'Doğa ve şehir manzaraları',
		is_active: true,
		featured_order: 1,
		category_type: 'Öne Çıkan Kategoriler',
		subcategories: [
			{ id: 1001, category_id: 101, name: 'Deniz Manzaraları', slug: 'deniz', is_active: true, featured_order: 1 },
			{ id: 1002, category_id: 101, name: 'Orman ve Dağ', slug: 'orman', is_active: true, featured_order: 2 },
			{ id: 1003, category_id: 101, name: 'Şehir Silüetleri', slug: 'sehir', is_active: true, featured_order: 3 }
		]
	},
	{
		id: 102,
		main_category_id: 2,
		name: 'Soyut Sanat',
		slug: 'soyut-sanat',
		image: '/images/banner.png',
		image_url: '/images/banner.png',
		description: 'Modern ve soyut tasarımlar',
		is_active: true,
		featured_order: 2,
		category_type: 'Öne Çıkan Kategoriler',
		subcategories: [
			{ id: 2001, category_id: 102, name: 'Geometrik', slug: 'geometrik', is_active: true, featured_order: 1 },
			{ id: 2002, category_id: 102, name: 'Minimalist', slug: 'minimalist', is_active: true, featured_order: 2 },
			{ id: 2003, category_id: 102, name: 'Renkli Soyut', slug: 'renkli', is_active: true, featured_order: 3 }
		]
	},
	{
		id: 103,
		main_category_id: 2,
		name: 'Hayvanlar',
		slug: 'hayvanlar',
		image: '/images/banner.png',
		image_url: '/images/banner.png',
		description: 'Vahşi ve evcil hayvan figürleri',
		is_active: true,
		featured_order: 3,
		category_type: 'En Çok Aranan Kategoriler',
		subcategories: [
			{ id: 3001, category_id: 103, name: 'Aslan ve Kaplan', slug: 'aslan', is_active: true, featured_order: 1 },
			{ id: 3002, category_id: 103, name: 'Kuşlar', slug: 'kuslar', is_active: true, featured_order: 2 },
			{ id: 3003, category_id: 103, name: 'Evcil Dostlar', slug: 'evcil', is_active: true, featured_order: 3 }
		]
	},
	{
		id: 104,
		main_category_id: 1,
		name: 'Fotoğraf Baskı',
		slug: 'fotograf-baski',
		image: '/images/banner.png',
		image_url: '/images/banner.png',
		description: 'Kendi fotoğraflarınız',
		is_active: true,
		featured_order: 1,
		category_type: 'Öne Çıkan Kategoriler',
		subcategories: [
			{ id: 4001, category_id: 104, name: 'Tekli Kanvas', slug: 'tekli', is_active: true, featured_order: 1 },
			{ id: 4002, category_id: 104, name: 'Parçalı Kanvas', slug: 'parcali', is_active: true, featured_order: 2 },
			{ id: 4003, category_id: 104, name: 'Kolaj Tablolar', slug: 'kolaj', is_active: true, featured_order: 3 }
		]
	}
]
