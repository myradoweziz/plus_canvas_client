<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import type { Product } from '~/utils/types'

	defineProps<{
		products: Product[]
	}>()

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
</script>

<template>
	<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24">
		<!-- Заголовок и навигация -->
		<div class="relative flex flex-col md:flex-row md:items-center justify-center mb-8 md:mb-12 gap-4">
			<h2 class="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#1853a0] text-center">
				Kişiye Özel Kanvas Tablolar
			</h2>

			<SwiperButtons
				prev-class="pers-prev"
				next-class="pers-next"
				:disabled-prev="isBeginning"
				:disabled-next="isEnd"
				class="hidden md:flex md:absolute md:right-0 items-center justify-end gap-2 md:gap-3"
			/>
		</div>

		<!-- Слайдер товаров -->
		<Swiper
			:modules="modules"
			:autoplay="{ delay: 3500, disableOnInteraction: false }"
			:speed="2000"
			:loop="false"
			@swiper="onSwiper"
			:navigation="{ prevEl: '.pers-prev', nextEl: '.pers-next' }"
			:slidesPerView="1.2"
			:spaceBetween="16"
			:breakpoints="{
				640: { slidesPerView: 2.2, spaceBetween: 20 },
				1024: { slidesPerView: 4, spaceBetween: 24 }
			}"
		>
			<SwiperSlide v-for="(product, index) in products" :key="index" class="h-auto">
				<cards-canvas-paintings-card :product="product" show-button />
			</SwiperSlide>
		</Swiper>
	</section>
</template>

<style lang="scss" scoped></style>
