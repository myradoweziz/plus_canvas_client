<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import type { BreadcrumbItem } from '~/utils/types'
	import Icon from '~/utils/ui/Icon.vue'

	import 'swiper/css'

	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'
	import 'swiper/css/thumbs'

	const route = useRoute()
	const catalogId = route.params.catalogId

	const productId = route.params.productId

	const breadcrumbs = [
		{ label: 'Kategoriler', link: '/catalog' },
		{ label: 'Ürünler', link: `/catalog/${catalogId}` },
		{ label: 'Ürün Detayı', link: `/catalog/${catalogId}/products/${productId}` }
	] as BreadcrumbItem[]

	const thumbsSwiper = ref<any>(null)
	const modules = [FreeMode, Navigation, Thumbs]

	const setThumbsSwiper = (swiper: any) => {
		thumbsSwiper.value = swiper
	}

	const prevEl = ref<HTMLElement | null>(null)
	const nextEl = ref<HTMLElement | null>(null)
</script>

<template>
	<div class="bg-[#F5F2ED]">
		<section class="max-w-[1400px] mx-auto px-4 md:px-0 py-10 md:py-9">
			<Breadcrumbs :items="breadcrumbs" />

			<div class="mt-20 flex gap-10">
				<div class="flex gap-5">
					<swiper
						@swiper="setThumbsSwiper"
						:slidesPerView="4"
						:spaceBetween="20"
						:freeMode="true"
						:watchSlidesProgress="true"
						:modules="modules"
						class="mySwiper h-[510px] w-[100px]"
						:style="{
							'--swiper-navigation-color': '#fff',
							'--swiper-pagination-color': '#fff'
						}"
						direction="vertical"
						:navigation="{ prevEl, nextEl }"
					>
						<swiper-slide><img src="https://swiperjs.com/demos/images/abstract-1.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-2.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-3.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-4.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-5.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-6.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-7.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-8.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-9.jpg" /></swiper-slide
						><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-10.jpg" /></swiper-slide>
					</swiper>

					<div class="relative">
						<!-- Custom navigation buttons: one top, one bottom -->
						<button ref="prevEl" type="button" class="navBtn absolute -left-24 -top-2 z-10">
							<Icon name="arrowRight" class="w-12 h-12 -rotate-90" />
						</button>
						<button ref="nextEl" type="button" class="navBtn absolute -left-24 bottom-0 z-10">
							<Icon name="arrowRight" class="w-12 h-12 rotate-90" />
						</button>

						<swiper
							:spaceBetween="10"
							:thumbs="{ swiper: thumbsSwiper }"
							:modules="modules"
							class="mySwiper2 max-w-3xl h-[580px]"
						>
							<swiper-slide><img src="https://swiperjs.com/demos/images/abstract-1.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-2.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-3.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-4.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-5.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-6.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-7.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-8.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-9.jpg" /></swiper-slide
							><swiper-slide><img src="https://swiperjs.com/demos/images/abstract-10.jpg" /></swiper-slide>
						</swiper>
					</div>
				</div>
				<div>
					<h1 class="font-semibold text-4xl">Çiçek Açan Badem Ağacı - Almond Blossom</h1>
					<div class="flex items-center gap-2 mt-3">
						<Icon name="star" class="w-6 h-6 text-yellow-300" />
						<span class="text-[#B3B3B3]"
							>4.8 •
							<span class="underline"> 22 Değerlendirme </span>
						</span>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<style lang="scss" scoped>
	.mySwiper {
		margin: auto 0;
		.swiper-slide {
			width: 100px;
			border-radius: 12px;
			overflow: hidden;
			opacity: 0.5;
			transition: all 0.3s ease;
			&:hover {
				opacity: 1;
			}

			img {
				width: 100%;
				height: 100%;
			}
		}
		.swiper-slide-thumb-active {
			opacity: 1;
		}
	}

	.mySwiper2 {
		margin: auto 0;

		.swiper-slide {
			border-radius: 20px;
			overflow: hidden;
			img {
				width: 100%;
				height: 100%;
			}
		}
	}

	.navBtn {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		background-color: transparent;
		user-select: none;
		cursor: pointer;

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
		&:hover {
			transform: translateY(-1px);
			color: #1853a0;
		}
		:deep(svg) {
			filter: drop-shadow(0 10px 20px rgba(16, 24, 40, 0.15));
		}
	}
</style>
