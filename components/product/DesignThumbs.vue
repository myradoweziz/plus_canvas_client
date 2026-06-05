<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import { CANVAS_PAINTING_STATIC_BG } from '~/utils/canvasPaintingDisplay'
	import type { TempDesignImage } from '~/utils/types'
	import Icon from '~/utils/ui/Icon.vue'

	import 'swiper/css'
	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'
	import 'swiper/css/thumbs'

	const props = defineProps<{
		images: TempDesignImage[]
		isThumbActive: (index: number) => boolean
		getThumbPreviewSrc: (index: number) => string
		getProductThumbBackgroundSrc?: (index: number) => string
		getProductThumbCollageSrc?: (index: number) => string
		/** Серый SVG-фон под миниатюрой (галерея) */
		useStaticThumbBg?: boolean
	}>()

	const useStackedProductThumb = (img: TempDesignImage) =>
		!props.useStaticThumbBg &&
		img.session_id === 'product-image' &&
		Boolean(props.getProductThumbBackgroundSrc && props.getProductThumbCollageSrc)

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

	const getThumbOverlaySrc = (index: number) => {
		const collage = props.getProductThumbCollageSrc?.(index)?.trim()
		if (collage) return collage
		return props.getThumbPreviewSrc(index)?.trim() ?? ''
	}

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
				:key="`${img.session_id}-${img.id}`"
				class="thumb-slide cursor-pointer"
				:class="{
					'is-thumb-active': isThumbActive(index),
					'thumb-slide--product': useStackedProductThumb(img)
				}"
				@click="onThumbClick(index)"
			>
				<div v-if="useStackedProductThumb(img)" class="thumb-slide__stack">
					<img
						:src="getProductThumbBackgroundSrc!(index)"
						:alt="`mockup-bg-${img.id}`"
						class="thumb-slide__bg"
						loading="lazy"
						@error="($event.target as HTMLImageElement).style.opacity = '0.35'"
					/>
					<img
						v-if="getProductThumbCollageSrc!(index)"
						:src="getProductThumbCollageSrc!(index)"
						:alt="`mockup-collage-${img.id}`"
						class="thumb-slide__collage"
						loading="lazy"
					/>
				</div>
				<div v-else-if="useStaticThumbBg" class="thumb-slide__stack">
					<img
						:src="CANVAS_PAINTING_STATIC_BG"
						alt=""
						class="thumb-slide__bg"
						aria-hidden="true"
					/>
					<img
						:src="getThumbPreviewSrc(index)"
						:alt="`preview-${img.id}`"
						class="thumb-slide__collage"
						loading="lazy"
						@error="($event.target as HTMLImageElement).style.opacity = '0.35'"
					/>
				</div>
				<div v-else class="thumb-slide__stack">
					<img
						:src="CANVAS_PAINTING_STATIC_BG"
						alt=""
						class="thumb-slide__bg"
						aria-hidden="true"
					/>
					<img
						v-if="getThumbOverlaySrc(index)"
						:src="getThumbOverlaySrc(index)"
						:alt="img.session_id === 'product-image' ? `mockup-${img.id}` : `preview-${img.id}`"
						class="thumb-slide__collage"
						loading="lazy"
						@error="($event.target as HTMLImageElement).style.opacity = '0.35'"
					/>
				</div>
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

		:deep(.swiper-slide.thumb-slide) {
			width: 100px;
			height: 100px;
			flex-shrink: 0;
			border-radius: 12px;
			overflow: hidden;
			opacity: 0.55;
			background: #e5e7eb;
			transition: all 0.3s ease;

			&:hover {
				opacity: 1;
			}

			.thumb-slide__img {
				display: block;
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.thumb-slide__stack {
				position: relative;
				width: 100%;
				height: 100%;
			}

			.thumb-slide__bg {
				position: absolute;
				inset: 0;
				display: block;
				width: 100%;
				height: 100%;
				object-fit: cover;
				object-position: center;
			}

			.thumb-slide__collage {
				position: absolute;
				inset: 0;
				display: block;
				width: 100%;
				height: 100%;
				object-fit: contain;
				object-position: center;
				box-sizing: border-box;
				padding: 16px;
				pointer-events: none;
			}

			&.is-thumb-active {
				opacity: 1;
				box-shadow: 0 0 0 2px #2563eb;
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
