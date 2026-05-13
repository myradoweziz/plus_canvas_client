<script setup lang="ts">
	import { storeToRefs } from 'pinia'

	import Icon from '~/utils/ui/Icon.vue'

	import {
		CANVAS_PAINTING_CATEGORY_SLUG,
		PERSONALIZED_CANVAS_SLUG,
		type FeaturedCategory,
		type FilterBrand,
		type FilterColor,
		type MainCategory,
		type SubCategory
	} from '~/utils/types'

	type ColorsApiResponse = { data: FilterColor[] }
	type BrandsApiResponse = { data: FilterBrand[] }
	const props = withDefaults(
		defineProps<{
			selectedMainCategoryId?: number | null
			selectedCategoryId?: number | null
			selectedSubId: number | null
			selectedColorId?: number | null
			selectedBrandId?: number | null
		}>(),
		{
			selectedMainCategoryId: null,
			selectedCategoryId: null,
			selectedBrandId: null,
			selectedColorId: null
		}
	)

	const emit = defineEmits<{
		(e: 'toggleMainCategory', id: number): void
		(e: 'toggleCategory', categoryId: number, mainCategoryId: number | null): void
		(e: 'toggleSub', id: number): void
		(e: 'toggleColor', id: number): void
		(e: 'toggleBrand', id: number): void
		(e: 'clear'): void
		(e: 'apply'): void
	}>()

	const onToggleBrand = (brand: FilterBrand) => {
		const id = brand.id
		if (id == null) return
		emit('toggleBrand', Number(id))
	}

	const onToggleColor = (color: FilterColor) => {
		const id = color.id
		if (id == null) return
		emit('toggleColor', Number(id))
	}

	const isColorActive = (color: FilterColor) =>
		color.id != null &&
		props.selectedColorId != null &&
		Number(props.selectedColorId) === Number(color.id)

	const isBrandActive = (brand: FilterBrand) =>
		brand.id != null &&
		props.selectedBrandId != null &&
		Number(props.selectedBrandId) === Number(brand.id)

	const isMainCategoryFilterActive = (main: MainCategory) =>
		main.id != null &&
		props.selectedMainCategoryId != null &&
		Number(props.selectedMainCategoryId) === Number(main.id)

	const isFeaturedCategoryFilterActive = (featured: FeaturedCategory) =>
		featured.id != null &&
		props.selectedCategoryId != null &&
		Number(props.selectedCategoryId) === Number(featured.id)

	const onToggleMainCategoryFilter = (main: MainCategory) => {
		const id = main.id
		if (id == null) return
		emit('toggleMainCategory', Number(id))
	}

	const onToggleFeaturedCategoryFilter = (featured: FeaturedCategory, main: MainCategory) => {
		const fid = featured.id
		if (fid == null) return
		const mainIdRaw = featured.main_category_id ?? main.id
		const mainCategoryId = mainIdRaw != null && Number.isFinite(Number(mainIdRaw)) ? Number(mainIdRaw) : null
		emit('toggleCategory', Number(fid), mainCategoryId)
	}

	const homeStore = useHomeStore()
	const { mainCategories, featuredCategoriesAll, subCategories } = storeToRefs(homeStore)

	const MAIN_MENU_ORDER: Record<string, number> = {
		[PERSONALIZED_CANVAS_SLUG]: 0,
		[CANVAS_PAINTING_CATEGORY_SLUG]: 1
	}

	const visibleMainCategories = computed(() =>
		mainCategories.value
			.filter((m) => m.slug in MAIN_MENU_ORDER)
			.sort((a, b) => (MAIN_MENU_ORDER[a.slug] ?? 99) - (MAIN_MENU_ORDER[b.slug] ?? 99))
	)

	/** Stable section key: without it, expanded content never shows when API omits `main.id`. */
	const mainSectionKey = (main: MainCategory) => (main.id != null ? `id:${main.id}` : `slug:${main.slug}`)

	const expandedMainKeys = ref<string[]>([])
	const activeFeaturedId = ref<number | null>(null)
	const isRenkExpanded = ref(true)

	watch(
		visibleMainCategories,
		(mains) => {
			expandedMainKeys.value = mains.map(mainSectionKey)
		},
		{ immediate: true, deep: true }
	)

	const isMainExpanded = (main: MainCategory) => expandedMainKeys.value.includes(mainSectionKey(main))

	const toggleMainSectionExpand = (main: MainCategory) => {
		const key = mainSectionKey(main)
		if (expandedMainKeys.value.includes(key)) {
			expandedMainKeys.value = expandedMainKeys.value.filter((k) => k !== key)
		} else {
			expandedMainKeys.value.push(key)
		}
	}

	const toggleFeatured = (id: number | null) => {
		if (id == null) return
		activeFeaturedId.value = activeFeaturedId.value === id ? null : id
	}

	const config = useRuntimeConfig()
	const { data: colorData } = await useCustomFetch<ColorsApiResponse>('/api/colors', {
		baseURL: config.public.baseUrl,
		method: 'GET'
	})

	const colors = computed(() => colorData.value?.data ?? [])

	const { data: brandData } = await useCustomFetch<BrandsApiResponse>('/api/brands', {
		baseURL: config.public.baseUrl,
		method: 'GET'
	})

	const brands = computed(() => brandData.value?.data ?? [])

	const getFeaturedForMain = (main: MainCategory) => {
		const mid = main.id
		if (mid != null) {
			const n = Number(mid)
			return featuredCategoriesAll.value.filter((f) => {
				const fm = f.main_category_id ?? f.main_category?.id
				return fm != null && Number(fm) === n
			})
		}
		return featuredCategoriesAll.value.filter((f) => f.main_category?.slug === main.slug)
	}

	const subsForFeatured = (featured: FeaturedCategory) => {
		const nested = featured.subcategories
		if (nested?.length) return nested
		const fid = featured.id
		if (fid == null) return []
		const fn = Number(fid)
		return subCategories.value.filter((s) => s.category_id != null && Number(s.category_id) === fn)
	}

	const featuredProductCount = (featured: FeaturedCategory) => {
		const n = featured.products_count
		if (n != null && Number.isFinite(Number(n))) return Number(n)
		return subsForFeatured(featured).length
	}

	const subProductCount = (sub: SubCategory): number | null => {
		const n = sub.products_count
		if (n == null || !Number.isFinite(Number(n))) return null
		return Number(n)
	}

	/** Alt liste: ok işaretli veya bu featured seçiliyse veya altından bir sub seçiliyse. */
	const isFeaturedSubsVisible = (featured: FeaturedCategory) => {
		const fid = featured.id
		if (fid == null) return false
		const fn = Number(fid)
		if (activeFeaturedId.value != null && Number(activeFeaturedId.value) === fn) return true
		if (props.selectedCategoryId != null && Number(props.selectedCategoryId) === fn) return true
		const sid = props.selectedSubId
		if (sid == null) return false
		for (const s of subsForFeatured(featured)) {
			if (s.id != null && Number(s.id) === Number(sid)) return true
		}
		return false
	}

	onMounted(async () => {
		const need = !mainCategories.value.length || !featuredCategoriesAll.value.length || !subCategories.value.length
		if (!need) return
		await Promise.all([
			homeStore.fetchMainCategories(),
			homeStore.fetchFeaturedCategories(),
			homeStore.fetchSubCategories()
		])
	})
</script>

<template>
	<aside class="catalog-sidebar">
		<div class="sidebar-header">
			<span class="font-bold text-lg text-[#101828]">Filtreler</span>
			<div class="flex gap-3 mt-4">
				<button class="btn-clear" @click="emit('clear')">Temizle</button>
				<button class="btn-apply" @click="emit('apply')">Filtreleri Uygula</button>
			</div>
		</div>

		<div class="sidebar-section border-t border-gray-100 mt-6 pt-6 px-5">
			<h3 class="text-sm font-bold text-[#4A5565] mb-4">Popüler Etiketler</h3>
			<div class="flex flex-wrap gap-2">
				<button
					v-for="brand in brands"
					:key="brand.id ?? brand.slug"
					type="button"
					class="tag-pill"
					:class="{ active: isBrandActive(brand) }"
					:disabled="brand.id == null"
					@click="onToggleBrand(brand)"
				>
					{{ brand.name }}
					<Icon name="filterPlus" class="w-4 h-4" />
				</button>
			</div>
		</div>

		<div class="mt-8 p-5 px-6 bg-slate-50">
			<div
				v-for="main in visibleMainCategories"
				:key="main.id ?? main.slug"
				class="mb-4 bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] overflow-hidden transition-shadow"
				:class="{ 'ring-2 ring-[#215EA5]/40 ring-inset': isMainCategoryFilterActive(main) }"
			>
				<div class="p-4 flex items-center gap-3 justify-between border-b border-gray-100 select-none">
					<button
						type="button"
						class="font-black text-[15px] text-[#101828] uppercase tracking-wide text-left flex-1 min-w-0 hover:text-[#215EA5] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						:disabled="main.id == null"
						@click="onToggleMainCategoryFilter(main)"
					>
						{{ main.name }}
					</button>
					<button
						type="button"
						class="p-1.5 -mr-1 shrink-0 text-gray-400 hover:text-[#215EA5] transition-colors cursor-pointer"
						aria-label="Alt kategorileri aç/kapat"
						@click="toggleMainSectionExpand(main)"
					>
						<Icon
							name="arrowBottom"
							class="w-3.5 h-3.5 transition-transform duration-300"
							:class="{ 'rotate-180': isMainExpanded(main) }"
						/>
					</button>
				</div>

				<div v-if="isMainExpanded(main)" class="main-cat-content">
					<div v-for="featured in getFeaturedForMain(main)" :key="featured.id ?? featured.slug" class="featured-item">
						<div class="featured-header group select-none">
							<button
								type="button"
								class="p-1 -ml-1 shrink-0 text-gray-400 hover:text-[#215EA5] transition-all duration-300 cursor-pointer"
								aria-label="Alt kategorileri göster"
								@click.stop="toggleFeatured(featured.id)"
							>
								<Icon
									name="arrowRight"
									class="w-3 h-3 transition-transform duration-300"
									:class="{ 'rotate-90': isFeaturedSubsVisible(featured) }"
								/>
							</button>
							<button
								type="button"
								class="font-bold text-sm text-[#364153] group-hover:text-[#215EA5] transition-colors text-left flex-1 min-w-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-1"
								:class="{ 'text-[#215EA5] font-bold': isFeaturedCategoryFilterActive(featured) }"
								:disabled="featured.id == null"
								@click="onToggleFeaturedCategoryFilter(featured, main)"
							>
								{{ featured.name }}
							</button>
							<span class="text-[11px] text-gray-400 font-medium shrink-0 py-1 tabular-nums"
								>({{ featuredProductCount(featured) }})</span
							>
						</div>

						<ul v-if="isFeaturedSubsVisible(featured)" class="sub-list">
							<li
								v-for="sub in subsForFeatured(featured)"
								:key="sub.id ?? sub.slug"
								class="sub-item flex items-center justify-between gap-2 gap-x-3"
								:class="{ active: selectedSubId === sub.id }"
								@click="sub.id != null && emit('toggleSub', sub.id)"
							>
								<span class="min-w-0 truncate">{{ sub.name }}</span>
								<span
									v-if="subProductCount(sub) != null"
									class="text-[11px] text-gray-400 font-medium shrink-0 tabular-nums"
									>({{ subProductCount(sub) }})</span
								>
							</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Color Filter Box -->
			<div class="bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] overflow-hidden">
				<div
					class="p-4 flex items-center gap-4 justify-between border-b border-gray-100 cursor-pointer select-none"
					@click="isRenkExpanded = !isRenkExpanded"
				>
					<span class="font-black text-[15px] text-[#101828] uppercase tracking-wide">Renk</span>
					<Icon
						name="arrowBottom"
						class="w-3.5 h-3.5 transition-transform duration-300 text-gray-400"
						:class="{ 'rotate-180': isRenkExpanded }"
					/>
				</div>

				<div v-if="isRenkExpanded" class="p-6">
					<div class="flex flex-wrap gap-3">
						<button
							v-for="color in colors"
							:key="color.id ?? color.name"
							type="button"
							class="color-swatch"
							:style="{ backgroundColor: color.hex_code }"
							:class="{
								'border border-gray-200': color.is_active,
								active: isColorActive(color)
							}"
							:disabled="color.id == null"
							@click="onToggleColor(color)"
							:title="color.name"
						></button>
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>

<style lang="scss" scoped>
	.catalog-sidebar {
		@apply bg-white rounded-[32px] shadow-[0_10px_60px_rgba(0,0,0,0.08)] overflow-hidden w-full border border-gray-50;
	}

	.sidebar-header {
		@apply p-6 pb-0;
	}

	.btn-clear {
		@apply flex-1 bg-[#F3F4F6] text-[#4B5563] py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors;
	}

	.btn-apply {
		@apply flex-1 bg-[#2B7FFF] text-white py-2.5 rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100;
	}

	.tag-pill {
		@apply flex items-center gap-1.5 bg-gray-50 text-[#374151] px-4 py-2 rounded-full text-sm font-semibold border border-gray-100 hover:bg-white hover:border-[#2B7FFF] transition-all;

		&:disabled {
			@apply opacity-50 cursor-not-allowed hover:border-gray-100 hover:bg-gray-50;
		}

		&.active {
			@apply bg-white border-[#2B7FFF] text-[#215EA5] ring-1 ring-[#2B7FFF]/30;
		}
	}

	.main-cat-header {
		@apply flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50/50 rounded-2xl transition-all select-none mx-2;
	}

	.main-cat-content {
		@apply bg-white py-2;
	}

	.featured-item {
		@apply px-4 py-2;
	}

	.featured-header {
		@apply flex items-center gap-2 py-1;
	}

	.sub-list {
		@apply flex flex-col gap-1.5 mt-2 ml-6 mb-4;
	}

	.sub-item {
		@apply text-[13px] text-gray-400 hover:text-[#215EA5] cursor-pointer transition-colors py-0.5;

		&.active {
			@apply text-[#215EA5] font-bold;
		}
	}

	.color-swatch {
		@apply w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-125 relative shadow-sm;

		&:disabled {
			@apply opacity-40 cursor-not-allowed hover:scale-100;
		}

		&.active {
			@apply ring-2 ring-offset-2 ring-[#2B7FFF] scale-110;
		}
	}

	.main-cat-block {
		@apply border-0;
	}
</style>
