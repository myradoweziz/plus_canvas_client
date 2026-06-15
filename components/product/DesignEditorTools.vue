<script setup lang="ts">
	import {
		defaultEffectColors,
		effectUsesDetails,
		getSortedEffects,
		resolveEffectKind
	} from '~/utils/canvasEffectFilters'
	import type { EditorToolId } from '~/utils/productEditorTypes'
	import type { EffectOption } from '~/utils/types'
	import Icon from '~/utils/ui/Icon.vue'

	type StickyTool = {
		id: EditorToolId
		name: string
		icon: string
	}

	const props = withDefaults(
		defineProps<{
			disabled?: boolean
			effects?: EffectOption[]
			cropSizeLabel?: string
			cropPositionLabel?: string
			canCropUndo?: boolean
			canCropRedo?: boolean
		}>(),
		{
			disabled: false,
			effects: () => [],
			cropSizeLabel: '—',
			cropPositionLabel: 'X:0 Y:0',
			canCropUndo: false,
			canCropRedo: false
		}
	)

	const emit = defineEmits<{
		(e: 'tool-change', tool: EditorToolId | null): void
		(e: 'effect-select', effectId: number | null): void
		(e: 'effect-opacity-change', opacity: number): void
		(e: 'effect-details-change', details: number): void
		(e: 'effect-color-change', color: string): void
		(e: 'effect-color-secondary-change', color: string): void
		(e: 'text-apply', payload: { text: string; fontFamily: string; color: string }): void
		(e: 'text-style-change', payload: { text: string; fontFamily: string; color: string }): void
		(e: 'crop-undo'): void
		(e: 'crop-redo'): void
		(e: 'crop-zoom-in'): void
		(e: 'crop-zoom-out'): void
		(e: 'crop-rotate'): void
	}>()

	const stickyTools: StickyTool[] = [
		{ id: 'effect', name: 'Efekt', icon: 'effect' },
		{ id: 'text', name: 'Yazı', icon: 'textIcon' },
		{ id: 'frame', name: 'Kadraj', icon: 'frame' }
	]

	const activeTool = ref<EditorToolId | null>(null)
	const selectedEffectId = ref<number | null>(null)
	const effectOpacity = ref(100)
	const effectDetails = ref(110)
	const effectColor = ref('#8B6914')
	const effectColorSecondary = ref('#EAB308')
	const textValue = ref('')
	const textFontFamily = ref('Roboto')
	const textColor = ref('#101828')

	const isToolActive = (id: EditorToolId) => activeTool.value === id

	const toggleTool = (id: EditorToolId) => {
		if (props.disabled) return
		activeTool.value = activeTool.value === id ? null : id
		emit('tool-change', activeTool.value)
	}

	const onEffectSelect = (id: number | null) => {
		if (props.disabled) return
		selectedEffectId.value = id
		emit('effect-select', id)
		if (id == null) return

		const effect = (props.effects ?? []).find((item) => Number(item.id) === Number(id))
		if (effect) {
			const kind = resolveEffectKind(effect, props.effects)
			const presetColors = defaultEffectColors(kind)
			if (kind === 'sepia' || kind === 'duotone') {
				effectColor.value = presetColors.color
				emit('effect-color-change', presetColors.color)
			}
			if (kind === 'duotone') {
				effectColorSecondary.value = presetColors.colorSecondary
				emit('effect-color-secondary-change', presetColors.colorSecondary)
			}
			if (effectUsesDetails(effect, props.effects)) {
				effectDetails.value = 110
				emit('effect-details-change', 110)
			}
		}

		emit('effect-opacity-change', effectOpacity.value)
	}

	const onEffectOpacityChange = (value: number) => {
		effectOpacity.value = value
		emit('effect-opacity-change', value)
	}

	const onEffectDetailsChange = (value: number) => {
		effectDetails.value = value
		emit('effect-details-change', value)
	}

	const onEffectColorChange = (value: string) => {
		effectColor.value = value
		emit('effect-color-change', value)
	}

	const onEffectColorSecondaryChange = (value: string) => {
		effectColorSecondary.value = value
		emit('effect-color-secondary-change', value)
	}

	const buildTextPayload = () => ({
		text: textValue.value,
		fontFamily: textFontFamily.value,
		color: textColor.value
	})

	const debouncedApplyText = useDebounce(() => {
		emit('text-apply', buildTextPayload())
	}, 300)

	watch(textValue, debouncedApplyText)

	const emitTextStyleChange = () => {
		emit('text-style-change', buildTextPayload())
	}

	watch([textFontFamily, textColor], emitTextStyleChange)
</script>

<template>
	<div class="design-editor-tools">
		<div class="flex gap-4 pt-4">
			<button
				v-for="tool in stickyTools"
				:key="tool.id"
				type="button"
				class="border-2 p-4 py-2 rounded-xl flex items-center flex-col gap-2 w-[72px] h-[62px] cursor-pointer transition-all duration-200 group disabled:cursor-not-allowed disabled:opacity-60"
				:class="
					isToolActive(tool.id)
						? 'bg-[#2B7FFF] border-[#2B7FFF] text-white'
						: 'border-[#E5E7EB] bg-white hover:bg-[#2B7FFF] hover:border-[#2B7FFF]'
				"
				:disabled="disabled"
				:aria-pressed="isToolActive(tool.id)"
				@click="toggleTool(tool.id)"
			>
				<Icon
					:name="tool.icon"
					class="w-5 h-5"
					:class="isToolActive(tool.id) ? 'text-white' : 'group-hover:text-white'"
				/>
				<p
					class="font-semibold text-xs"
					:class="isToolActive(tool.id) ? 'text-white' : 'text-[#364153] group-hover:text-white'"
				>
					{{ tool.name }}
				</p>
			</button>
		</div>

		<div v-if="activeTool" class="mt-4">
			<ProductDesignEditorEffectPanel
				v-if="activeTool === 'effect'"
				:effects="effects"
				:disabled="disabled"
				:selected-effect-id="selectedEffectId"
				:opacity="effectOpacity"
				:details="effectDetails"
				:effect-color="effectColor"
				:effect-color-secondary="effectColorSecondary"
				@select="onEffectSelect"
				@opacity-change="onEffectOpacityChange"
				@details-change="onEffectDetailsChange"
				@color-change="onEffectColorChange"
				@color-secondary-change="onEffectColorSecondaryChange"
			/>

			<ProductDesignEditorTextPanel
				v-else-if="activeTool === 'text'"
				v-model="textValue"
				v-model:font-family="textFontFamily"
				v-model:color="textColor"
				:disabled="disabled"
			/>

			<ProductDesignEditorCropPanel
				v-else-if="activeTool === 'frame'"
				:disabled="disabled"
				:can-undo="canCropUndo"
				:can-redo="canCropRedo"
				:crop-size-label="cropSizeLabel"
				:position-label="cropPositionLabel"
				@undo="emit('crop-undo')"
				@redo="emit('crop-redo')"
				@zoom-in="emit('crop-zoom-in')"
				@zoom-out="emit('crop-zoom-out')"
				@rotate="emit('crop-rotate')"
			/>
		</div>
	</div>
</template>
