<script setup lang="ts">
	import { FreeMode, Navigation, Thumbs } from 'swiper/modules'

	import Icon from '~/utils/ui/Icon.vue'
	import type { CanvasFormat } from '~/utils/productDesignConfig'

	import 'swiper/css'
	import 'swiper/css/free-mode'
	import 'swiper/css/navigation'

	const props = defineProps<{
		formats: CanvasFormat[]
		previewSrc: string
		activeFormatId: number | null
	}>()

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
				class="format-slide flex flex-col items-center justify-center pb-4 cursor-pointer"
				:class="{ 'format-slide--active': isActive(format.id) }"
			>
				<div
					role="button"
					tabindex="0"
					class="format-slide__preview relative pt-[100%] w-full border-2 border-transparent hover:border-blue-600 transition-all rounded-md overflow-hidden"
					:class="{ '!border-blue-600': isActive(format.id) }"
					@click.stop="onSelect(format.id)"
					@keydown.enter.prevent="onSelect(format.id)"
					@keydown.space.prevent="onSelect(format.id)"
				>
					<img
						v-if="previewSrc"
						:src="previewSrc"
						:alt="format.name"
						class="w-full h-full absolute top-0 left-0 object-cover pointer-events-none"
					/>
					<img
						v-else
						src="/images/banner.png"
						:alt="format.name"
						class="w-full h-full absolute top-0 left-0 object-cover pointer-events-none"
					/>
				</div>
				<p class="text-sm text-[#364153] px-4 pt-4 pointer-events-none">{{ format.name }}</p>
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

		:deep(.format-slide) {
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
				border-color: #93c5fd;
			}

			&.format-slide--active {
				border-color: #2563eb;
				box-shadow: 0 0 0 1px #2563eb;
			}
		}
	}
</style>
