<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import type { BreadcrumbItem, ProductDesignPayload } from '~/utils/types'
	import Icon from '~/utils/ui/Icon.vue'

	import 'swiper/css'

	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'
	import 'swiper/css/thumbs'

	const route = useRoute()

	const productId = route.params.productId

	const breadcrumbs = [
		{ label: 'Kategoriler', link: '/products' },
		{ label: 'Ürünler', link: `/products` },
		{ label: 'Ürün Detayı', link: `/products/${productId}` }
	] as BreadcrumbItem[]

	const thumbsSwiper = ref<any>(null)
	const modules = [FreeMode, Navigation, Thumbs]

	const setThumbsSwiper = (swiper: any) => {
		thumbsSwiper.value = swiper
	}

	const prevEl = ref<HTMLElement | null>(null)
	const nextEl = ref<HTMLElement | null>(null)
	const prevEl3 = ref<HTMLElement | null>(null)
	const nextEl3 = ref<HTMLElement | null>(null)

	const lastDesign = ref<ProductDesignPayload | null>(null)
	const onDesignUpdate = (payload: ProductDesignPayload) => {
		lastDesign.value = payload
	}

	const designObjectCount = (d: ProductDesignPayload) => {
		const o = d.fabric.objects
		return Array.isArray(o) ? o.length : 0
	}
</script>

<template>
	<div class="bg-[#F5F2ED]">
		<section class="max-w-[1400px] mx-auto px-4 md:px-0 py-10 md:py-9">
			<Breadcrumbs :items="breadcrumbs" />

			<div class="mt-20 flex gap-10">
				<div>
					<div class="flex gap-5">
						<section class="relative h-[510px] w-[100px]">
							<swiper
								@swiper="setThumbsSwiper"
								:slidesPerView="4"
								:spaceBetween="20"
								:freeMode="true"
								:watchSlidesProgress="true"
								:modules="modules"
								class="mySwiper w-full h-full"
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

							<!-- Custom navigation buttons: one top, one bottom -->
							<button ref="prevEl" type="button" class="navBtn absolute left-1/4 top-0 z-10">
								<Icon name="arrowRight" class="w-12 h-12 -rotate-90" />
							</button>
							<button ref="nextEl" type="button" class="navBtn absolute left-1/4 -bottom-15 z-10">
								<Icon name="arrowRight" class="w-12 h-12 rotate-90" />
							</button>
						</section>

						<section>
							<swiper
								:spaceBetween="10"
								:thumbs="{ swiper: thumbsSwiper }"
								:modules="modules"
								class="mySwiper2 max-w-3xl h-[600px]"
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
								<swiper
									:slidesPerView="6"
									:spaceBetween="20"
									:modules="modules"
									class="mySwiper3 w-[680px]"
									:navigation="{ prevEl: prevEl3, nextEl: nextEl3 }"
								>
									<swiper-slide v-for="value in 10" :key="value" class="flex flex-col items-center justify-center pb-4">
										<div class="relative pt-[100%] w-full">
											<img
												src="/images/banner.png"
												alt="cerceve"
												class="w-full h-full absolute top-0 left-0 object-cover"
											/>
										</div>

										<p class="text-sm text-[#364153] px-4 pt-4">Dikey</p>
									</swiper-slide>
								</swiper>

								<button ref="prevEl3" type="button" class="navBtn absolute left-0 bottom-10 z-10">
									<Icon name="arrowRight" class="w-12 h-12 -rotate-180" />
								</button>
								<button ref="nextEl3" type="button" class="navBtn absolute right-0 bottom-10 z-10">
									<Icon name="arrowRight" class="w-12 h-12 -rotate-360" />
								</button>
							</div>
							<div class="bg-[#155DFC1A] mt-6 flex items-center justify-center gap-2 p-8 rounded-md text-[#155DFC]">
								<Icon name="car" />
								<span class="font-bold">Tahmini Teslimat:</span> Şimdi sipariş verin — 21 Mayısa kapınızda!
							</div>
						</section>
					</div>

					<section class="flex items-center justify-between mt-6">
						<button
							v-for="(value, index) in ['Açıklama', 'Sıkça Sorulan Sorular', 'Ürün Özellikleri']"
							:key="index"
							:class="[
								'font-medium border-b-2 transition-all w-full hover:border-[#2B7FFF] hover:text-[#2B7FFF]',
								`${index === 0 ? 'border-[#2B7FFF] text-[#2B7FFF]' : 'border-[#B3B3B3] text-[#B3B3B3]'}`
							]"
						>
							{{ value }}
						</button>
					</section>
					<div class="mt-6 text-[#313131] text-left">
						Starry Night, Vincent van Gogh tarafından 1889 yılında yapılmış ve sanat tarihinin en ikonik tablolarından
						biri olarak kabul edilmiştir. Dalgamsı fırça darbeleri, dramatik gökyüzü ve yoğun renk kontrastlarıyla Van
						Gogh’un duygusal dünyasını yansıtır. Bu eşsiz eser, PlusCanvas kalitesiyle kanvas tablo olarak yeniden hayat
						bulur
					</div>
				</div>

				<div class="w-full">
					<h1 class="font-semibold text-4xl">Çiçek Açan Badem Ağacı - Almond Blossom</h1>
					<div class="flex items-center gap-2 mt-3">
						<Icon name="star" class="w-6 h-6 text-yellow-300" />
						<span class="text-[#B3B3B3]"
							>4.8 •
							<span class="underline"> 22 Değerlendirme </span>
						</span>
					</div>
					<div class="mt-4 text-sm text-[#B3B3B3] flex items-center gap-2">
						Ürün Kodu: <span class="font-bold"> KT-2024-001 </span>
						<Icon name="copyIcon" />
					</div>
					<div class="mt-8">Boyut Seçin</div>

					<div class="mt-2 relative w-full max-w-[180px]">
						<select
							name="size"
							id="size"
							class="pcSelect w-full appearance-none bg-[#B3B3B333] hover:bg-[#B3B3B340] rounded-full py-3 pl-6 pr-12 font-bold text-[#101828] outline-none transition-all"
						>
							<option selected value="25x25">25x25 cm</option>
							<option value="25x35">25x35 cm</option>
							<option value="30x40">30x40 cm</option>
						</select>
						<div class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
							<Icon name="arrowRight" class="w-4 h-4 rotate-90" />
						</div>
					</div>
					<div class="mt-8">Çerçeve Seçin</div>
					<div class="grid grid-cols-7 gap-3 mt-3">
						<img
							v-for="value in 9"
							:key="value"
							src="/images/cerceve.png"
							alt="cerceve"
							class="border border-transparent hover:border-blue-600 transition-all cursor-pointer rounded-md"
						/>
					</div>
					<div class="mt-8 flex items-center gap-5">
						<span class="text-4xl font-bold text-[#313131]">399₺</span>
						<span class="text-2xl line-through text-[#B3B3B3]">599₺</span>
					</div>

					<div class="mt-5 flex items-center gap-2">
						<button
							class="bg-[#2B7FFF] rounded-3xl p-4 py-3 hover:bg-[#2B7FFF]/80 transition-all text-white font-semibold text-lg w-full max-w-[300px]"
						>
							Sepete Ekle
						</button>
						<Icon
							name="heart"
							class="text-white bg-[#2B7FFF] rounded-3xl w-[50px] h-[50px] hover:bg-[#2B7FFF]/80 transition-all"
						/>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<style lang="scss" scoped>
	.mySwiper {
		margin: 0;
		margin-top: 40px;
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

	.pcSelect {
		box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.06);
	}

	.mySwiper3 {
		margin-top: 20px;
		.swiper-slide {
			border: 1px solid transparent;
			background-color: white;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.3s ease;
			overflow: hidden;

			&:hover {
				border-color: #2b7fff;
			}
		}
	}
</style>
