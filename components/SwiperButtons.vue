<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	interface Props {
		prevClass?: string
		nextClass?: string
		containerClass?: string
		disabledPrev?: boolean
		disabledNext?: boolean
	}

	withDefaults(defineProps<Props>(), {
		prevClass: 'swiper-prev',
		nextClass: 'swiper-next',
		containerClass: 'hidden md:flex items-center gap-3',
		disabledPrev: false,
		disabledNext: false
	})
</script>

<template>
	<div :class="['relative z-20', containerClass]">
		<button
			type="button"
			:class="[
				prevClass,
				{ 'swiper-button-disabled': disabledPrev },
				'w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1853a0] hover:bg-[#124080] text-white flex items-center justify-center transition-all shadow-md pointer-events-auto'
			]"
		>
			<Icon name="arrowBottom" class="w-4 h-4 md:w-5 md:h-5 rotate-90 flex justify-center" />
		</button>
		<button
			type="button"
			:class="[
				nextClass,
				{ 'swiper-button-disabled': disabledNext },
				'w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1853a0] hover:bg-[#124080] text-white flex items-center justify-center transition-all shadow-md pointer-events-auto'
			]"
		>
			<Icon name="arrowBottom" class="w-4 h-4 md:w-5 md:h-5 -rotate-90 flex justify-center" />
		</button>
	</div>
</template>

<style lang="scss" scoped>
	button {
		transition: all 0.3s ease;

		&.swiper-button-disabled {
			opacity: 0.5;
			background-color: #a5a5a5 !important;
			cursor: not-allowed;
			pointer-events: none;
		}

		&:deep(svg) {
			cursor: pointer;
			width: 12px;
			height: 12px;
		}
	}
</style>
