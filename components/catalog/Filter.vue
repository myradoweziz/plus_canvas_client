<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	type ActiveFilter = { id: string; label: string }

	const props = withDefaults(
		defineProps<{
			activeFilters: Array<string | ActiveFilter>
			productCount?: number
			sort?: string
		}>(),
		{
			productCount: 0,
			sort: 'default'
		}
	)

	const emit = defineEmits<{
		(e: 'update:sort', value: string): void
		(e: 'remove', id: string): void
		(e: 'clear'): void
		(e: 'open'): void
	}>()

	const normalizedActiveFilters = computed<ActiveFilter[]>(() =>
		props.activeFilters.map((f) => (typeof f === 'string' ? { id: f, label: f } : f))
	)

	const sortLocal = computed({
		get: () => props.sort ?? 'default',
		set: (v: string) => emit('update:sort', v)
	})
</script>

<template>
	<section class="bg-white shadow-lg p-4 md:p-6 border border-gray-100">
		<div class="max-w-[1400px] mx-auto">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-4 md:gap-8">
					<button
						type="button"
						class="flex md:hidden items-center justify-between md:justify-normal gap-2 bg-[#215EA5] text-white px-5 py-2.5 rounded-full text-sm md:text-base hover:bg-[#124080] transition-all"
						@click="emit('open')"
					>
						<Icon name="filter" class="w-4 h-4 md:w-5 md:h-5 text-white" />
						Filtrele
						<span
							class="bg-white text-[#1853a0] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
						>
							{{ normalizedActiveFilters.length }}
						</span>
					</button>

					<span class="text-[#4A5565] text-sm hidden sm:inline">{{ productCount }} ürün bulundu</span>
				</div>

				<div class="hidden md:flex items-center gap-2">
					<span class="text-[#4A5565] text-sm hidden md:inline">Sırala:</span>
					<div class="relative min-w-[140px] md:min-w-[180px]">
						<select
							class="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm md:text-base font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1853a0]/20"
							v-model="sortLocal"
						>
							<option value="default">Varsayılan</option>
							<option value="newest">En Yeniler</option>
							<option value="oldest">En Eskiler</option>
							<option value="price_asc">Düşük Fiyat</option>
							<option value="price_desc">Yüksek Fiyat</option>
						</select>
						<Icon
							name="arrowBottom"
							class="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"
						/>
					</div>
				</div>
			</div>

			<!-- Активные теги -->
			<div class="hidden md:flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
				<div v-if="normalizedActiveFilters.length" class="md:flex flex-wrap items-center">
					<span class="text-xs md:text-sm font-semibold text-[#4A5565] uppercase tracking-wider mr-2"
						>Aktif Filtreler:</span
					>
					<div class="flex items-center gap-3">
						<div
							v-for="filter in normalizedActiveFilters"
							:key="filter.id"
							class="bg-[#215EA5B2] text-white px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 border border-[#1853a0]/20 hover:bg-[#124080] cursor-pointer transition-all"
							@click="emit('remove', filter.id)"
						>
							{{ filter.label }}
							<Icon name="close" class="w-3 h-3 md:w-4 md:h-4" />
						</div>
					</div>
					<button class="text-[#4A5565] text-xs md:text-sm hover:underline ml-2" @click="emit('clear')">
						Tümünü Temizle
					</button>
				</div>
				<div v-else></div>

				<div v-if="false" class="hidden md:flex items-center gap-2">
					<span class="text-[#4A5565] text-sm hidden md:inline">Sırala:</span>
					<div class="relative min-w-[140px] md:min-w-[180px]">
						<select
							class="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-sm md:text-base font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1853a0]/20"
							v-model="sortLocal"
						>
							<option value="default">Varsayılan</option>
							<option value="newest">En Yeniler</option>
							<option value="oldest">En Eskiler</option>
							<option value="price_asc">Düşük Fiyat</option>
							<option value="price_desc">Yüksek Fiyat</option>
						</select>
						<Icon
							name="arrowBottom"
							class="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"
						/>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
