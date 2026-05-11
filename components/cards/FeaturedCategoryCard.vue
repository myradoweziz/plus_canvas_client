<script setup lang="ts">
	import type { FeaturedCategory } from '~/utils/types'

	defineProps<{
		category: FeaturedCategory
	}>()
</script>

<template>
	<nuxt-link
		:to="`/catalog/${category.id}`"
		class="group relative block h-[280px] md:h-[340px] lg:h-[400px] rounded-[24px] overflow-hidden shadow-lg hover:shadow-2xl transition-all"
	>
		<img
			:src="category.image_url"
			:alt="category.name"
			class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-[#101828]/90 via-[#101828]/20 to-transparent"></div>
		<div class="absolute bottom-6 left-6 right-6">
			<h3 class="text-white text-lg md:text-xl lg:text-2xl font-bold tracking-wide">{{ category.name }}</h3>
			<div
				class="w-8 h-[2px] bg-white mt-4 opacity-80 group-hover:block transition-all duration-500 group-hover:w-16"
			></div>
		</div>
	</nuxt-link>
</template>

<style lang="scss" scoped></style>
