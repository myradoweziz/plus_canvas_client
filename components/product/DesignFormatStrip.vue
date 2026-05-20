<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'
	import { formatOrientationAspect, type CanvasFormat } from '~/utils/productDesignConfig'

	import 'swiper/css'
	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'

	const props = defineProps<{
		formats: CanvasFormat[]
		/** Снимок Fabric на каждый формат (как на центральном холсте) */
		formatPreviewById: Record<number, string>
		/** Актуальный снимок центрального холста */
		canvasPreviewSrc?: string
		activeFormatId: number | null
	}>()

	const previewSrcFor = (format: CanvasFormat) => {
		const id = Number(format.id)
		const isCurrent = Number(props.activeFormatId) === id
		if (isCurrent && props.canvasPreviewSrc) return props.canvasPreviewSrc
		return props.formatPreviewById[id] ?? props.canvasPreviewSrc ?? ''
	}

	const previewZoneStyle = (format: CanvasFormat) => ({
		aspectRatio: String(formatOrientationAspect(format))
	})

	const emit = defineEmits<{
		(e: 'select-format', formatId: number): void
	}>()

	const modules = [FreeMode, Navigation, Thumbs]
	const prevEl = ref<HTMLElement | null>(null)
	const nextEl = ref<HTMLElement | null>(null)

	const isActive = (id: number) => Number(props.activeFormatId) === Number(id)

	const onSelect = (formatId: number) => {
		emit('select-format', formatId)
	}
</script>

<template>
	<div v-if="formats.length" class="relative">
		<swiper
			:slides-per-view="6"
			:space-between="20"
			:modules="modules"
			class="mySwiper3 w-full max-w-[680px]"
			:navigation="{ prevEl, nextEl }"
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
						:style="previewZoneStyle(format)"
						@click.stop="onSelect(format.id)"
						@keydown.enter.prevent="onSelect(format.id)"
						@keydown.space.prevent="onSelect(format.id)"
					>
						<img
							v-if="previewSrcFor(format)"
							:src="previewSrcFor(format)"
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
					<p class="format-slide__label pointer-events-none">{{ format.name }}</p>
				</div>
			</swiper-slide>
		</swiper>

		<div v-if="formats.length > 6">
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

	.mySwiper3 {
		margin-top: 20px;

		:deep(.swiper-wrapper) {
			align-items: stretch;
		}

		:deep(.swiper-slide.format-slide) {
			height: auto;
			display: flex;
			box-sizing: border-box;
		}

		:deep(.format-slide) {
			border: 1px solid transparent;
			background-color: white;
			border-radius: 8px;
			width: 100%;
			cursor: pointer;
			transition: all 0.3s ease;
			padding: 8px 4px 4px;

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
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.format-slide__preview {
		position: relative;
		width: 100%;
		max-height: 88px;
		border-radius: 8px;
		overflow: hidden;
		background-color: #e5e7eb;
		border: 2px solid transparent;
		transition: border-color 0.2s ease;

		&:hover {
			border-color: #2563eb;
		}

		&--active {
			border-color: #2563eb;
		}
	}

	.format-slide__preview-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		pointer-events: none;
	}

	.format-slide__preview-img--placeholder {
		object-fit: cover;
		opacity: 0.6;
	}

	.format-slide__label {
		width: 100%;
		margin: 0;
		padding-top: 8px;
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: #364153;
		min-height: 2.5rem;
	}
</style>
