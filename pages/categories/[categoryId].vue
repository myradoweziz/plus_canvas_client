<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import type { Image } from '~/utils/types/home'

	import Icon from '~/utils/ui/Icon.vue'
	import Pagination from '~/utils/ui/Pagination.vue'

	const route = useRoute()
	const router = useRouter()
	const categoryId = route.params.categoryId

	const { faqs } = useHomeStore()

	const breadcrumbs = [
		{ label: 'Anasayfa', link: '/' },
		{ label: 'Kategoriler', link: '/categories' },
		{ label: categoryId as string }
	]

	interface Product {
		id: 0
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

	type FiltersState = {
		categories: number[]
		discountOnly: boolean
	}

	const sort = ref<string>('default')

	const filters = reactive<FiltersState>({
		categories: [],
		discountOnly: false
	})

	const { data } = await useCustomFetch<ProductsApiResponse>('/api/canvas-products', {
		method: 'GET',
		baseURL: useRuntimeConfig().public.baseUrl
	})

	const products = computed<Product[]>(() => data.value?.data ?? [])

	const activeFilters = computed(() => {
		const res: Array<{ id: string; label: string }> = []
		for (const c of filters.categories) res.push({ id: `cat:${c}`, label: c.toString() })
		if (filters.discountOnly) res.push({ id: 'discountOnly', label: 'İndirimli' })
		return res
	})

	const filteredProducts = computed(() => {
		return products.value
	})

	const availableCategories = computed(() => {
		const counts = new Map<number, number>()
		for (const p of products.value) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1)
		return Array.from(counts.entries())
			.map(([value, count]) => ({ value, count }))
			.sort((a, b) => a.value - b.value)
	})

	const availableTags = computed(() => {
		const counts = new Map<string, number>()
		for (const p of products.value)
			counts.set(p.category_id.toString(), (counts.get(p.category_id.toString()) ?? 0) + 1)
		return Array.from(counts.entries())
			.map(([value, count]) => ({ value, count }))
			.sort((a, b) => Number(a.value) - Number(b.value))
	})

	const toggleInArray = (arr: number[], value: number) => {
		if (arr.includes(value)) return arr.filter((v) => v !== value)
		return [...arr, value]
	}

	const clearFilters = () => {
		filters.categories = []
		filters.discountOnly = false
	}

	const removeFilter = (id: string) => {
		if (id.startsWith('cat:')) {
			const v = id.slice('cat:'.length)
			filters.categories = filters.categories.filter((c) => c !== Number(v))
			return
		}
		if (id === 'discountOnly') {
			filters.discountOnly = false
			return
		}
	}

	const isFilterDrawerOpen = ref(false)

	const openFilters = () => {
		isFilterDrawerOpen.value = true
	}
	const closeFilters = () => {
		isFilterDrawerOpen.value = false
	}

	const applyAndCloseFilters = () => {
		// Фильтры применяются реактивно; на мобиле просто закрываем панель.
		closeFilters()
	}

	const parseStrList = (v: unknown) => {
		const raw = Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : ''
		return raw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	}

	const toBool = (v: unknown) => {
		const s = Array.isArray(v) ? v[0] : v
		if (typeof s !== 'string') return false
		return s === '1' || s === 'true'
	}

	const syncingFromRoute = ref(false)

	const applyRouteQueryToState = () => {
		syncingFromRoute.value = true
		try {
			const q = route.query
			sort.value = typeof q.sort === 'string' ? q.sort : 'default'
			filters.discountOnly = toBool(q.discount)
		} finally {
			syncingFromRoute.value = false
		}
	}

	onMounted(applyRouteQueryToState)
	watch(
		() => route.query,
		() => applyRouteQueryToState()
	)

	const buildQueryFromState = () => {
		const q: Record<string, string> = {}
		if (sort.value && sort.value !== 'default') q.sort = sort.value
		if (filters.categories.length) q.cat = filters.categories.join(',')
		if (filters.discountOnly) q.discount = '1'
		return q
	}

	watch(
		() => ({
			sort: sort.value,
			...filters
		}),
		async () => {
			if (syncingFromRoute.value) return
			await router.replace({ query: buildQueryFromState() })
		},
		{ deep: true }
	)

	const modules = [Navigation, Autoplay]

	const isBeginning = ref(true)
	const isEnd = ref(false)

	const onSwiper = (swiper: any) => {
		isBeginning.value = swiper.isBeginning
		isEnd.value = swiper.isEnd

		swiper.on('slideChange', () => {
			isBeginning.value = swiper.isBeginning
			isEnd.value = swiper.isEnd
		})
	}

	const selectedSubId = ref<number | null>(null)
	const selectedColor = ref<string | null>(null)
	const isUploaderOpen = ref(false)

	const toggleSubId = (id: number) => {
		selectedSubId.value = selectedSubId.value === id ? null : id
	}

	const toggleColor = (color: string) => {
		selectedColor.value = selectedColor.value === color ? null : color
	}

	const openUploader = () => {
		isUploaderOpen.value = true
	}

	const closeUploader = () => {
		isUploaderOpen.value = false
	}

	const goNext = () => {
		router.push(`/products/${filteredProducts.value[0]?.id}`)
	}

	type ProductsApiResponse = {
		data: Product[]
	}
</script>

<template>
	<main class="min-h-screen overflow-hidden">
		<home-banner :banners="[]" :breadcrumbs="breadcrumbs" />

		<catalog-filter
			:active-filters="activeFilters"
			:product-count="filteredProducts.length"
			:sort="sort"
			@update:sort="(v) => (sort = v)"
			@remove="removeFilter"
			@clear="clearFilters"
			@open="openFilters"
		/>

		<!-- Uploader Modal -->
		<catalog-uploader-modal :is-open="isUploaderOpen" @close="closeUploader" @go-next="goNext" />

		<!-- Mobile drawer filters -->
		<Teleport to="body">
			<div v-if="isFilterDrawerOpen" class="fixed inset-0 z-[70] md:hidden" @keydown.esc="closeFilters">
				<button class="absolute inset-0 bg-black/50" aria-label="Close filters" @click="closeFilters" />

				<div
					class="absolute inset-y-0 left-0 w-[86%] max-w-[360px] bg-white shadow-2xl flex flex-col"
					role="dialog"
					aria-modal="true"
				>
					<div class="flex items-center justify-between px-4 py-4 border-b border-gray-200">
						<div class="flex items-center gap-2">
							<Icon name="filter" class="w-5 h-5 text-[#1853a0]" />
							<span class="font-bold text-[#215EA5]">Filtreler</span>
						</div>
						<button class="p-2 -mr-2" aria-label="Close" @click="closeFilters">
							<Icon name="close" class="w-5 h-5 text-gray-600" />
						</button>
					</div>

					<div class="px-4 py-4 overflow-auto">
						<div class="flex items-center justify-between">
							<span class="text-sm text-[#4A5565]">{{ filteredProducts.length }} ürün bulundu</span>
							<button class="text-sm font-semibold text-[#215EA5] hover:underline" @click="clearFilters">
								Temizle
							</button>
						</div>

						<div class="mt-5 space-y-6">
							<div>
								<div class="text-sm font-bold text-[#215EA5]">Kategoriler</div>
								<div class="mt-3 space-y-2">
									<label
										v-for="c in availableCategories"
										:key="c.value"
										class="flex items-center justify-between gap-3 text-sm cursor-pointer select-none"
									>
										<span class="flex items-center gap-2">
											<input
												type="checkbox"
												class="w-4 h-4 accent-[#215EA5]"
												:checked="filters.categories.includes(c.value)"
												@change="filters.categories = toggleInArray(filters.categories, Number(c.value))"
											/>
											<span class="text-[#4A5565]">{{ c.value }}</span>
										</span>
										<span class="text-xs text-gray-400">{{ c.count }}</span>
									</label>
								</div>
							</div>

							<div>
								<div class="text-sm font-bold text-[#215EA5]">Etiketler</div>
								<div class="mt-3 grid grid-cols-2 gap-2">
									<label
										v-for="t in availableTags"
										:key="t.value"
										class="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm cursor-pointer select-none hover:bg-gray-100"
									>
										<span class="flex items-center gap-2">
											<input
												type="checkbox"
												class="w-4 h-4 accent-[#215EA5]"
												:checked="filters.categories.includes(Number(t.value))"
												@change="filters.categories = toggleInArray(filters.categories, Number(t.value))"
											/>
											<span class="text-[#4A5565]">{{ t.value }}</span>
										</span>
										<span class="text-xs text-gray-400">{{ t.count }}</span>
									</label>
								</div>
							</div>

							<div>
								<div class="text-sm font-bold text-[#215EA5]">Fiyat Aralığı</div>
								<div class="mt-3 grid grid-cols-2 gap-3">
									<label class="block">
										<span class="text-xs text-gray-500">Min</span>
										<input
											type="number"
											inputmode="numeric"
											class="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1853a0]/20"
										/>
									</label>
									<label class="block">
										<span class="text-xs text-gray-500">Max</span>
										<input
											type="number"
											inputmode="numeric"
											class="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1853a0]/20"
										/>
									</label>
								</div>
							</div>

							<label
								class="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 cursor-pointer select-none"
							>
								<span class="text-sm font-semibold text-[#4A5565]">Sadece indirimli</span>
								<input type="checkbox" class="w-5 h-5 accent-[#215EA5]" v-model="filters.discountOnly" />
							</label>
						</div>
					</div>

					<div class="mt-auto p-4 border-t border-gray-200">
						<button
							class="w-full bg-[#215EA5] text-white py-3 rounded-xl font-bold hover:bg-[#124080] transition-all"
							@click="applyAndCloseFilters"
						>
							Ürünleri Göster ({{ filteredProducts.length }})
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<div class="max-w-[1400px] mx-auto px-4 md:px-0 py-10 md:py-9">
			<div class="flex flex-col md:flex-row gap-10">
				<!-- Desktop sidebar filters -->
				<div class="hidden md:block w-[390px] shrink-0 sticky top-28 h-fit">
					<catalog-sidebar-filter
						:selected-sub-id="selectedSubId"
						:selected-color="selectedColor"
						@toggle-sub="toggleSubId"
						@toggle-color="toggleColor"
						@clear="clearFilters"
						@apply="applyAndCloseFilters"
					/>
				</div>

				<div class="flex-1 min-w-0">
					<div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-x-6 md:gap-y-10">
						<cards-canvas-paintings-card
							v-for="product in filteredProducts"
							:key="product.id"
							:product="product"
							show-button
							@open-uploader="openUploader"
						/>
					</div>
				</div>
			</div>
			<div class="flex items-center justify-center mt-10">
				<Pagination />
			</div>
		</div>

		<section class="bg-white relative">
			<h1 class="pt-6 text-3xl md:text-4xl lg:text-[40px] text-[#215EA5] text-center font-bold leading-tight">
				İlgili Kategoriler
			</h1>

			<div class="z-10 max-w-[1400px] mx-auto px-4 md:px-10 pt-6 pb-10">
				<Swiper
					:modules="modules"
					:autoplay="{ delay: 4000, disableOnInteraction: false }"
					:speed="2000"
					:loop="true"
					@swiper="onSwiper"
					:navigation="{ prevEl: '.cat-prev', nextEl: '.cat-next' }"
					:slidesPerView="1.2"
					:spaceBetween="16"
					:breakpoints="{
						640: { slidesPerView: 2.2, spaceBetween: 20 },
						1024: { slidesPerView: 4, spaceBetween: 24 }
					}"
					class="!overflow-x-visible"
				>
					<SwiperSlide v-for="(category, index) in []" :key="index" class="h-auto">
						<cards-featured-category-card :category="category" />
					</SwiperSlide>
				</Swiper>

				<button
					class="hidden md:flex items-center justify-center bg-[#a09f9fcc] rounded-full cat-prev absolute top-1/2 left-4 md:left-10 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
				>
					<Icon name="swiperArrow" class="rotate-180" />
				</button>
				<button
					class="hidden md:flex items-center justify-center bg-[#a09f9fcc] rounded-full cat-next absolute top-1/2 right-0 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
				>
					<Icon name="swiperArrow" />
				</button>
			</div>
		</section>

		<home-custom-text />
		<home-frequently-asked-questions :faqs="faqs" />
	</main>
</template>

<style lang="scss" scoped>
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}
</style>
