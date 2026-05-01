<script setup lang="ts">
	import { Autoplay, Navigation } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'
	import Pagination from '~/utils/ui/Pagination.vue'

	const route = useRoute()
	const catalogId = route.params.catalogId

	const breadcrumbs = [
		{ label: 'Anasayfa', link: '/' },
		{ label: 'Katalog', link: '/catalog' },
		{ label: catalogId as string }
	]

	const activeFilters = ['Anneler İçin Hediye Tablo...', 'Doğa Manzaralı Tablo...']

	const products = [
		{ title: 'Renkli Soyut Kanvas Tablo', image: '/images/banner.png', oldPrice: 549, price: 379, discount: 31 },
		{ title: 'Doğa Manzara Kanvas Tablo', image: '/images/banner.png', oldPrice: 599, price: 419, discount: 30 },
		{ title: 'Geometrik Soyut Kanvas', image: '/images/banner.png', oldPrice: 439, price: 339, discount: 22 },
		{ title: 'Modern Salon Kanvas Tablo Seti', image: '/images/banner.png', oldPrice: 799, price: 549, discount: 31 },
		{ title: 'Renkli Soyut Kanvas Tablo', image: '/images/banner.png', oldPrice: 549, price: 379, discount: 31 },
		{ title: 'Doğa Manzarası Kanvas', image: '/images/banner.png', oldPrice: 599, price: 419, discount: 30 },
		{ title: 'Geometrik Soyut Kanvas', image: '/images/banner.png', oldPrice: 499, price: 339, discount: 32 },
		{ title: 'Modern Salon Kanvas Tablo Seti', image: '/images/banner.png', oldPrice: 799, price: 549, discount: 31 }
	]

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

	const categories = [
		{ title: 'Manzara Tabloları', image: '/images/banner.png' },
		{ title: 'Manzara Tabloları', image: '/images/banner.png' },
		{ title: 'Manzara Tabloları', image: '/images/banner.png' },
		{ title: 'Manzara Tabloları', image: '/images/banner.png' },
		{ title: 'Manzara Tabloları', image: '/images/banner.png' }
	]
</script>

<template>
	<main class="min-h-screen overflow-hidden">
		<home-banner :breadcrumbs="breadcrumbs" />

		<catalog-filter :active-filters="activeFilters" />

		<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-9">
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
				<cards-canvas-paintings-card v-for="(product, index) in products" :key="index" :product="product" show-button />
			</div>

			<Pagination />
		</div>

		<section class="bg-white relative">
			<h1 class="pt-6 text-3xl md:text-4xl lg:text-[40px] text-[#215EA5] text-center font-bold leading-tight">
				İlgili Kategoriler
			</h1>

			<div class="z-10 max-w-[1400px] mx-auto px-4 md:px-10 pt-6 pb-10">
				<Swiper
					:modules="modules"
					:autoplay="{ delay: 4000, disableOnInteraction: false }"
					:speed="2000"
					:loop="true"
					@swiper="onSwiper"
					:navigation="{ prevEl: '.cat-prev', nextEl: '.cat-next' }"
					:slidesPerView="1.2"
					:spaceBetween="16"
					:breakpoints="{
						640: { slidesPerView: 2.2, spaceBetween: 20 },
						1024: { slidesPerView: 4, spaceBetween: 24 }
					}"
					class="!overflow-x-visible"
				>
					<SwiperSlide v-for="(category, index) in categories" :key="index" class="h-auto">
						<cards-featured-category-card :category="category" />
					</SwiperSlide>
				</Swiper>

				<button
					class="hidden md:flex items-center justify-center bg-[#a09f9fcc] rounded-full cat-prev absolute top-1/2 left-4 md:left-10 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
				>
					<Icon name="swiperArrow" class="rotate-180" />
				</button>
				<button
					class="hidden md:flex items-center justify-center bg-[#a09f9fcc] rounded-full cat-next absolute top-1/2 right-0 z-10 -translate-y-1/2 cursor-pointer text-white hover:opacity-80 transition-opacity"
				>
					<Icon name="swiperArrow" />
				</button>
			</div>
		</section>

		<home-custom-text />
		<home-frequently-asked-questions />
	</main>
</template>

<style lang="scss" scoped>
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}
</style>
