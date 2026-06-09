<script setup lang="ts">
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
		}>(),
		{
			disabled: false,
			effects: () => [],
			cropSizeLabel: '—',
			cropPositionLabel: 'X:0 Y:0'
		}
	)

	const emit = defineEmits<{
		(e: 'tool-change', tool: EditorToolId | null): void
		(e: 'effect-select', effectId: number | null): void
		(e: 'effect-opacity-change', opacity: number): void
		(e: 'text-change', value: string): void
		(e: 'text-apply', payload: { text: string; fontFamily: string; color: string }): void
		(e: 'crop-undo'): void
		(e: 'crop-redo'): void
		(e: 'crop-zoom-in'): void
		(e: 'crop-zoom-out'): void
		(e: 'crop-rotate'): void
		(e: 'crop-apply'): void
	}>()

	const stickyTools: StickyTool[] = [
		{ id: 'effect', name: 'Efekt', icon: 'effect' },
		{ id: 'text', name: 'Yazı', icon: 'textIcon' },
		{ id: 'frame', name: 'Kadraj', icon: 'frame' }
	]

	const activeTool = ref<EditorToolId | null>(null)
	const selectedEffectId = ref<number | null>(null)
	const effectOpacity = ref(100)
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
		emit('effect-opacity-change', effectOpacity.value)
	}

	const onEffectOpacityChange = (value: number) => {
		effectOpacity.value = value
		emit('effect-opacity-change', value)
	}

	const onTextApply = () => {
		emit('text-apply', {
			text: textValue.value,
			fontFamily: textFontFamily.value,
			color: textColor.value
		})
	}
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
				@select="onEffectSelect"
				@opacity-change="onEffectOpacityChange"
			/>

			<ProductDesignEditorTextPanel
				v-else-if="activeTool === 'text'"
				v-model="textValue"
				v-model:font-family="textFontFamily"
				v-model:color="textColor"
				:disabled="disabled"
				@apply="onTextApply"
				@update:model-value="emit('text-change', $event)"
			/>

			<ProductDesignEditorCropPanel
				v-else-if="activeTool === 'frame'"
				:disabled="disabled"
				:crop-size-label="cropSizeLabel"
				:position-label="cropPositionLabel"
				@undo="emit('crop-undo')"
				@redo="emit('crop-redo')"
				@zoom-in="emit('crop-zoom-in')"
				@zoom-out="emit('crop-zoom-out')"
				@rotate="emit('crop-rotate')"
				@apply="emit('crop-apply')"
			/>
		</div>
	</div>
</template>
