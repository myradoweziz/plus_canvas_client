<script setup lang="ts">
	import { Autoplay, Navigation, Pagination } from 'swiper/modules'
	import Icon from '~/utils/ui/Icon.vue'

	import type { BreadcrumbItem } from '~/utils/types'

	defineProps<{
		pending?: boolean
		breadcrumbs?: BreadcrumbItem[]
	}>()

	const modules = [Pagination, Navigation, Autoplay]
</script>

<template>
	<skeletons-banner v-if="pending" />

	<Swiper
		v-else
		:modules="modules"
		:autoplay="{ delay: 2500, disableOnInteraction: false }"
		:speed="2000"
		:pagination="{ clickable: true }"
		:navigation="{ prevEl: '.swiper-btn-prev', nextEl: '.swiper-btn-next' }"
		:loop="true"
	>
		<SwiperSlide v-for="i in 3" :key="i">
			<div class="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px]">
				<!-- Главная ссылка (фон и основная область) -->
				<nuxt-link to="/" class="absolute inset-0 block">
					<img src="/images/banner.png" alt="banner" class="w-full h-full object-cover object-center" />
					<div class="absolute inset-0 bg-black/40"></div>
				</nuxt-link>

				<!-- Контент (над ссылкой) -->
				<div
					class="relative z-10 w-full h-full max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col justify-center pointer-events-none"
				>
					<!-- Breadcrumbs -->
					<div v-if="breadcrumbs?.length" class="absolute top-6 md:top-10 left-4 md:left-10 pointer-events-auto">
						<Breadcrumbs :items="breadcrumbs" white />
					</div>

					<!-- Главный заголовок и кнопка слева -->
					<div class="max-w-[450px] lg:max-w-[500px] text-white pointer-events-auto">
						<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
							Fotoğrafını saniyeler içinde kanvasa dönüştür
						</h1>
						<p class="mt-4 text-sm md:text-base text-gray-200">Anılarınızı kalite kanvas tablolara dönüştürün</p>
						<button
							class="mt-6 lg:mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold transition-colors shadow-lg"
						>
							Fotoğrafını yükle
						</button>
					</div>

					<!-- Маленький элемент снизу справа -->
					<nuxt-link
						to="/"
						class="hidden md:flex absolute right-4 md:right-[-200px] bottom-8 lg:bottom-12 bg-white rounded-2xl p-3 shadow-2xl items-center gap-4 w-[360px] lg:w-[400px] cursor-pointer hover:-translate-y-1 transition-all pointer-events-auto"
					>
						<img
							src="/images/banner.png"
							alt="Almond blossom"
							class="w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover shrink-0"
						/>
						<div class="flex flex-col">
							<span class="text-sm font-bold text-gray-800 leading-tight">Çiçek Açan Badem Ağacı - Almond Blossom</span>
							<span class="text-xs text-gray-500 mt-1 line-clamp-2"
								>Starry Night, Vincent van Gogh tarafından 1889 yılında yapılmış ve sanat tarihinin e...</span
							>
							<span class="text-blue-600 text-xs font-bold mt-1 lg:mt-2">satın al &gt;</span>
						</div>
					</nuxt-link>
				</div>
			</div>
		</SwiperSlide>

		<template #container-end>
			<button
				class="hidden md:block swiper-btn-prev absolute top-1/2 left-4 md:left-10 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
			>
				<Icon name="swiperArrow" class="rotate-180" />
			</button>
			<button
				class="hidden md:block swiper-btn-next absolute top-1/2 right-4 md:right-10 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
			>
				<Icon name="swiperArrow" />
			</button>
		</template>
	</Swiper>
</template>

<style scoped>
	:deep(.swiper-pagination-bullet) {
		background: #ffffff33;
		transition: all ease 0.3s;
	}

	:deep(.swiper-pagination-bullet-active) {
		background: #ffff;
		width: 32px;
		height: 8px;
		border-radius: 33554400px;
	}
</style>
