<script setup lang="ts">
	import { storeToRefs } from 'pinia'

	import Icon from '~/utils/ui/Icon.vue'

	import {
		CANVAS_PAINTING_CATEGORY_SLUG,
		PERSONALIZED_CANVAS_PAINTINGS_CATEGORY,
		PERSONALIZED_CANVAS_SLUG,
		type FeaturedCategory,
		type MainCategory,
		type SubCategory
	} from '~/utils/types'

	/** Только эти два пункта в сайдбаре меню (порядок: сначала kişiye özel, потом galeri). */
	const MAIN_MENU_ORDER: Record<string, number> = {
		[PERSONALIZED_CANVAS_SLUG]: 0,
		[CANVAS_PAINTING_CATEGORY_SLUG]: 1
	}

	const homeStore = useHomeStore()
	const { mainCategories, featuredCategoriesAll, subCategories } = storeToRefs(homeStore)

	const visibleMainCategories = computed(() =>
		mainCategories.value
			.filter((m) => m.slug in MAIN_MENU_ORDER)
			.sort((a, b) => (MAIN_MENU_ORDER[a.slug] ?? 99) - (MAIN_MENU_ORDER[b.slug] ?? 99))
	)

	const activeMainId = ref<number | null>(null)

	watch(
		visibleMainCategories,
		(mains) => {
			if (!mains.length) {
				activeMainId.value = null
				return
			}
			const stillValid = mains.some((c) => c.id === activeMainId.value)
			if (activeMainId.value == null || !stillValid) {
				activeMainId.value = mains[0]?.id ?? null
			}
		},
		{ immediate: true, deep: true }
	)

	const activeMain = computed<MainCategory | null>(() => {
		const mains = visibleMainCategories.value
		if (!mains.length) return null
		return mains.find((c) => c.id === activeMainId.value) ?? mains[0] ?? null
	})

	const featuredForActiveMain = computed(() => {
		const mainId = activeMainId.value
		if (mainId == null) return [] as FeaturedCategory[]
		const n = Number(mainId)
		return featuredCategoriesAll.value.filter((f) => {
			const fm = f.main_category_id ?? f.main_category?.id
			return fm != null && Number(fm) === n
		})
	})

	const activeFeaturedGroups = computed(() => {
		const groups: Record<string, FeaturedCategory[]> = {}
		for (const f of featuredForActiveMain.value) {
			if (!groups[f.category_type]) groups[f.category_type] = []
			groups[f.category_type].push(f)
		}
		return groups
	})

	const mainCategoryIcon = (main: MainCategory) =>
		main.category_type === PERSONALIZED_CANVAS_PAINTINGS_CATEGORY ? 'palette' : 'landscape'

	const setActiveMain = (id: number | null) => {
		activeMainId.value = id
	}

	const mainExploreHref = computed(() => {
		const m = activeMain.value
		if (!m) return '/products'
		return productsHrefForMain(m)
	})

	/** Ссылка на каталог с фильтром по главной категории (без `main_category_id=null` в URL). */
	const productsHrefForMain = (main: MainCategory) => {
		if (main.id != null) return `/products?main_category_id=${main.id}`
		return '/products'
	}

	/** Сначала вложенные с API; если пусто — плоский список из `homeStore.subCategories`. */
	const subsForFeatured = (featured: FeaturedCategory): SubCategory[] => {
		const nested = featured.subcategories
		if (nested?.length) return nested
		const fid = featured.id
		if (fid == null) return []
		const fn = Number(fid)
		return subCategories.value.filter((s) => s.category_id != null && Number(s.category_id) === fn)
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
	<div class="category-menu-container">
		<div class="category-menu-wrapper">
			<!-- Sidebar for Main Categories -->
			<div class="category-sidebar">
				<nuxt-link
					v-for="main in visibleMainCategories"
					:key="main.id ?? main.slug"
					:to="productsHrefForMain(main)"
					class="category-item"
					:class="{ active: activeMainId === main.id }"
					@mouseenter="setActiveMain(main.id)"
				>
					<div class="flex items-center gap-3">
						<Icon :name="mainCategoryIcon(main)" class="w-5 h-5 opacity-70" />
						<span class="font-bold text-sm uppercase tracking-tight">{{ main.name }}</span>
					</div>
					<Icon
						name="arrowRight"
						class="w-4 h-4 opacity-40 transition-transform duration-300 group-hover:translate-x-1"
					/>
				</nuxt-link>
			</div>

			<!-- Main Content Area for Featured & Subcategories -->
			<div class="category-content">
				<div class="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
					<p v-if="!Object.keys(activeFeaturedGroups).length && activeMain" class="text-sm text-gray-500">
						Bu kategori için alt kategori bulunamadı.
					</p>
					<div v-for="(group, type) in activeFeaturedGroups" :key="type" class="mb-10 flex-1">
						<p class="text-xs font-bold uppercase tracking-wider text-[#215EA5] mb-4">{{ type }}</p>
						<div class="grid grid-cols-2 gap-x-12 gap-y-10">
							<div v-for="featured in group" :key="featured.id ?? featured.slug" class="featured-block">
								<nuxt-link
									:to="featured.id != null ? `/products?category_id=${featured.id}` : '#'"
									class="text-lg font-bold text-[#101828] mb-4 block hover:text-[#215EA5] transition-colors"
								>
									{{ featured.name }}
								</nuxt-link>

								<div class="flex flex-col gap-2">
									<nuxt-link
										v-for="(sub, idx) in subsForFeatured(featured)"
										:key="sub.id ?? `${featured.id}-${idx}`"
										:to="
											featured.id != null && sub.id != null
												? `/products?category_id=${featured.id}&sub_category_id=${sub.id}`
												: '#'
										"
										class="subcategory-link"
										:style="{ animationDelay: `${idx * 50}ms` }"
									>
										{{ sub.name }}
									</nuxt-link>
								</div>
							</div>
						</div>
					</div>

					<!-- Featured Banner in Menu -->
					<nuxt-link
						v-if="activeMain?.images?.length"
						:to="mainExploreHref"
						class="mt-8 rounded-3xl overflow-hidden relative group cursor-pointer h-44 shadow-lg block"
					>
						<img
							:src="activeMain.images[0]?.url"
							:alt="activeMain.name"
							class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-r from-[#215EA5]/80 to-transparent flex flex-col justify-center px-10 text-white"
						>
							<span class="text-xs font-bold uppercase tracking-widest mb-2 opacity-90">Öne Çıkan Fırsat</span>
							<h4 class="text-2xl font-black mb-3 leading-tight">{{ activeMain.name }}</h4>
							<span
								class="inline-flex items-center gap-2 bg-white text-[#215EA5] px-5 py-2 rounded-full text-sm font-bold transition-all group-hover:bg-[#215EA5] group-hover:text-white"
							>
								Hemen İncele
								<Icon name="arrowRight" class="w-4 h-4" />
							</span>
						</div>
					</nuxt-link>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.category-menu-container {
		@apply absolute top-full left-0 right-0 pt-4 z-50 pointer-events-auto;
		width: 1000px;
		left: 50%;
		transform: translateX(-50%);
	}

	.category-menu-wrapper {
		@apply bg-white/95 rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.2)] flex overflow-hidden border border-white/20;
		min-height: 580px;
		max-height: 700px;
		backdrop-filter: blur(30px);
	}

	.category-sidebar {
		@apply w-[300px] bg-gray-50/80 border-r border-gray-100 py-10;
	}

	.category-item {
		@apply flex items-center justify-between px-8 py-5 cursor-pointer transition-all duration-300 border-l-[6px] border-transparent;
		@apply text-gray-500 hover:text-[#215EA5] hover:bg-white;

		&.active {
			@apply bg-white text-[#215EA5] border-[#215EA5] shadow-[10px_0_20px_rgba(0,0,0,0.02)];
		}
	}

	.category-content {
		@apply flex-1 bg-white;
	}

	.subcategory-link {
		@apply text-gray-500 hover:text-[#215EA5] text-[14px] font-semibold transition-all duration-300;
		@apply flex items-center gap-2 hover:translate-x-2;
		animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		opacity: 0;

		&::before {
			content: '';
			@apply w-1.5 h-1.5 rounded-full bg-gray-200 transition-all duration-300;
		}

		&:hover::before {
			@apply bg-[#215EA5] scale-125;
		}
	}

	.custom-scrollbar {
		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-track {
			@apply bg-transparent;
		}
		&::-webkit-scrollbar-thumb {
			@apply bg-gray-100 rounded-full hover:bg-gray-200 transition-colors;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-15px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
