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

	const reviews = [
		{
			name: 'Ayşe Yılmaz',
			avatar: '/images/banner.png',
			rating: 5,
			text: 'Harika bir hizmet! Fotoğrafım çok kaliteli bir şekilde basıldı. Off renk tablosu. Ürünü ailemle kullanmak üzere duvarıma müthiş bir şekilde tavsiye ederim.',
			product: 'Çiçek Açan Badem Ağacı - Almond Blossom',
			images: ['/images/banner.png', '/images/banner.png']
		},
		{
			name: 'Ayşe Yılmaz',
			avatar: '/images/banner.png',
			rating: 5,
			text: 'Harika bir hizmet! Fotoğrafım çok kaliteli bir şekilde basıldı. Ürünü ailemle kullanmak üzere duvarıma müthiş bir şekilde tavsiye ederim.',
			product: 'Çiçek Açan Badem Ağacı - Almond Blossom',
			images: ['/images/banner.png', '/images/banner.png']
		},
		{
			name: 'Ayşe Yılmaz',
			avatar: '/images/banner.png',
			rating: 5,
			text: 'Harika ve hayreti! Fotoğrafım çok kaliteli bir şekilde basıldı. Ürünü ailemle kullanmak üzere duvarıma müthiş bir şekilde tavsiye ederim.',
			product: 'Çiçek Açan Badem Ağacı - Almond Blossom',
			images: ['/images/banner.png', '/images/banner.png']
		}
	]
</script>

<template>
	<section class="bg-[#5694DD] mt-20 relative">
		<div class="max-w-[1400px] mx-auto px-4 md:px-10 py-16 md:py-24">
			<div class="absolute -left-0 -top-16 w-64 h-64 pointer-events-none text-white opacity-60">
				<Icon name="backgroundPlus" class="w-full h-full object-contain" />
			</div>
			<div class="absolute left-[100px] top-1/2 w-64 h-64 pointer-events-none text-white opacity-60">
				<Icon name="backgroundPlus" class="w-full h-full object-contain rotate-[150deg] -translate-y-20" />
			</div>
			<div
				class="absolute -right-[0px] top-34 w-[250px] h-[300px] transform -translate-y-1/2 pointer-events-none text-white opacity-60"
			>
				<Icon name="backgroundPlus2" class="w-full h-full object-contain" />
			</div>
			<!-- Başlık -->
			<div class="text-center mb-12">
				<h2 class="text-2xl md:text-3xl lg:text-[40px] font-bold text-white">Müşteri Yorumları</h2>
				<p class="mt-4 text-white text-sm md:text-base">Binlerce mutlu müşterimizden bazılarının görüşleri</p>
			</div>

			<!-- Slider -->
			<div class="relative">
				<Swiper
					:modules="modules"
					:autoplay="{ delay: 5000, disableOnInteraction: false }"
					:speed="2000"
					:loop="false"
					@swiper="onSwiper"
					:navigation="{ prevEl: '.rev-prev', nextEl: '.rev-next' }"
					:slidesPerView="1.1"
					:spaceBetween="16"
					:breakpoints="{
						640: { slidesPerView: 1.5, spaceBetween: 20 },
						1024: { slidesPerView: 3, spaceBetween: 24 }
					}"
				>
					<SwiperSlide v-for="(review, index) in reviews" :key="index" class="h-auto">
						<div
							class="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_24px_rgba(16,24,40,0.08)] hover:shadow-[0_10px_30px_rgba(16,24,40,0.12)] transition-all p-6 md:p-8 flex flex-col h-full"
						>
							<!-- Ürün başlığı -->
							<h3 class="text-[15px] md:text-xl font-semibold text-gray-900 mb-4 leading-snug">
								{{ review.product }}
							</h3>

							<!-- Ürün görselleri -->
							<div class="grid grid-cols-2 gap-3 mb-4">
								<div
									v-for="(img, i) in review.images.slice(0, 2)"
									:key="i"
									class="h-[150px] md:w-full md:h-[188px] rounded-[14px] overflow-hidden bg-gray-100 flex-shrink-0"
								>
									<img :src="img" alt="" class="w-full h-full object-cover" />
								</div>
							</div>

							<!-- Yıldızlar -->
							<div class="flex gap-0.5 mb-3">
								<Icon v-for="s in review.rating" :key="s" name="star" class="w-4 h-4 text-[#f4ae0f]" />
							</div>

							<div class="bg-[#215EA51A] p-4 rounded-2xl flex-1">
								<!-- Kullanıcı -->
								<div class="flex items-center gap-3 mb-3">
									<img :src="review.avatar" :alt="review.name" class="w-9 h-9 rounded-full object-cover" />
									<span class="text-sm font-bold text-gray-800">{{ review.name }}</span>
								</div>

								<!-- Yorum metni -->
								<p class="text-sm text-gray-500 leading-relaxed mb-6 flex-grow">
									{{ review.text }}
								</p>
							</div>

							<!-- Alt alan -->
							<div class="mt-5">
								<nuxt-link
									to="/"
									class="flex items-center justify-center rounded-3xl border border-[#1853a0] p-2 w-full gap-2 text-[#1853a0] text-sm hover:underline"
								>
									geçmektir
									<Icon name="customerReviewArrow" class="w-4 h-4" />
								</nuxt-link>
							</div>
						</div>
					</SwiperSlide>
				</Swiper>
				<div class="mt-8 flex justify-center">
					<SwiperButtons
						prev-class="rev-prev"
						next-class="rev-next"
						:disabled-prev="isBeginning"
						:disabled-next="isEnd"
					/>
				</div>
			</div>

			<!-- Genel Değerlendirme -->
			<div class="flex flex-col items-center mt-14">
				<div class="flex items-center gap-2">
					<Icon name="star" class="star text-[#f4ae0f]" />
					<span class="text-4xl md:text-5xl font-bold text-white">4.9</span>
					<span class="text-lg text-white/70 font-medium">/5.0</span>
				</div>
				<p class="text-white text-sm mt-2">2,547 değerlendirme</p>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped>
	:deep(.swiper-wrapper) {
		align-items: stretch;
	}

	:deep(.swiper-slide) {
		height: auto;
		display: flex;
	}

	.star {
		&:deep(svg) {
			width: 32px;
			height: 32px;
		}
	}
</style>
