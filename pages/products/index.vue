<script setup lang="ts">
	import { storeToRefs } from 'pinia'
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'
	import Pagination from '~/utils/ui/Pagination.vue'

	import type {
		Banner,
		FeaturedCategory,
		FilterBrand,
		FilterColor,
		FilterProduct,
		MainCategory,
		Product,
		SubCategory,
		TempDesignImage
	} from '~/utils/types'

	const route = useRoute()
	const router = useRouter()
	const productId = route.params.productId

	const homeStore = useHomeStore()
	const { faqs, mainCategories, featuredCategoriesAll, subCategories } = storeToRefs(homeStore)

	const breadcrumbs = [
		{ label: 'Anasayfa', link: '/' },
		{ label: 'Kategoriler', link: '/products' },
		{ label: productId as string }
	]

	const PAGE_SIZE = 50

	const filters = reactive<FilterProduct>({
		main_category_id: null,
		category_id: null,
		sub_category_id: null,
		brand_id: null,
		color_id: null,
		sort_by: null,
		categories: [],
		limit: PAGE_SIZE,
		offset: 0
	})

	const syncingFromRoute = ref(false)

	const toNum = (v: unknown): number | null => {
		const s = Array.isArray(v) ? v[0] : v
		if (s === undefined || s === null || s === '') return null
		const n = Number(s)
		return Number.isFinite(n) ? n : null
	}

	const SORT_BY_VALUES = new Set(['newest', 'oldest', 'price_asc', 'price_desc'])

	const SORT_FILTER_LABELS: Record<string, string> = {
		newest: 'En Yeniler',
		oldest: 'En Eskiler',
		price_asc: 'Düşük Fiyat',
		price_desc: 'Yüksek Fiyat'
	}

	const setCatalogSortFromUi = (v: string) => {
		if (v === 'default') {
			filters.sort_by = null
			return
		}
		if (SORT_BY_VALUES.has(v)) filters.sort_by = v
	}

	const applyRouteQueryToState = () => {
		syncingFromRoute.value = true
		try {
			const q = route.query
			const sortRaw =
				(typeof q.sort_by === 'string' && q.sort_by.trim()) || (typeof q.sort === 'string' && q.sort.trim()) || ''
			filters.sort_by = sortRaw && SORT_BY_VALUES.has(sortRaw) ? sortRaw : null
			filters.main_category_id = toNum(q.main_category_id)
			filters.category_id = toNum(q.category_id)
			filters.sub_category_id = toNum(q.sub_category_id)
			filters.brand_id = toNum(q.brand_id)
			filters.color_id = toNum(q.color_id)
			const catRaw = typeof q.cat === 'string' ? q.cat : Array.isArray(q.cat) ? q.cat.join(',') : ''
			if (!catRaw.trim()) {
				filters.categories = []
			} else {
				filters.categories = catRaw
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
					.map((s) => Number(s))
					.filter((n) => Number.isFinite(n) && n > 0)
			}
			const pageNum = toNum(q.page)
			if (pageNum != null && pageNum > 1) {
				filters.offset = (pageNum - 1) * PAGE_SIZE
			} else {
				filters.offset = 0
			}
			filters.limit = PAGE_SIZE
		} finally {
			syncingFromRoute.value = false
		}
	}

	applyRouteQueryToState()

	if (filters.main_category_id != null && !homeStore.mainCategories.length) {
		await homeStore.fetchMainCategories()
	}

	if (
		(filters.category_id != null || filters.sub_category_id != null) &&
		(!homeStore.featuredCategoriesAll.length || !homeStore.subCategories.length)
	) {
		await Promise.all([homeStore.fetchFeaturedCategories(), homeStore.fetchSubCategories()])
	}

	const canvasProductParams = computed(() => ({
		main_category_id: filters.main_category_id,
		category_id: filters.category_id,
		sub_category_id: filters.sub_category_id,
		brand_id: filters.brand_id,
		color_id: filters.color_id,
		sort_by: filters.sort_by || undefined,
		categories: filters.categories?.length ? filters.categories : undefined,
		limit: filters.limit ?? PAGE_SIZE,
		offset: filters.offset ?? 0
	}))

	const rc = useRuntimeConfig()

	type BrandsApiResponse = { data: FilterBrand[] }
	type ColorsApiResponse = { data: FilterColor[] }
	type ProductsApiResponse = {
		data: Product[]
		total?: number
	}

	const { data: brandsLabelData } = await useCustomFetch<BrandsApiResponse>('/api/brands', {
		method: 'GET',
		baseURL: rc.public.baseUrl
	})
	const { data: colorsLabelData } = await useCustomFetch<ColorsApiResponse>('/api/colors', {
		method: 'GET',
		baseURL: rc.public.baseUrl
	})

	/** Eski `?color=İsim` linkleri → `color_id` (API yalnızca id kullanıyor). */
	watch(
		[() => route.query.color, () => route.query.color_id, () => colorsLabelData.value?.data],
		() => {
			if (syncingFromRoute.value) return
			if (toNum(route.query.color_id) != null) return
			const colorName = typeof route.query.color === 'string' ? route.query.color.trim() : ''
			if (!colorName) return
			const rows = colorsLabelData.value?.data
			if (!rows?.length) return
			const row = rows.find((c) => c.name === colorName)
			if (row?.id == null) return
			filters.color_id = Number(row.id)
		},
		{ flush: 'post' }
	)

	const { data } = await useCustomFetch<ProductsApiResponse>('/api/canvas-products', {
		method: 'GET',
		baseURL: rc.public.baseUrl,
		params: canvasProductParams
	})

	const products = computed<Product[]>(() => data.value?.data ?? [])

	const catalogCurrentPage = computed(() => Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1)

	const catalogTotalPages = computed(() => {
		const total = data.value?.total
		if (total != null && Number.isFinite(Number(total)) && Number(total) >= 0) {
			return Math.max(1, Math.ceil(Number(total) / PAGE_SIZE))
		}
		const len = products.value.length
		const p = catalogCurrentPage.value
		if (len === 0) return Math.max(1, p)
		if (len < PAGE_SIZE) return p
		return p + 1
	})

	const setCatalogPage = (page: number) => {
		const tp = catalogTotalPages.value
		const next = Math.max(1, Math.min(page, tp))
		filters.offset = (next - 1) * PAGE_SIZE
	}

	const filterSnapshotKey = computed(() =>
		[
			filters.main_category_id,
			filters.category_id,
			filters.sub_category_id,
			filters.brand_id,
			filters.color_id,
			filters.sort_by,
			(filters.categories ?? [])
				.slice()
				.sort((a, b) => a - b)
				.join(',')
		].join('|')
	)

	let lastFilterSnapshotKey = ''

	watch(
		filterSnapshotKey,
		(key) => {
			if (syncingFromRoute.value) return
			if (lastFilterSnapshotKey === '') {
				lastFilterSnapshotKey = key
				return
			}
			if (lastFilterSnapshotKey !== key) {
				lastFilterSnapshotKey = key
				filters.offset = 0
			}
		},
		{ flush: 'post' }
	)

	let offsetScrollPrimed = false
	watch(
		() => filters.offset,
		() => {
			if (!import.meta.client) return
			if (!offsetScrollPrimed) {
				offsetScrollPrimed = true
				return
			}
			window.scrollTo({ top: 0, behavior: 'smooth' })
		}
	)

	/** Ana kategorinin tüm görselleri → swiper slaytları (Banner[]). */
	const mainCategoryHeroBanners = computed((): Banner[] => {
		/** Alt/featured seçilince kahraman swiper gizlenir; başlık `catalogHeading` ile gelir. */
		if (filters.category_id != null || filters.sub_category_id != null) return []
		const id = filters.main_category_id
		if (id == null) return []
		const m = mainCategories.value.find((c) => c.id != null && Number(c.id) === Number(id))
		if (!m?.images?.length) return []
		const desc = typeof m.description === 'string' ? m.description.trim() : ''
		const listUrl = `/products?main_category_id=${id}`
		return m.images
			.map((img, idx) => {
				const imageUrl = img?.url?.trim()
				if (!imageUrl) return null
				return {
					id: -(idx + 1),
					title: m.name,
					description: desc,
					image: img.path ?? '',
					image_url: imageUrl,
					url: listUrl
				} satisfies Banner
			})
			.filter((b): b is Banner => b != null)
	})

	/** Swiper kahramanı: `main_category_id` ile eşleşen tam kayıt (ortada başlık için). */
	const heroMainCategoryForBanner = computed((): MainCategory | undefined => {
		if (filters.category_id != null || filters.sub_category_id != null) return undefined
		const id = filters.main_category_id
		if (id == null) return undefined
		return mainCategories.value.find((c) => c.id != null && Number(c.id) === Number(id))
	})

	const filteredProducts = computed(() => {
		return products.value
	})

	watch(
		() => filters.main_category_id,
		async (id) => {
			if (id == null) return
			if (!mainCategories.value.length) await homeStore.fetchMainCategories()
		}
	)

	watch(
		() => [filters.category_id, filters.sub_category_id] as const,
		async ([cid, sid]) => {
			if (cid == null && sid == null) return
			const jobs: Promise<void>[] = []
			if (!featuredCategoriesAll.value.length) jobs.push(homeStore.fetchFeaturedCategories())
			if (sid != null && !subCategories.value.length) jobs.push(homeStore.fetchSubCategories())
			if (jobs.length) await Promise.all(jobs)
		}
	)

	/** Başlık alanı: `category_id` veya `sub_category_id` için isim + açıklama (API’den). */
	const catalogHeading = computed((): { title: string; description?: string } | null => {
		const sid = filters.sub_category_id
		const cid = filters.category_id

		const resolveFeatured = (id: number | null) => {
			if (id == null) return undefined
			return featuredCategoriesAll.value.find((f) => f.id != null && Number(f.id) === Number(id))
		}

		if (sid != null) {
			let sub = subCategories.value.find((s) => s.id != null && Number(s.id) === Number(sid))
			if (!sub) {
				for (const f of featuredCategoriesAll.value) {
					const hit = f.subcategories?.find((s) => s.id != null && Number(s.id) === Number(sid))
					if (hit) {
						sub = hit
						break
					}
				}
			}
			if (sub) {
				const parent = resolveFeatured(sub.category_id ?? cid)
				const desc = parent?.description?.trim() || ''
				return { title: sub.name, ...(desc ? { description: desc } : {}) }
			}
			return { title: `Alt kategori #${sid}` }
		}

		if (cid != null) {
			const f = resolveFeatured(cid)
			if (f) {
				const desc = f.description?.trim() || ''
				return { title: f.name, ...(desc ? { description: desc } : {}) }
			}
			return { title: `Kategori #${cid}` }
		}

		return null
	})

	const featuredNameById = (id: number) => {
		const f = featuredCategoriesAll.value.find((x) => x.id != null && Number(x.id) === Number(id))
		return f?.name
	}

	const subNameById = (sid: number) => {
		let sub = subCategories.value.find((s) => s.id != null && Number(s.id) === Number(sid))
		if (!sub) {
			for (const f of featuredCategoriesAll.value) {
				const hit = f.subcategories?.find((s) => s.id != null && Number(s.id) === Number(sid))
				if (hit) {
					sub = hit
					break
				}
			}
		}
		return sub?.name
	}

	const activeFilters = computed(() => {
		const res: Array<{ id: string; label: string }> = []
		const mid = filters.main_category_id
		if (mid != null) {
			const m = mainCategories.value.find((c) => c.id != null && Number(c.id) === Number(mid))
			res.push({ id: `main:${mid}`, label: m?.name ?? `Ana #${mid}` })
		}
		const cid = filters.category_id
		if (cid != null) {
			res.push({ id: `category:${cid}`, label: featuredNameById(cid) ?? `Kategori #${cid}` })
		}
		const sid = filters.sub_category_id
		if (sid != null) {
			res.push({ id: `sub:${sid}`, label: subNameById(sid) ?? `Alt #${sid}` })
		}
		const bid = filters.brand_id
		if (bid != null) {
			const b = brandsLabelData.value?.data?.find((x) => x.id != null && Number(x.id) === Number(bid))
			res.push({ id: `brand:${bid}`, label: b?.name ?? `Marka #${bid}` })
		}
		const colorId = filters.color_id
		if (colorId != null) {
			const col = colorsLabelData.value?.data?.find((x) => x.id != null && Number(x.id) === Number(colorId))
			res.push({ id: `color:${colorId}`, label: col?.name ?? `Renk #${colorId}` })
		}
		for (const c of filters.categories ?? []) {
			res.push({ id: `cat:${c}`, label: featuredNameById(c) ?? `Kat #${c}` })
		}
		const sb = filters.sort_by
		if (sb) {
			res.push({ id: 'sort:by', label: SORT_FILTER_LABELS[sb] ?? sb })
		}
		return res
	})

	const clearFilters = () => {
		filters.main_category_id = null
		filters.category_id = null
		filters.sub_category_id = null
		filters.brand_id = null
		filters.color_id = null
		filters.sort_by = null
		filters.categories = []
		filters.offset = 0
	}

	const removeFilter = (id: string) => {
		if (id.startsWith('main:')) {
			filters.main_category_id = null
			return
		}
		if (id.startsWith('category:')) {
			filters.category_id = null
			return
		}
		if (id.startsWith('sub:')) {
			filters.sub_category_id = null
			return
		}
		if (id.startsWith('brand:')) {
			filters.brand_id = null
			return
		}
		if (id.startsWith('color:')) {
			filters.color_id = null
			return
		}
		if (id.startsWith('cat:')) {
			const v = id.slice('cat:'.length)
			filters.categories = (filters.categories ?? []).filter((c) => c !== Number(v))
			return
		}
		if (id === 'sort:by') {
			filters.sort_by = null
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

	watch(
		() => route.query,
		() => applyRouteQueryToState()
	)

	const buildQueryFromState = () => {
		const q: Record<string, string> = {}
		if (filters.main_category_id != null) q.main_category_id = String(filters.main_category_id)
		if (filters.category_id != null) q.category_id = String(filters.category_id)
		if (filters.sub_category_id != null) q.sub_category_id = String(filters.sub_category_id)
		if (filters.brand_id != null) q.brand_id = String(filters.brand_id)
		if (filters.color_id != null) q.color_id = String(filters.color_id)
		if (filters.sort_by) q.sort_by = filters.sort_by
		const validCats = (filters.categories ?? []).filter((c) => Number.isFinite(c) && c > 0)
		if (validCats.length) q.cat = validCats.join(',')
		const page = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1
		if (page > 1) q.page = String(page)
		return q
	}

	watch(
		() => ({ ...filters }),
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

	const toggleSubId = (id: number) => {
		const n = Number(id)
		if (!Number.isFinite(n)) return
		if (filters.sub_category_id != null && Number(filters.sub_category_id) === n) {
			filters.sub_category_id = null
			return
		}
		filters.sub_category_id = n

		let sub: SubCategory | undefined
		let featured: FeaturedCategory | undefined
		for (const f of featuredCategoriesAll.value) {
			const hit = f.subcategories?.find((s) => s.id != null && Number(s.id) === n)
			if (hit) {
				sub = hit
				featured = f
				break
			}
		}
		if (!sub) {
			sub = subCategories.value.find((s) => s.id != null && Number(s.id) === n)
			const cid = sub?.category_id
			if (cid != null) {
				featured = featuredCategoriesAll.value.find((f) => f.id != null && Number(f.id) === Number(cid))
			}
		}
		if (featured?.id != null) {
			filters.category_id = Number(featured.id)
			const mid = featured.main_category_id ?? featured.main_category?.id
			if (mid != null) filters.main_category_id = Number(mid)
			return
		}
		if (sub?.category_id != null) {
			const cid = Number(sub.category_id)
			filters.category_id = cid
			const f = featuredCategoriesAll.value.find((x) => x.id != null && Number(x.id) === cid)
			const mid = f?.main_category_id ?? f?.main_category?.id
			if (mid != null) filters.main_category_id = Number(mid)
		}
	}

	const toggleMainCategoryId = (id: number) => {
		const n = Number(id)
		if (!Number.isFinite(n)) return
		const mainMatches = filters.main_category_id != null && Number(filters.main_category_id) === n
		if (mainMatches) {
			/** İlk tık: alt filtreleri kaldır; yalnızca ana kategori seçili kalsın. */
			const hasNested = filters.category_id != null || filters.sub_category_id != null
			if (hasNested) {
				filters.category_id = null
				filters.sub_category_id = null
				return
			}
			filters.main_category_id = null
			return
		}
		filters.main_category_id = n
		filters.category_id = null
		filters.sub_category_id = null
	}

	const toggleCategoryId = (categoryId: number, mainCategoryId: number | null) => {
		const n = Number(categoryId)
		if (!Number.isFinite(n)) return
		if (filters.category_id != null && Number(filters.category_id) === n) {
			filters.category_id = null
			filters.sub_category_id = null
			return
		}
		filters.category_id = n
		filters.sub_category_id = null
		if (mainCategoryId != null && Number.isFinite(Number(mainCategoryId))) {
			filters.main_category_id = Number(mainCategoryId)
		}
	}

	const toggleBrandId = (id: number) => {
		const n = Number(id)
		if (!Number.isFinite(n)) return
		const cur = filters.brand_id
		filters.brand_id = cur != null && Number(cur) === n ? null : n
	}

	const toggleColorId = (id: number) => {
		const n = Number(id)
		if (!Number.isFinite(n)) return
		const cur = filters.color_id
		filters.color_id = cur != null && Number(cur) === n ? null : n
	}

	/** Mobil çekmece: seçim sonrası paneli kapat */
	const mobileDrawerAfterFilter = () => {
		closeFilters()
	}
	const mobileToggleMain = (id: number) => {
		toggleMainCategoryId(id)
		mobileDrawerAfterFilter()
	}
	const mobileToggleCategory = (categoryId: number, mainCategoryId: number | null) => {
		toggleCategoryId(categoryId, mainCategoryId)
		mobileDrawerAfterFilter()
	}
	const mobileToggleSub = (id: number) => {
		toggleSubId(id)
		mobileDrawerAfterFilter()
	}
	const mobileToggleColor = (id: number) => {
		toggleColorId(id)
		mobileDrawerAfterFilter()
	}
	const mobileToggleBrand = (id: number) => {
		toggleBrandId(id)
		mobileDrawerAfterFilter()
	}
	const mobileRemoveFilter = (id: string) => {
		removeFilter(id)
		mobileDrawerAfterFilter()
	}
	const mobileClearFilters = () => {
		clearFilters()
		mobileDrawerAfterFilter()
	}

	const isUploaderOpen = ref(false)
	/** Товар, с карточки которого открыли модал (delegate-uploader). */
	const uploaderProductId = ref<number | null>(null)

	const openUploader = (productId: number) => {
		uploaderProductId.value = productId
		isUploaderOpen.value = true
	}

	const closeUploader = () => {
		isUploaderOpen.value = false
		uploaderProductId.value = null
	}

	const designStore = useProductDesignStore()

	const uploaderProduct = computed(() => {
		const id = uploaderProductId.value
		if (id == null) return null
		return filteredProducts.value.find((p) => p.id === id) ?? null
	})

	const uploaderMaxImages = computed(() => {
		const n = uploaderProduct.value?.upload_image_count
		return typeof n === 'number' && n > 0 ? n : undefined
	})

	const goNext = async (payload: { images: TempDesignImage[] }) => {
		const id = uploaderProductId.value ?? filteredProducts.value[0]?.id
		if (id == null || !payload.images.length) return
		designStore.setSession(id, payload.images)
		closeUploader()
		await router.push(`/products/${id}`)
	}
</script>

<template>
	<main class="min-h-screen">
		<home-banner
			v-if="mainCategoryHeroBanners.length"
			:banners="mainCategoryHeroBanners"
			:breadcrumbs="breadcrumbs"
			:main-category="heroMainCategoryForBanner"
		/>

		<div class="bg-white">
			<div v-if="catalogHeading" class="mx-auto max-w-3xl px-4 py-6 md:py-8 text-center">
				<h1 class="text-3xl md:text-4xl lg:text-[40px] text-[#215EA5] font-bold leading-tight">
					{{ catalogHeading.title }}
				</h1>
				<p v-if="catalogHeading.description" class="mt-3 text-base md:text-lg text-[#4A5565] leading-relaxed">
					{{ catalogHeading.description }}
				</p>
			</div>
		</div>

		<catalog-filter
			:active-filters="activeFilters"
			:product-count="filteredProducts.length"
			:sort="filters.sort_by ?? 'default'"
			@update:sort="setCatalogSortFromUi"
			@remove="removeFilter"
			@clear="clearFilters"
			@open="openFilters"
		/>

		<!-- Uploader Modal -->
		<catalog-uploader-modal
			:is-open="isUploaderOpen"
			:max-images="uploaderMaxImages"
			@close="closeUploader"
			@go-next="goNext"
		/>

		<!-- Mobile drawer filters -->
		<Teleport to="body">
			<Transition name="catalog-filter-drawer">
				<div
					v-if="isFilterDrawerOpen"
					class="catalog-filter-drawer-root fixed inset-0 z-[70] md:hidden"
					@keydown.esc="closeFilters"
				>
					<button
						type="button"
						class="catalog-filter-drawer-backdrop absolute inset-0 bg-black/50"
						aria-label="Close filters"
						@click="closeFilters"
					/>

					<div
						class="catalog-filter-drawer-panel absolute inset-y-0 left-0 w-[90%] max-w-[400px] bg-white shadow-2xl flex flex-col"
						role="dialog"
						aria-modal="true"
					>
						<div class="flex-1 min-h-0 overflow-y-auto px-2 py-3">
							<catalog-sidebar-filter
								:filters="filters"
								:active-summary="activeFilters"
								@toggle-main-category="mobileToggleMain"
								@toggle-category="mobileToggleCategory"
								@toggle-sub="mobileToggleSub"
								@toggle-color="mobileToggleColor"
								@toggle-brand="mobileToggleBrand"
								@remove-filter="mobileRemoveFilter"
								@close="closeFilters"
								@clear="mobileClearFilters"
								@apply="applyAndCloseFilters"
							/>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<div class="max-w-[1400px] mx-auto px-4 md:px-0 py-10 md:py-9">
			<div class="flex flex-col md:flex-row gap-10">
				<!-- Desktop sidebar filters -->
				<Transition
					appear
					enter-active-class="transition-all duration-500 ease-out"
					enter-from-class="opacity-0 -translate-x-4"
					enter-to-class="opacity-100 translate-x-0"
				>
					<div class="hidden md:block w-[390px] shrink-0">
						<catalog-sidebar-filter
							:filters="filters"
							@toggle-main-category="toggleMainCategoryId"
							@toggle-category="toggleCategoryId"
							@toggle-sub="toggleSubId"
							@toggle-color="toggleColorId"
							@toggle-brand="toggleBrandId"
							@clear="clearFilters"
							@apply="applyAndCloseFilters"
						/>
					</div>
				</Transition>

				<div class="flex-1 min-w-0">
					<div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-x-6 md:gap-y-10">
						<cards-canvas-paintings-card
							v-for="product in filteredProducts"
							:key="product.id"
							:product="product"
							show-button
							delegate-uploader
							@open-uploader="openUploader"
						/>
					</div>
				</div>
			</div>
			<div v-if="catalogTotalPages > 1" class="flex items-center justify-center mt-10">
				<Pagination :page="catalogCurrentPage" :total-pages="catalogTotalPages" @update:page="setCatalogPage" />
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

	/* Mobil filtre çekmecesi: arka plan soluklaşır, panel soldan kayar */
	:global(.catalog-filter-drawer-enter-active),
	:global(.catalog-filter-drawer-leave-active) {
		transition: opacity 280ms ease;
	}

	:global(.catalog-filter-drawer-enter-active .catalog-filter-drawer-panel),
	:global(.catalog-filter-drawer-leave-active .catalog-filter-drawer-panel) {
		transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	:global(.catalog-filter-drawer-enter-from),
	:global(.catalog-filter-drawer-leave-to) {
		opacity: 0;
	}

	:global(.catalog-filter-drawer-enter-from .catalog-filter-drawer-panel),
	:global(.catalog-filter-drawer-leave-to .catalog-filter-drawer-panel) {
		transform: translateX(-100%);
	}
</style>
