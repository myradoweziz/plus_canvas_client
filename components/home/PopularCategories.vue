<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { FeaturedCategory } from '~/utils/types'

	defineProps<{
		categories: FeaturedCategory[]
	}>()
</script>

<template>
	<section class="relative bg-[#5aa4f0] w-full py-10 md:py-34 md:pb-60 overflow-hidden">
		<div
			class="absolute right-0 top-[260px] -translate-y-1/2 pointer-events-none z-0 origin-right scale-[70%] md:scale-100 lg:scale-110 opacity-50 md:opacity-100"
		>
			<Icon name="backgroundPopularCategories" class="relative z-10" />

			<div class="absolute -left-20 top-0 w-32 h-32 text-white opacity-40">
				<Icon name="backgroundPlus" class="w-full h-full object-contain" />
			</div>
			<div class="absolute -left-48 bottom-10 w-24 h-24 text-white opacity-30">
				<Icon name="backgroundPlus" class="w-full h-full object-contain" />
			</div>
			<div class="absolute left-10 -top-20 w-20 h-20 text-white opacity-25">
				<Icon name="backgroundPlus" class="w-full h-full object-contain" />
			</div>
			<div class="absolute -left-64 top-1/2 w-16 h-16 text-white opacity-20">
				<Icon name="backgroundPlus" class="w-full h-full object-contain" />
			</div>
		</div>

		<div class="relative z-10 max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col items-start w-full">
			<h2 class="text-3xl md:text-4xl lg:text-[40px] font-bold text-white leading-tight">En Çok Aranan Kategoriler</h2>
			<p class="mt-3 mb-8 md:mb-10 text-white/90 text-sm md:text-base font-medium">Popüler kategorilerimize göz atın</p>

			<div class="flex flex-wrap gap-3 md:gap-4 max-w-full md:max-w-2xl lg:max-w-4xl relative z-10 w-full">
				<nuxt-link
					v-for="(category, index) in categories"
					:key="index"
					:to="`/products?category_id=${category.id}`"
					class="bg-white hover:text-[#1853a0] hover:shadow-md px-6 py-2.5 md:px-7 md:py-3 rounded-full text-[13px] md:text-[15px] transition-all text-center"
				>
					{{ category.name }}
				</nuxt-link>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
