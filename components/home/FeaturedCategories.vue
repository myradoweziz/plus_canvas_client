<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

	import type { FeaturedCategory } from '~/utils/types'

	const props = defineProps<{
		categories: FeaturedCategory[]
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
	<section class="relative bg-[#5aa4f0] w-full py-16 md:py-24 overflow-hidden">
		<!-- Декоративные плюсики на фоне -->
		<div class="absolute -left-0 -top-16 w-64 h-64 pointer-events-none text-white opacity-60">
			<Icon name="backgroundPlus" class="w-full h-full object-contain" />
		</div>
		<div
			class="absolute -right-[110px] top-34 w-[400px] h-[400px] transform -translate-y-1/2 pointer-events-none text-white opacity-60"
		>
			<Icon name="backgroundPlus2" class="w-full h-full object-contain" />
		</div>

		<div class="relative z-10 max-w-[1400px] mx-auto px-4 md:px-10">
			<!-- Заголовок и навигация -->
			<div class="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
				<div class="text-white relative z-20">
					<h2 class="text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight">Öne Çıkan Kategoriler</h2>
					<p class="mt-3 text-white/90 text-sm md:text-base">
						Popüler kategorilerimizden en beğenilen kanvas tablolarını keşfedin
					</p>
				</div>

				<!-- Кнопки слайдера -->
				<SwiperButtons
					v-if="categories.length > 4"
					prev-class="cat-prev"
					next-class="cat-next"
					:disabled-prev="isBeginning"
					:disabled-next="isEnd"
				/>
			</div>

			<!-- Свайпер Категорий -->
			<Swiper
				:modules="modules"
				:autoplay="{ delay: 4000, disableOnInteraction: false }"
				:speed="2000"
				:loop="false"
				@swiper="onSwiper"
				:navigation="{ prevEl: '.cat-prev', nextEl: '.cat-next' }"
				:slidesPerView="1.2"
				:spaceBetween="16"
				:breakpoints="{
					640: { slidesPerView: 2.2, spaceBetween: 20 },
					1024: { slidesPerView: 4, spaceBetween: 24 }
				}"
			>
				<SwiperSlide v-for="(category, index) in categories" :key="index" class="h-auto">
					<cards-featured-category-card :category="category" />
				</SwiperSlide>
			</Swiper>
		</div>
	</section>
</template>

<style lang="scss" scoped></style>
