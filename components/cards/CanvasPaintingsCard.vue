<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	interface Product {
		title: string
		image: string
		oldPrice: number
		price: number
		discount?: number
	}

	defineProps<{
		product: Product
		showButton?: boolean
	}>()
</script>

<template>
	<div class="group flex flex-col h-full rounded-2xl">
		<!-- Картинка -->
		<div class="relative w-full rounded-2xl overflow-hidden bg-gray-100 aspect-[4/5]">
			<nuxt-link to="/">
				<img
					:src="product.image"
					:alt="product.title"
					class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
			</nuxt-link>

			<!-- Бейдж скидки -->
			<div
				v-if="product.discount || product.oldPrice > product.price"
				class="absolute top-4 left-4 bg-[#5aa4f0] text-white text-[11px] md:text-[12px] font-bold px-2 py-1 rounded-md z-10"
			>
				-{{ product.discount || Math.round((1 - product.price / product.oldPrice) * 100) }}%
			</div>

			<!-- Кнопки действий -->
			<div class="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				<button
					class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-[#1853a0] hover:text-white transition-all text-[#1853a0]"
				>
					<Icon name="eye" class="w-4 h-4 md:w-5 md:h-5" />
				</button>
				<button
					class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-all text-[#1853a0]"
				>
					<Icon name="heart" class="w-4 h-4 md:w-5 md:h-5" />
				</button>
			</div>
		</div>

		<!-- Инфа -->
		<div class="flex flex-col flex-grow pt-4">
			<nuxt-link to="/">
				<h3 class="text-[15px] md:text-[16px] font-semibold text-gray-900 leading-snug hover:text-[#1853a0] transition-colors">
					{{ product.title }}
				</h3>
			</nuxt-link>
			<div class="flex items-center gap-2 mt-1.5 md:mt-2">
				<span class="text-sm md:text-[14px] font-medium text-gray-400 line-through">₺{{ product.oldPrice }}</span>
				<span class="text-lg md:text-[18px] font-bold text-[#1853a0]">₺{{ product.price }}</span>
			</div>

			<!-- Кнопка -->
			<div v-if="showButton" class="mt-auto pt-4">
				<button
					class="w-full bg-[#5aa4f0] hover:bg-[#1853a0] text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-[14px] shadow-sm hover:shadow-md"
				>
					<Icon name="basket" class="w-4 h-4 text-white" />
					Sepete Ekle
				</button>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped></style>
