<script setup lang="ts">
	import { featuredCategories, mainCategories } from '~/utils/data/categories'
	import Icon from '~/utils/ui/Icon.vue'

	const props = defineProps<{
		selectedSubId: number | null
		selectedColor: string | null
	}>()

	const emit = defineEmits<{
		(e: 'toggleSub', id: number): void
		(e: 'toggleColor', color: string): void
		(e: 'clear'): void
		(e: 'apply'): void
	}>()

	const expandedMainIds = ref<number[]>([2]) // Default expanded main categories
	const activeFeaturedId = ref<number | null>(101) // Default active featured category
	const isRenkExpanded = ref(true)

	const toggleMain = (id: number) => {
		if (expandedMainIds.value.includes(id)) {
			expandedMainIds.value = expandedMainIds.value.filter((mId) => mId !== id)
		} else {
			expandedMainIds.value.push(id)
		}
	}

	const toggleFeatured = (id: number) => {
		activeFeaturedId.value = activeFeaturedId.value === id ? null : id
	}

	const colors = [
		{ name: 'white', value: '#FFFFFF', border: true },
		{ name: 'orange', value: '#FF8A00' },
		{ name: 'red', value: '#FF0000' },
		{ name: 'pink', value: '#FF00E5' },
		{ name: 'purple', value: '#9E00FF' },
		{ name: 'darkblue', value: '#0029FF' },
		{ name: 'cyan', value: '#00D1FF' },
		{ name: 'green', value: '#00FF1A' },
		{ name: 'yellow', value: '#F0FF00' },
		{ name: 'brown', value: '#8B4513' }
	]

	const popularTags = ['Modern', 'Minimalist', 'Doğa', 'Soyut', 'Geometrik', 'Renkli']

	// Helper to get featured categories for a main category
	const getFeaturedForMain = (mainId: number) => {
		return featuredCategories.filter((f) => f.main_category_id === mainId)
	}
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
				<button v-for="tag in popularTags" :key="tag" class="tag-pill">
					{{ tag }}
					<Icon name="filterPlus" class="w-4 h-4" />
				</button>
			</div>
		</div>

		<div class="mt-8 p-5 px-6 bg-slate-100">
			<div
				v-for="main in mainCategories"
				:key="main.id!"
				class="mb-4 bg-white rounded-2xl shadow-[0px_4px_15px_0px_#0000000F] overflow-hidden"
			>
				<div
					class="p-4 flex items-center gap-4 justify-between border-b border-gray-100 cursor-pointer select-none"
					@click="toggleMain(main.id!)"
				>
					<span class="font-black text-[15px] text-[#101828] uppercase tracking-wide">{{ main.name }}</span>
					<Icon
						name="arrowBottom"
						class="w-3.5 h-3.5 transition-transform duration-300 text-gray-400"
						:class="{ 'rotate-180': expandedMainIds.includes(main.id!) }"
					/>
				</div>

				<div v-if="expandedMainIds.includes(main.id!)" class="main-cat-content">
					<div v-for="featured in getFeaturedForMain(main.id!)" :key="featured.id!" class="featured-item">
						<div class="featured-header group cursor-pointer select-none" @click="toggleFeatured(featured.id!)">
							<Icon
								name="arrowRight"
								class="w-3 h-3 text-gray-400 group-hover:text-[#215EA5] transition-all duration-300"
								:class="{ 'rotate-90': activeFeaturedId === featured.id }"
							/>
							<span class="font-bold text-sm text-[#364153] group-hover:text-[#215EA5] transition-colors">{{
								featured.name
							}}</span>
							<span class="text-[11px] text-gray-400 font-medium ml-auto">(299)</span>
						</div>

						<ul v-if="activeFeaturedId === featured.id" class="sub-list">
							<li
								v-for="sub in featured.subcategories"
								:key="sub.id!"
								class="sub-item"
								:class="{ active: selectedSubId === sub.id }"
								@click="emit('toggleSub', sub.id!)"
							>
								{{ sub.name }}
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
							:key="color.name"
							class="color-swatch"
							:style="{ backgroundColor: color.value }"
							:class="{
								'border border-gray-200': color.border,
								active: selectedColor === color.name
							}"
							@click="emit('toggleColor', color.name)"
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
		@apply flex-1 bg-[#F3F4F6] text-[#4B5563] py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors;
	}

	.btn-apply {
		@apply flex-1 bg-[#2B7FFF] text-white py-2.5 rounded-full text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100;
	}

	.tag-pill {
		@apply flex items-center gap-1.5 bg-gray-50 text-[#374151] px-4 py-2 rounded-full text-[11px] font-bold border border-gray-100 hover:bg-white hover:border-[#2B7FFF] transition-all;
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
		@apply flex items-center gap-3 py-1 cursor-pointer;
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

		&.active {
			@apply ring-2 ring-offset-2 ring-[#2B7FFF] scale-110;
		}
	}

	.main-cat-block {
		@apply border-0;
	}
</style>
