<script setup lang="ts">
	import { Navigation, Autoplay } from 'swiper/modules'
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

	const discounts = [
		{
			title: 'İlk Siparişinize %25 Индirim',
			desc: 'Yeni müşterilerimize özel kampanya fırsatı',
			btnText: 'Hemen Al',
			bgColor: '#5aa4f0',
			textColor: '#1853a0',
			link: '/'
		},
		{
			title: '3 Al 2 Öde',
			desc: 'Seçili kanvas tablolarda geçerli kampanya',
			btnText: 'İncele',
			bgColor: '#f4ae0f',
			textColor: '#ca8804',
			link: '/'
		},
		{
			title: '3 Al 2 Öde',
			desc: 'Seçili kanvas tablolarda geçerli kampanya',
			btnText: 'İncele',
			bgColor: '#f4ae0f',
			textColor: '#ca8804',
			link: '/'
		}
	]
</script>

<template>
	<section class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24">
		<!-- Заголовок и навигация -->
		<div class="relative flex flex-col md:flex-row md:items-center justify-center mb-8 md:mb-12 gap-4">
			<h2 class="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#1a3355] text-center">İndirimler</h2>

			<SwiperButtons
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
			:loop="false"
			@swiper="onSwiper"
			:navigation="{ prevEl: '.dist-prev', nextEl: '.dist-next' }"
			:slidesPerView="1.1"
			:spaceBetween="16"
			:breakpoints="{
				768: { slidesPerView: 2, spaceBetween: 24 }
			}"
		>
			<SwiperSlide v-for="(item, index) in discounts" :key="index" class="h-auto">
				<div
					class="relative h-[280px] md:h-[320px] rounded-[32px] overflow-hidden p-8 md:p-12 flex flex-col items-center justify-center text-center text-white"
					:style="{ backgroundColor: item.bgColor }"
				>
					<!-- Фоновая иконка плюса -->
					<div class="absolute right-[-40px] top-[-40px] w-64 h-64 md:w-80 md:h-80 pointer-events-none">
						<Icon name="discountPlus" class="w-full h-full" />
					</div>

					<!-- Контент -->
					<div class="relative z-10 flex flex-col items-center">
						<div class="bg-[#FFFFFF33] p-2 mb-5 md:mb-6 rounded-xl flex justify-center items-center">
							<Icon name="discountPicked" class="w-8 h-8 md:w-9 md:h-9 text-white" />
						</div>

						<h3 class="text-2xl md:text-3xl lg:text-[34px] font-bold leading-tight mb-3">
							{{ item.title }}
						</h3>
						<p class="text-white/90 text-sm md:text-base font-medium mb-8">
							{{ item.desc }}
						</p>
						<nuxt-link
							:to="item.link"
							class="bg-white px-10 py-3 rounded-full font-bold transition-all hover:shadow-xl hover:-translate-y-0.5"
							:style="{ color: item.textColor }"
						>
							{{ item.btnText }}
						</nuxt-link>
					</div>
				</div>
			</SwiperSlide>
		</Swiper>
	</section>
</template>

<style lang="scss" scoped></style>
