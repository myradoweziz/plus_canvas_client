<script setup lang="ts">
	import { mediaUrlForCanvas } from '~/utils/mediaUrl'
	import {
		effectUsesDetails,
		getSortedEffects,
		resolveEffectKind
	} from '~/utils/canvasEffectFilters'
	import type { EffectOption } from '~/utils/types'

	type EffectListItem = {
		id: number | null
		name: string
		preview: string
	}

	type EffectControlKind = 'amount' | 'color' | 'dual-color' | 'details'

	const EFFECT_NONE: EffectListItem = {
		id: null,
		name: 'Orijinal',
		preview: '/images/effect.jpg'
	}

	const props = withDefaults(
		defineProps<{
			disabled?: boolean
			effects?: EffectOption[]
			selectedEffectId?: number | null
			opacity?: number
			details?: number
			effectColor?: string
			effectColorSecondary?: string
		}>(),
		{
			disabled: false,
			effects: () => [],
			selectedEffectId: null,
			opacity: 100,
			details: 110,
			effectColor: '#8B6914',
			effectColorSecondary: '#EAB308'
		}
	)

	const emit = defineEmits<{
		(e: 'select', effectId: number | null): void
		(e: 'opacity-change', opacity: number): void
		(e: 'details-change', details: number): void
		(e: 'color-change', color: string): void
		(e: 'color-secondary-change', color: string): void
	}>()

	const effectControlKind = (effect: EffectOption, effects?: EffectOption[]): EffectControlKind => {
		const kind = resolveEffectKind(effect, effects)
		if (kind === 'duotone') return 'dual-color'
		if (kind === 'sepia') return 'color'
		return 'amount'
	}

	const effectPreviewSrc = (effect: EffectOption) => {
		const url = effect.image_url?.trim()
		return url ? mediaUrlForCanvas(url) : EFFECT_NONE.preview
	}

	const effectOptions = computed((): EffectListItem[] => {
		const fromProduct = getSortedEffects(props.effects)
			.filter((effect) => effect?.name?.trim())
			.map((effect) => ({
				id: effect.id,
				name: effect.name,
				preview: effectPreviewSrc(effect)
			}))
		return [EFFECT_NONE, ...fromProduct]
	})

	const selectedEffectItem = computed(
		() => (props.effects ?? []).find((effect) => effect.id === props.selectedEffectId) ?? null
	)

	const activeControlKind = computed(() => {
		if (props.selectedEffectId == null || !selectedEffectItem.value) return null
		return effectControlKind(selectedEffectItem.value, props.effects)
	})

	const showAmount = computed(() => props.selectedEffectId != null)
	const showColor = computed(() => activeControlKind.value === 'color')
	const showDualColor = computed(() => activeControlKind.value === 'dual-color')
	const showDetails = computed(() => {
		if (props.selectedEffectId == null || !selectedEffectItem.value) return false
		return effectUsesDetails(selectedEffectItem.value, props.effects)
	})

	const isEffectSelected = (id: number | null) => props.selectedEffectId === id

	const onOpacityInput = (e: Event) => {
		const value = Number((e.target as HTMLInputElement).value)
		if (!Number.isFinite(value)) return
		emit('opacity-change', value)
	}

	const onDetailsInput = (e: Event) => {
		const value = Number((e.target as HTMLInputElement).value)
		if (!Number.isFinite(value)) return
		emit('details-change', value)
	}

	const onColorInput = (e: Event) => {
		emit('color-change', (e.target as HTMLInputElement).value)
	}

	const onColorSecondaryInput = (e: Event) => {
		emit('color-secondary-change', (e.target as HTMLInputElement).value)
	}

	const rangeProgress = (value: number, max: number) => `${Math.min(100, Math.max(0, (value / max) * 100))}%`
</script>

<template>
	<div class="design-editor-effect-panel space-y-4">
		<div class="grid grid-cols-5 gap-1.5 sm:gap-2">
			<button
				v-for="effect in effectOptions"
				:key="effect.id ?? 'effect-none'"
				type="button"
				class="effect-thumb group aspect-square overflow-hidden rounded-md border-2 disabled:cursor-not-allowed disabled:opacity-60"
				:class="
					isEffectSelected(effect.id)
						? 'effect-thumb--active border-[#e11d48]'
						: 'border-transparent hover:border-[#d1d5db]'
				"
				:disabled="disabled"
				:aria-pressed="isEffectSelected(effect.id)"
				:title="effect.name"
				@click="emit('select', effect.id)"
			>
				<img :src="effect.preview" :alt="effect.name" class="h-full w-full object-cover" />
				<span
					class="effect-thumb__label"
					:class="isEffectSelected(effect.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
				>
					{{ effect.name }}
				</span>
			</button>
		</div>

		<div v-if="showAmount" class="space-y-4">
			<div class="design-editor-effect-panel__slider">
				<label :for="`effect-opacity-${selectedEffectId}`" class="design-editor-effect-panel__slider-label">
					Efekt Miktarı
				</label>
				<div class="design-editor-effect-panel__slider-row">
					<span class="design-editor-effect-panel__slider-edge">0</span>
					<input
						:id="`effect-opacity-${selectedEffectId}`"
						type="range"
						min="0"
						max="100"
						step="1"
						:value="opacity"
						class="design-editor-range flex-1"
						:style="{ '--range-progress': rangeProgress(opacity, 100) }"
						:disabled="disabled"
						@input="onOpacityInput"
					/>
					<span class="design-editor-effect-panel__slider-edge">{{ opacity }}</span>
				</div>
			</div>

			<div v-if="showDetails" class="design-editor-effect-panel__slider">
				<label :for="`effect-details-${selectedEffectId}`" class="design-editor-effect-panel__slider-label">
					Detaylar
				</label>
				<div class="design-editor-effect-panel__slider-row">
					<span class="design-editor-effect-panel__slider-edge">0</span>
					<input
						:id="`effect-details-${selectedEffectId}`"
						type="range"
						min="0"
						max="110"
						step="1"
						:value="details"
						class="design-editor-range flex-1"
						:style="{ '--range-progress': rangeProgress(details, 110) }"
						:disabled="disabled"
						@input="onDetailsInput"
					/>
					<span class="design-editor-effect-panel__slider-edge">{{ details }}</span>
				</div>
			</div>

			<div v-if="showColor" class="design-editor-effect-panel__color">
				<label :for="`effect-color-${selectedEffectId}`" class="design-editor-effect-panel__slider-label">
					Renk
				</label>
				<input
					:id="`effect-color-${selectedEffectId}`"
					type="color"
					:value="effectColor"
					class="design-editor-effect-panel__color-input"
					:disabled="disabled"
					@input="onColorInput"
				/>
			</div>

			<template v-if="showDualColor">
				<div class="design-editor-effect-panel__color">
					<label :for="`effect-color-1-${selectedEffectId}`" class="design-editor-effect-panel__slider-label">
						Birinci Renk
					</label>
					<input
						:id="`effect-color-1-${selectedEffectId}`"
						type="color"
						:value="effectColor"
						class="design-editor-effect-panel__color-input"
						:disabled="disabled"
						@input="onColorInput"
					/>
				</div>
				<div class="design-editor-effect-panel__color">
					<label :for="`effect-color-2-${selectedEffectId}`" class="design-editor-effect-panel__slider-label">
						İkinci Renk
					</label>
					<input
						:id="`effect-color-2-${selectedEffectId}`"
						type="color"
						:value="effectColorSecondary"
						class="design-editor-effect-panel__color-input"
						:disabled="disabled"
						@input="onColorSecondaryInput"
					/>
				</div>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.effect-thumb {
		position: relative;
		background: #f3f4f6;
	}

	.effect-thumb__label {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		padding: 4px 2px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		font-size: 10px;
		font-weight: 600;
		line-height: 1.2;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: opacity 0.2s ease;
	}

	.design-editor-effect-panel__slider-label {
		display: block;
		margin-bottom: 8px;
		font-size: 13px;
		font-weight: 700;
		color: #101828;
	}

	.design-editor-effect-panel__slider-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.design-editor-effect-panel__slider-edge {
		min-width: 1.5rem;
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.design-editor-effect-panel__color-input {
		display: block;
		width: 100%;
		height: 42px;
		padding: 4px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #fff;
		cursor: pointer;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.design-editor-range {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			#9ca3af 0%,
			#9ca3af var(--range-progress, 50%),
			#e5e7eb var(--range-progress, 50%),
			#e5e7eb 100%
		);
		outline: none;
		cursor: pointer;

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: #fff;
			border: 1px solid #d1d5db;
			box-shadow: 0 1px 3px rgba(16, 24, 40, 0.18);
			cursor: pointer;
		}

		&::-moz-range-thumb {
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: #fff;
			border: 1px solid #d1d5db;
			box-shadow: 0 1px 3px rgba(16, 24, 40, 0.18);
			cursor: pointer;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
</style>
