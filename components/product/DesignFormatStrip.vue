<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import { CANVAS_PAINTING_STATIC_BG } from '~/utils/canvasPaintingDisplay'
	import { mediaUrlForCanvas } from '~/utils/mediaUrl'
	import { formatOrientationAspect, type CanvasFormat } from '~/utils/productDesignConfig'
	import Icon from '~/utils/ui/Icon.vue'

	import 'swiper/css'
	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'

	const props = defineProps<{
		formats: CanvasFormat[]
		/** Снимок Fabric на каждый формат (как на центральном холсте) */
		formatPreviewById: Record<number, string>
		/** Дизайн без mockup — слой поверх фона */
		formatDesignPreviewById?: Record<number, string>
		/** Актуальный снимок центрального холста */
		canvasPreviewSrc?: string
		/** Актуальный дизайн без mockup */
		canvasDesignPreviewSrc?: string
		/** Mockup-фон (как на холсте) */
		formatStripBackgroundSrc?: string
		activeFormatId: number | null
		isLoading?: boolean
	}>()

	const backgroundSrc = computed(() => props.formatStripBackgroundSrc?.trim() || CANVAS_PAINTING_STATIC_BG)

	const formatImageSrc = (format: CanvasFormat) => {
		const url = format.image_url?.trim()
		return url ? mediaUrlForCanvas(url) : ''
	}

	const designSrcFor = (format: CanvasFormat) => {
		const id = Number(format.id)
		const isCurrent = Number(props.activeFormatId) === id
		if (isCurrent && props.canvasDesignPreviewSrc) return props.canvasDesignPreviewSrc
		const fromFabric = props.formatDesignPreviewById?.[id]
		if (fromFabric) return fromFabric
		if (isCurrent && props.canvasPreviewSrc) return props.canvasPreviewSrc
		const legacy = props.formatPreviewById[id]
		if (legacy) return legacy
		const fromApi = formatImageSrc(format)
		if (fromApi) return fromApi
		return props.canvasPreviewSrc ?? ''
	}

	const usesFormatSvgImage = (format: CanvasFormat) => {
		const id = Number(format.id)
		const isCurrent = Number(props.activeFormatId) === id
		if (isCurrent && (props.canvasDesignPreviewSrc || props.canvasPreviewSrc)) return false
		if (props.formatDesignPreviewById?.[id] || props.formatPreviewById[id]) return false
		return Boolean(format.image_url?.trim())
	}

	const previewOverlayStyle = (format: CanvasFormat) => ({
		'--format-aspect': String(formatOrientationAspect(format))
	})

	const emit = defineEmits<{
		(e: 'select-format', formatId: number): void
	}>()

	const modules = [FreeMode, Navigation, Thumbs]
	const prevEl = ref<HTMLElement | null>(null)
	const nextEl = ref<HTMLElement | null>(null)

	const isActive = (id: number) => Number(props.activeFormatId) === Number(id)

	const onSelect = (formatId: number) => {
		if (props.isLoading) return
		emit('select-format', formatId)
	}

	/** В ряд — до 6 форматов; если меньше, каждый слайд шире (не 1/6 пустого ряда). */
	const MAX_VISIBLE_FORMATS = 6

	const slidesPerView = computed(() => Math.min(props.formats.length, MAX_VISIBLE_FORMATS))

	const showFormatNav = computed(() => props.formats.length > MAX_VISIBLE_FORMATS)

	const swiperBreakpoints = computed(() => {
		const n = props.formats.length
		return {
			0: { slidesPerView: Math.min(n, 2), spaceBetween: 12 },
			480: { slidesPerView: Math.min(n, 3), spaceBetween: 14 },
			640: { slidesPerView: Math.min(n, 4), spaceBetween: 16 },
			900: { slidesPerView: Math.min(n, 5), spaceBetween: 18 },
			1024: { slidesPerView: Math.min(n, MAX_VISIBLE_FORMATS), spaceBetween: 20 }
		}
	})
</script>

<template>
	<div
		v-if="formats.length"
		class="format-strip relative w-full max-w-[680px]"
		:class="{ 'format-strip--loading': isLoading }"
		:style="{ '--format-visible': String(Math.min(formats.length, MAX_VISIBLE_FORMATS)) }"
	>
		<swiper
			:slides-per-view="slidesPerView"
			:space-between="20"
			:breakpoints="swiperBreakpoints"
			:modules="modules"
			class="format-strip__swiper mySwiper3 w-full"
			:navigation="showFormatNav ? { prevEl, nextEl } : false"
		>
			<swiper-slide
				v-for="format in formats"
				:key="format.id"
				class="format-slide cursor-pointer"
				:class="{ 'format-slide--active': isActive(format.id) }"
			>
				<div class="format-slide__inner">
					<div
						role="button"
						tabindex="0"
						class="format-slide__preview"
						:class="{ 'format-slide__preview--active': isActive(format.id) }"
						@click.stop="onSelect(format.id)"
						@keydown.enter.prevent="onSelect(format.id)"
						@keydown.space.prevent="onSelect(format.id)"
					>
						<div class="format-slide__preview-frame">
							<div class="format-slide__preview-stack">
								<img :src="backgroundSrc" alt="" class="format-slide__preview-bg" aria-hidden="true" />
								<div class="format-slide__preview-overlay">
									<div
										class="format-slide__preview-img-box"
										:class="{ 'format-slide__preview-img-box--format-svg': usesFormatSvgImage(format) }"
										:style="previewOverlayStyle(format)"
									>
										<img
											v-if="designSrcFor(format)"
											:src="designSrcFor(format)"
											:alt="format.name"
											class="format-slide__preview-img"
										/>
										<img
											v-else
											src="/images/banner.png"
											:alt="format.name"
											class="format-slide__preview-img format-slide__preview-img--placeholder"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<p class="format-slide__label pointer-events-none">{{ format.name }}</p>
				</div>
			</swiper-slide>
		</swiper>

		<div v-if="showFormatNav">
			<button ref="prevEl" type="button" class="navBtn absolute -left-12 bottom-10 z-10">
				<Icon name="arrowRight" class="w-12 h-12 -rotate-180" />
			</button>
			<button ref="nextEl" type="button" class="navBtn absolute right-0 bottom-10 z-10">
				<Icon name="arrowRight" class="w-12 h-12 -rotate-360" />
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
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

	.format-strip {
		--format-slide-gap: 20px;
		--format-visible: 6;
		--format-preview-h: 108px;

		&--loading {
			pointer-events: none;
		}
	}

	.mySwiper3,
	.format-strip__swiper {
		margin-top: 20px;
		width: 100%;

		:deep(.swiper-wrapper) {
			align-items: stretch;
		}

		:deep(.swiper-slide.format-slide) {
			height: auto;
			display: flex;
			box-sizing: border-box;
			max-width: calc((100% - (var(--format-visible) - 1) * var(--format-slide-gap)) / var(--format-visible));
		}

		:deep(.format-slide) {
			display: flex;
			flex-direction: column;
			flex: 1;
			width: 100%;
			min-height: 164px;
			border: 1px solid transparent;
			background-color: white;
			border-radius: 8px;
			cursor: pointer;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;
			box-sizing: border-box;
			overflow: hidden;

			&:hover {
				border-color: #93c5fd;
			}

			&.format-slide--active {
				border-color: #2563eb;
				box-shadow: 0 0 0 1px #2563eb;
			}
		}
	}

	.format-slide__inner {
		flex: 1;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		min-height: 0;
	}

	.format-slide__preview {
		flex: 0 0 var(--format-preview-h);
		width: 100%;
		height: var(--format-preview-h);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		box-sizing: border-box;
	}

	.format-slide__preview-frame {
		width: 100%;
		height: 100%;
	}

	.format-slide__preview-stack {
		position: relative;
		width: 100%;
		height: 100%;
		--format-overlay-max-h: calc(100% - 18px);
	}

	.format-slide__preview-bg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		pointer-events: none;
	}

	.format-slide__preview-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 9px;
		box-sizing: border-box;
		pointer-events: none;
	}

	.format-slide__preview-img-box {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
		max-height: var(--format-overlay-max-h);
		width: min(100%, calc(var(--format-overlay-max-h) * var(--format-aspect, 1)));
		height: auto;
		aspect-ratio: var(--format-aspect, 1);
	}

	.format-slide__preview-img-box--format-svg {
		--format-overlay-max-h: calc(100% - 24px);
	}

	.format-slide__preview-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
		pointer-events: none;
	}

	.format-slide__preview-img--placeholder {
		object-fit: cover;
		opacity: 0.6;
	}

	.format-slide__label {
		flex-shrink: 0;
		width: 100%;
		margin: auto 0 0;
		padding: 8px 0;
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: #364153;
	}
</style>
