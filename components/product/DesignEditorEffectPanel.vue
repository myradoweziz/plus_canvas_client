<script setup lang="ts">
	import { mediaUrlForCanvas } from '~/utils/mediaUrl'
	import type { EffectOption } from '~/utils/types'

	type EffectListItem = {
		id: number | null
		name: string
		preview: string
	}

	const EFFECT_NONE: EffectListItem = {
		id: null,
		name: 'Effekt yok',
		preview: '/images/effect.jpg'
	}

	const props = withDefaults(
		defineProps<{
			disabled?: boolean
			effects?: EffectOption[]
			selectedEffectId?: number | null
			opacity?: number
		}>(),
		{
			disabled: false,
			effects: () => [],
			selectedEffectId: null,
			opacity: 100
		}
	)

	const emit = defineEmits<{
		(e: 'select', effectId: number | null): void
		(e: 'opacity-change', opacity: number): void
	}>()

	const effectPreviewSrc = (effect: EffectOption) => {
		const url = effect.image_url?.trim()
		return url ? mediaUrlForCanvas(url) : EFFECT_NONE.preview
	}

	const effectOptions = computed((): EffectListItem[] => {
		const fromProduct = (props.effects ?? [])
			.filter((effect) => effect?.name?.trim())
			.map((effect) => ({
				id: effect.id,
				name: effect.name,
				preview: effectPreviewSrc(effect)
			}))
		return [EFFECT_NONE, ...fromProduct]
	})

	const showOpacity = computed(() => props.selectedEffectId != null)
	const isEffectSelected = (id: number | null) => props.selectedEffectId === id

	const onOpacityInput = (e: Event) => {
		const value = Number((e.target as HTMLInputElement).value)
		if (!Number.isFinite(value)) return
		emit('opacity-change', value)
	}
</script>

<template>
	<div class="design-editor-effect-panel space-y-4">
		<div class="grid grid-cols-4 gap-2">
			<button
				v-for="effect in effectOptions"
				:key="effect.id ?? 'effect-none'"
				type="button"
				class="rounded-xl overflow-hidden relative border-2 group aspect-square disabled:cursor-not-allowed disabled:opacity-60"
				:class="
					isEffectSelected(effect.id)
						? 'border-[#2B7FFF] ring-2 ring-[#2B7FFF]/20'
						: 'border-transparent hover:border-[#2B7FFF]'
				"
				:disabled="disabled"
				:aria-pressed="isEffectSelected(effect.id)"
				:title="effect.name"
				@click="emit('select', effect.id)"
			>
				<img :src="effect.preview" :alt="effect.name" class="w-full h-full object-cover" />
				<p
					class="absolute top-1/2 left-1/2 text-white -translate-x-1/2 -translate-y-1/2 text-sm bg-black/50 text-nowrap w-full line-clamp-1 text-ellipsis overflow-hidden px-1 text-center transition-opacity duration-300"
					:class="isEffectSelected(effect.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
				>
					{{ effect.name }}
				</p>
			</button>
		</div>

		<div v-if="showOpacity" class="design-editor-effect-panel__opacity">
			<div class="flex items-center justify-between gap-3">
				<label :for="`effect-opacity-${selectedEffectId}`" class="text-sm font-bold text-gray-950">
					Şeffaflık
				</label>
				<span class="text-sm font-semibold text-[#364153] tabular-nums">{{ opacity }}%</span>
			</div>
			<input
				:id="`effect-opacity-${selectedEffectId}`"
				type="range"
				min="0"
				max="100"
				step="1"
				:value="opacity"
				class="design-editor-range mt-2 w-full"
				:style="{ '--range-progress': `${opacity}%` }"
				:disabled="disabled"
				@input="onOpacityInput"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.design-editor-range {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			#2b7fff 0%,
			#2b7fff var(--range-progress, 50%),
			#e5e7eb var(--range-progress, 50%),
			#e5e7eb 100%
		);
		outline: none;
		cursor: pointer;

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: #2b7fff;
			border: 2px solid #fff;
			box-shadow: 0 1px 4px rgba(16, 24, 40, 0.2);
			cursor: pointer;
		}

		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: #2b7fff;
			border: 2px solid #fff;
			box-shadow: 0 1px 4px rgba(16, 24, 40, 0.2);
			cursor: pointer;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
</style>
