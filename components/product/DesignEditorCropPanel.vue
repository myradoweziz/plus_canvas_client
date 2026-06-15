<script setup lang="ts">
	const props = withDefaults(
		defineProps<{
			disabled?: boolean
			canUndo?: boolean
			canRedo?: boolean
			cropSizeLabel?: string
			positionLabel?: string
		}>(),
		{
			disabled: false,
			canUndo: false,
			canRedo: false,
			cropSizeLabel: '—',
			positionLabel: 'X:0 Y:0'
		}
	)

	const emit = defineEmits<{
		(e: 'undo'): void
		(e: 'redo'): void
		(e: 'zoom-out'): void
		(e: 'zoom-in'): void
		(e: 'rotate'): void
	}>()
</script>

<template>
	<div class="design-editor-crop-panel rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
		<h3 class="text-sm font-bold text-[#101828]">Kadraj Ayarla</h3>
		<p class="mt-1 text-xs leading-relaxed text-[#6B7280]">
			Fotoğrafınızın tablodaki konumunu ayarlayın. Kadrajı canvas üzerinde sürükleyerek düzenleyin.
		</p>

		<div class="mt-4 flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="editor-crop-btn"
				:disabled="disabled || !canUndo"
				aria-label="Geri al"
				@click="emit('undo')"
			>
				↶
			</button>
			<button
				type="button"
				class="editor-crop-btn"
				:disabled="disabled || !canRedo"
				aria-label="Yinele"
				@click="emit('redo')"
			>
				↷
			</button>
			<button
				type="button"
				class="editor-crop-btn"
				:disabled="disabled"
				aria-label="Uzaklaştır"
				@click="emit('zoom-out')"
			>
				−
			</button>
			<button
				type="button"
				class="editor-crop-btn"
				:disabled="disabled"
				aria-label="Yakınlaştır"
				@click="emit('zoom-in')"
			>
				+
			</button>
			<button type="button" class="editor-crop-btn" :disabled="disabled" aria-label="Döndür" @click="emit('rotate')">
				↻
			</button>
		</div>

		<div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
			<span>Fotoğraf: {{ cropSizeLabel }}</span>
			<span>Merkez: {{ positionLabel }}</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	.editor-crop-btn {
		@apply flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-lg font-medium text-[#364153] transition-colors hover:border-[#2B7FFF] hover:text-[#2B7FFF] disabled:cursor-not-allowed disabled:opacity-50;
	}
</style>
