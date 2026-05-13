<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

	import type { DisCount } from '~/utils/types'

	defineProps<{
		discounts: DisCount[]
	}>()

	const homeStore = useHomeStore()
	const mainCategoryId = homeStore.mainCategoryId

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
			<h2 class="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#1a3355] text-center">İndirimler</h2>

			<SwiperButtons
				v-if="discounts.length > 2"
				prev-class="dist-prev"
				next-class="dist-next"
				:disabled-prev="isBeginning"
				:disabled-next="isEnd"
				class="hidden md:flex md:absolute md:right-0 items-center justify-end gap-2 md:gap-3"
			/>
		</div>

		<!-- Слайдер товаров -->
		<Swiper
			:modules="modules"
			:autoplay="{ delay: 4500, disableOnInteraction: false }"
			:speed="2000"
			:loop="true"
			@swiper="onSwiper"
			:navigation="{ prevEl: '.dist-prev', nextEl: '.dist-next' }"
			:spaceBetween="16"
			:breakpoints="{
				768: { slidesPerView: 1.5 },
				1024: { slidesPerView: 2 }
			}"
			class="mySwiper"
		>
			<SwiperSlide v-for="(item, index) in discounts" :key="index">
				<nuxt-link
					:to="`/categories/${mainCategoryId}?discount=${item.id}`"
					class="relative rounded-3xl overflow-hidden min-h-[350px] text-white flex items-center justify-center"
				>
					<!-- Контент -->
					<div class="relative z-10 flex flex-col items-center">
						<div class="bg-[#FFFFFF33] p-2 mb-5 md:mb-6 rounded-xl flex justify-center items-center">
							<Icon name="discountPicked" class="w-8 h-8 md:w-9 md:h-9 text-white" />
						</div>

						<h3 class="text-2xl md:text-3xl lg:text-[34px] font-bold leading-tight mb-3">
							{{ item.title }}
						</h3>
						<p class="text-white/90 text-sm md:text-base font-medium mb-8">
							{{ item.description }}
						</p>
						<nuxt-link
							:to="`/categories/${mainCategoryId}?discount=${item.id}`"
							class="bg-white px-10 py-3 rounded-full font-bold transition-all hover:shadow-xl hover:-translate-y-0.5"
							:style="{ color: '#1853a0' }"
						>
							Hemen Al
						</nuxt-link>
					</div>
				</nuxt-link>
				<img :src="item.image_url" alt="discount" class="absolute top-0 left-0 w-full h-full object-cover" />
			</SwiperSlide>
		</Swiper>
	</section>
</template>

<style lang="scss" scoped></style>
