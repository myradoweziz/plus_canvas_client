<script setup lang="ts">
	import { Autoplay, Navigation, Pagination } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'

	import type { Banner, BreadcrumbItem, MainCategory } from '~/utils/types'

	const props = withDefaults(
		defineProps<{
			status?: string
			banners: Banner[]
			breadcrumbs?: BreadcrumbItem[]
			/** Katalog sayfaları: swiper yokken başlık / açıklama / arka plan görseli */
			category?: {
				title: string
				description?: string
			}
			mainCategory?: MainCategory
		}>(),
		{
			banners: () => []
		}
	)

	const route = useRoute()
	/** Ortada büyük başlık: yalnızca ürün listesi (`/products`) */
	const showMainCategoryHeroTitle = computed(() => route.name === 'products' && props.mainCategory != null)

	const modules = [Pagination, Navigation, Autoplay]
</script>

<template>
	<skeletons-banner v-if="status === 'pending'" />

	<!-- Ürün listesi vb.: swiper yok; yalnızca gradient + başlık / açıklama -->
	<section v-else-if="!banners.length" class="relative w-full sm:h-[350px] md:h-[550px] lg:h-[750px] overflow-hidden">
		<div class="absolute inset-0 bg-gradient-to-br from-[#215EA5] to-slate-900" />

		<div
			class="relative z-10 w-full h-full max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col justify-center pointer-events-none"
		>
			<div v-if="breadcrumbs?.length" class="absolute top-6 md:top-10 left-4 md:left-10 pointer-events-auto">
				<Breadcrumbs :items="breadcrumbs" white />
			</div>

			<div v-if="category" class="max-w-[550px] lg:max-w-[600px] text-white pointer-events-auto">
				<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
					{{ category.title }}
				</h1>
				<p v-if="category.description" class="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
					{{ category.description }}
				</p>
			</div>
		</div>
	</section>

	<Swiper
		v-else
		:modules="modules"
		:autoplay="{ delay: 2500, disableOnInteraction: false }"
		:speed="2000"
		:pagination="{ clickable: true }"
		:navigation="{ prevEl: '.swiper-btn-prev', nextEl: '.swiper-btn-next' }"
		:loop="banners.length > 1"
	>
		<SwiperSlide v-for="banner in banners" :key="banner.id">
			<div class="relative w-full sm:h-[350px] md:h-[550px] lg:h-[750px]">
				<!-- Главная ссылка (фон и основная область) -->
				<nuxt-link :to="banner.url" class="absolute inset-0 block">
					<img
						:src="banner.image_url"
						alt="banner"
						class="w-full h-full object-cover object-center max-md:object-cover"
					/>
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
					<div v-if="!showMainCategoryHeroTitle" class="max-w-[450px] lg:max-w-[500px] text-white pointer-events-auto">
						<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
							{{ banner.title }}
						</h1>
						<p v-if="banner.description" class="mt-4 text-sm md:text-base text-gray-200">
							{{ banner.description }}
						</p>
					</div>

					<div
						v-if="showMainCategoryHeroTitle"
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-4xl md:text-6xl font-bold text-center"
					>
						{{ mainCategory?.name }}
						<p v-if="mainCategory?.description" class="mt-4 text-sm md:text-2xl text-gray-200">
							{{ mainCategory?.description }}
						</p>
					</div>

					<!-- Маленький элемент снизу справа -->
					<nuxt-link
						v-if="banner.product"
						:to="`/products/${banner.product.id}`"
						class="hidden md:flex absolute right-4 md:right-[-200px] bottom-8 lg:bottom-12 bg-white rounded-2xl p-3 shadow-2xl gap-4 w-[360px] lg:w-[440px] max-h-[170px] cursor-pointer hover:-translate-y-1 transition-all pointer-events-auto"
					>
						<img
							v-if="banner.product?.images?.length > 0"
							:src="banner.product.images[0].url"
							alt="Almond blossom"
							class="w-full h-full max-w-[190px] max-h-[150px] rounded-xl object-cover shrink-0"
						/>
						<div class="flex flex-col pb-2">
							<span class="text-[#215EA5] font-semibold">{{ banner.product.name }}</span>
							<div class="flex-1">
								<p class="text-sm text-[#313131] mt-1 line-clamp-4 text-ellipsis overflow-hidden">
									{{ banner.product.description }}
								</p>
							</div>
							<span class="text-[#215EA5] text-sm mt-1 lg:mt-2 flex items-center gap-2"
								>satın al

								<Icon name="arrowRight" class="w-4 h-4" />
							</span>
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
