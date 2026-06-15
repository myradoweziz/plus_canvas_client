<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	const FONT_OPTIONS = ['Roboto', 'Inter', 'Montserrat', 'Open Sans'] as const

	const props = withDefaults(
		defineProps<{
			disabled?: boolean
			modelValue?: string
			fontFamily?: string
			color?: string
		}>(),
		{
			disabled: false,
			modelValue: '',
			fontFamily: 'Roboto',
			color: '#101828'
		}
	)

	const emit = defineEmits<{
		(e: 'update:modelValue', value: string): void
		(e: 'update:fontFamily', value: string): void
		(e: 'update:color', value: string): void
	}>()

	const showFontMenu = ref(false)

	const onTextInput = (e: Event) => {
		emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
	}

	const onColorInput = (e: Event) => {
		emit('update:color', (e.target as HTMLInputElement).value)
	}

	const selectFont = (font: string) => {
		emit('update:fontFamily', font)
		showFontMenu.value = false
	}

	const textareaPreviewStyle = computed(() => ({
		color: props.color,
		fontFamily: props.fontFamily
	}))
</script>

<template>
	<div class="design-editor-text-panel rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
		<h3 class="text-sm font-bold text-[#101828]">Tabloya Yazı Ekleyin</h3>

		<textarea
			:value="modelValue"
			class="design-editor-text-panel__textarea mt-3 min-h-[88px] w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm font-bold outline-none transition-shadow placeholder:text-[#98A2B3] focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/15 disabled:opacity-60"
			:style="textareaPreviewStyle"
			placeholder="Yazı yaz..."
			:disabled="disabled"
			@input="onTextInput"
		/>

		<div class="mt-3 flex flex-wrap items-end gap-3">
			<div class="relative">
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-full bg-[#2B7FFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
					:disabled="disabled"
					@click="showFontMenu = !showFontMenu"
				>
					{{ fontFamily }}
					<Icon name="arrowRight" class="h-3.5 w-3.5 rotate-90" />
				</button>
				<div
					v-if="showFontMenu"
					class="absolute left-0 top-full z-20 mt-2 min-w-[140px] rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg"
				>
					<button
						v-for="font in FONT_OPTIONS"
						:key="font"
						type="button"
						class="block w-full px-4 py-2 text-left text-sm hover:bg-[#F3F4F6]"
						:class="{ 'font-semibold text-[#2B7FFF]': fontFamily === font }"
						@click="selectFont(font)"
					>
						{{ font }}
					</button>
				</div>
			</div>

			<div class="min-w-[120px] flex-1">
				<label for="design-text-color" class="mb-1.5 block text-xs font-semibold text-[#6B7280]">Renk</label>
				<input
					id="design-text-color"
					type="color"
					:value="color"
					class="design-editor-text-panel__color-input"
					:disabled="disabled"
					@input="onColorInput"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.design-editor-text-panel__textarea {
		text-shadow:
			0 1px 2px rgba(0, 0, 0, 0.12),
			0 0 1px rgba(255, 255, 255, 0.8);
	}

	.design-editor-text-panel__color-input {
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
</style>
