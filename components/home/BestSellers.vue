<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

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

	const products = [
		{ title: 'Düğün Anısı Kanvas Baskı', image: '/images/banner.png', oldPrice: 400, price: 379, discount: 31 },
		{ title: 'Düğün Anısı Kanvas Baskı', image: '/images/banner.png', oldPrice: 400, price: 379, discount: 31 },
		{ title: 'Düğün Anısı Kanvas Baskı', image: '/images/banner.png', oldPrice: 400, price: 379, discount: 31 },
		{ title: 'Düğün Anısı Kanvas Baskı', image: '/images/banner.png', oldPrice: 400, price: 379, discount: 31 },
		{ title: 'Düğün Anısı Kanvas Baskı', image: '/images/banner.png', oldPrice: 400, price: 379, discount: 31 }
	]
</script>

<template>
	<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24">
		<!-- Заголовок и навигация -->
		<div class="relative flex flex-col md:flex-row md:items-center justify-center mb-8 md:mb-12 gap-4">
			<h2 class="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#1853a0] text-center">En Çok Satanlar</h2>

			<SwiperButtons
				prev-class="best-prev"
				next-class="best-next"
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
			:navigation="{ prevEl: '.best-prev', nextEl: '.best-next' }"
			:slidesPerView="1.2"
			:spaceBetween="16"
			:breakpoints="{
				640: { slidesPerView: 2.2, spaceBetween: 20 },
				1024: { slidesPerView: 4, spaceBetween: 24 }
			}"
		>
			<SwiperSlide v-for="(product, index) in products" :key="index" class="h-auto">
				<div class="group flex flex-col h-full rounded-2xl">
					<!-- Картинка -->
					<div class="relative w-full rounded-2xl overflow-hidden bg-gray-100 aspect-square">
						<img
							:src="product.image"
							:alt="product.title"
							class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>

						<!-- Бейдж скидки -->
						<div
							class="absolute top-4 left-4 bg-[#1853a0] text-white text-[11px] md:text-[12px] font-bold px-2 py-1 rounded-md"
						>
							-{{ product.discount }}%
						</div>

						<!-- Кнопки действий -->
						<div class="absolute top-4 right-4 flex gap-2">
							<button
								class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
							>
								<Icon name="eye" class="w-4 h-4 md:w-5 md:h-5 text-[#1853a0]" />
							</button>
							<button
								class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
							>
								<Icon name="heart" class="w-4 h-4 md:w-5 md:h-5 text-[#1853a0]" />
							</button>
						</div>
					</div>

					<!-- Инфа -->
					<div class="flex flex-col flex-grow pt-4">
						<h3 class="text-[15px] md:text-[16px] font-semibold text-gray-900 leading-snug">
							{{ product.title }}
						</h3>
						<div class="flex items-center gap-2 mt-1.5 md:mt-2">
							<span class="text-sm md:text-[14px] font-medium text-gray-400 line-through">₺{{ product.oldPrice }}</span>
							<span class="text-lg md:text-[20px] font-bold text-gray-900">₺{{ product.price }}</span>
						</div>

						<!-- Кнопка -->
						<div class="mt-auto pt-4">
							<button
								class="w-full bg-[#1853a0] hover:bg-[#124080] text-white py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-[14px]"
							>
								<Icon name="basket" class="w-4 h-4 text-white" />
								Sepete ekle
							</button>
						</div>
					</div>
				</div>
			</SwiperSlide>
		</Swiper>
	</section>
</template>

<style lang="scss" scoped></style>
