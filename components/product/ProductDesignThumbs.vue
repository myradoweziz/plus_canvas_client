<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import type { TempDesignImage } from '~/utils/types'
	import Icon from '~/utils/ui/Icon.vue'

	import 'swiper/css'
	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'
	import 'swiper/css/thumbs'

	const props = defineProps<{
		images: TempDesignImage[]
		isThumbActive: (index: number) => boolean
		previewUrl: (url: string) => string
	}>()

	const emit = defineEmits<{
		(e: 'select', index: number): void
	}>()

	const modules = [FreeMode, Navigation, Thumbs]
	const thumbsSwiper = ref<{ slideTo?: (index: number) => void } | null>(null)

	const setThumbsSwiper = (swiper: { slideTo?: (index: number) => void }) => {
		thumbsSwiper.value = swiper
	}
	const prevEl = ref<HTMLElement | null>(null)
	const nextEl = ref<HTMLElement | null>(null)

	const onThumbClick = (index: number) => {
		emit('select', index)
		thumbsSwiper.value?.slideTo?.(index)
	}
</script>

<template>
	<section class="product-design-thumbs relative h-[510px] w-[100px]">
		<swiper
			@swiper="setThumbsSwiper"
			:slides-per-view="4"
			:space-between="20"
			:free-mode="true"
			:watch-slides-progress="true"
			:modules="modules"
			class="mySwiper w-full h-full"
			:style="{
				'--swiper-navigation-color': '#fff',
				'--swiper-pagination-color': '#fff'
			}"
			direction="vertical"
			:navigation="{ prevEl, nextEl }"
		>
			<swiper-slide
				v-for="(img, index) in images"
				:key="img.id"
				class="cursor-pointer"
				:class="{ 'is-thumb-active': isThumbActive(index) }"
				@click="onThumbClick(index)"
			>
				<img :src="previewUrl(img.url)" :alt="`upload-${img.id}`" />
			</swiper-slide>
			<swiper-slide v-if="!images.length">
				<img src="/images/banner.png" alt="placeholder" />
			</swiper-slide>
		</swiper>

		<div v-if="images.length > 4">
			<button ref="prevEl" type="button" class="navBtn absolute left-1/4 top-0 z-10">
				<Icon name="arrowRight" class="w-12 h-12 -rotate-90" />
			</button>
			<button ref="nextEl" type="button" class="navBtn absolute left-1/4 -bottom-15 z-10">
				<Icon name="arrowRight" class="w-12 h-12 rotate-90" />
			</button>
		</div>
	</section>
</template>

<style lang="scss" scoped>
	.mySwiper {
		margin: 0;
		margin-top: 40px;

		:deep(.swiper-slide) {
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

			&.is-thumb-active {
				opacity: 1;
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

		&:hover {
			transform: translateY(-1px);
			color: #1853a0;
		}

		:deep(svg) {
			filter: drop-shadow(0 10px 20px rgba(16, 24, 40, 0.15));
		}
	}
</style>
