<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	const TEXT_COLORS = ['#FFFFFF', '#101828', '#EF4444', '#EAB308', '#9CA3AF'] as const
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
		(e: 'apply'): void
	}>()

	const showFontMenu = ref(false)

	const onTextInput = (e: Event) => {
		emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
	}

	const selectFont = (font: string) => {
		emit('update:fontFamily', font)
		showFontMenu.value = false
	}

	const selectColor = (color: string) => {
		emit('update:color', color)
	}

	const isColorActive = (color: string) => props.color.toLowerCase() === color.toLowerCase()
</script>

<template>
	<div class="design-editor-text-panel rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-sm font-bold text-[#101828]">Tabloya Yazı Ekleyin</h3>
			<button
				type="button"
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2B7FFF] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				:disabled="disabled || !modelValue.trim()"
				aria-label="Yazıyı uygula"
				@click="emit('apply')"
			>
				<Icon name="checked" class="h-4 w-4" />
			</button>
		</div>

		<textarea
			:value="modelValue"
			class="mt-3 min-h-[88px] w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#101828] outline-none transition-shadow placeholder:text-[#98A2B3] focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/15 disabled:opacity-60"
			placeholder="Yazı yaz..."
			:disabled="disabled"
			@input="onTextInput"
		/>

		<div class="mt-3 flex flex-wrap items-center gap-3">
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

			<div class="flex items-center gap-2">
				<button
					v-for="color in TEXT_COLORS"
					:key="color"
					type="button"
					class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-60"
					:class="isColorActive(color) ? 'border-[#2B7FFF] ring-2 ring-[#2B7FFF]/20' : 'border-transparent'"
					:style="{ backgroundColor: color }"
					:disabled="disabled"
					:aria-label="`Renk ${color}`"
					@click="selectColor(color)"
				/>
			</div>
		</div>
	</div>
</template>
