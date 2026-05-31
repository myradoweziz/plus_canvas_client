<script setup lang="ts">
	import type { ActiveMockupSceneSetting } from '~/utils/types'

	const props = defineProps<{
		settings: ActiveMockupSceneSetting[]
		disabled?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'color-change', settingIndex: number, color: string): void
	}>()

	const openIndex = ref<number | null>(null)

	const toggle = (index: number) => {
		if (props.disabled) return
		openIndex.value = openIndex.value === index ? null : index
	}

	const pickColor = (settingIndex: number, color: string) => {
		emit('color-change', settingIndex, color)
		openIndex.value = null
	}

	const onClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement | null
		if (target?.closest('.mockup-scene-hotspot')) return
		openIndex.value = null
	}

	onMounted(() => {
		document.addEventListener('click', onClickOutside)
	})

	onUnmounted(() => {
		document.removeEventListener('click', onClickOutside)
	})
</script>

<template>
	<div class="mockup-scene-hotspots pointer-events-none absolute inset-0 z-[25]">
		<div
			v-for="setting in settings"
			:key="`${setting.index}-${setting.name}`"
			class="mockup-scene-hotspot pointer-events-auto absolute"
			:style="{ left: `${setting.x}%`, top: `${setting.y}%` }"
		>
			<button
				type="button"
				class="mockup-scene-dot"
				:style="{ backgroundColor: setting.value }"
				:aria-label="setting.name"
				:disabled="disabled"
				@click.stop="toggle(setting.index)"
			/>
			<span class="mockup-scene-caption">{{ setting.name }}</span>

			<div v-if="openIndex === setting.index" class="mockup-scene-popover" @click.stop>
				<p class="mockup-scene-popover-title">{{ setting.name }}</p>
				<div class="mockup-scene-palette">
					<button
						v-for="color in setting.palette"
						:key="color"
						type="button"
						class="mockup-scene-swatch"
						:class="{ active: color.toLowerCase() === setting.value.toLowerCase() }"
						:style="{ backgroundColor: color }"
						:aria-label="color"
						@click="pickColor(setting.index, color)"
					/>
				</div>
				<label class="mockup-scene-custom">
					<span>Özel renk</span>
					<input
						type="color"
						:value="setting.value"
						@input="pickColor(setting.index, ($event.target as HTMLInputElement).value)"
					/>
				</label>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.mockup-scene-hotspot {
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
	}

	.mockup-scene-dot {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		border: 3px solid #fff;
		box-shadow: 0 2px 10px rgba(16, 24, 40, 0.28);
		cursor: pointer;
		transition: transform 0.15s ease;

		&:hover:not(:disabled) {
			transform: scale(1.08);
		}

		&:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}
	}

	.mockup-scene-caption {
		max-width: 7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		background: rgba(16, 24, 40, 0.72);
		color: #fff;
		font-size: 0.65rem;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
		white-space: nowrap;
	}

	.mockup-scene-popover {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 11rem;
		padding: 0.75rem;
		border-radius: 1rem;
		background: #fff;
		box-shadow: 0 12px 32px rgba(16, 24, 40, 0.18);
		z-index: 40;
	}

	.mockup-scene-popover-title {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #101828;
	}

	.mockup-scene-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.mockup-scene-swatch {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
		border: 2px solid #fff;
		box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.12);
		cursor: pointer;

		&.active {
			box-shadow: 0 0 0 2px #2b7fff;
		}
	}

	.mockup-scene-custom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.65rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: #364153;

		input[type='color'] {
			width: 2rem;
			height: 2rem;
			padding: 0;
			border: none;
			background: transparent;
			cursor: pointer;
		}
	}
</style>
