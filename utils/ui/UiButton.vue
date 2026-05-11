<script setup lang="ts">
	type ButtonVariant = 'primary' | 'secondary'
	type ButtonSize = 'md' | 'lg'

	const props = withDefaults(
		defineProps<{
			type?: 'button' | 'submit' | 'reset'
			variant?: ButtonVariant
			size?: ButtonSize
			disabled?: boolean
			full?: boolean
			class?: string
		}>(),
		{
			type: 'button',
			variant: 'primary',
			size: 'lg',
			disabled: false,
			full: false,
			class: ''
		}
	)
</script>

<template>
	<button
		:type="props.type"
		:disabled="props.disabled"
		class="pc-btn inline-flex items-center justify-center font-semibold rounded-2xl transition-all select-none disabled:opacity-60 disabled:cursor-not-allowed"
		:class="[
			props.full ? 'w-full' : '',
			props.size === 'md' ? 'py-2.5 px-4 text-sm' : 'py-3.5 px-4 text-base',
			props.variant === 'primary'
				? 'bg-[#2B7FFF] hover:bg-[#1853a0] text-white shadow-md shadow-blue-100/80'
				: 'bg-white border-2 border-[#E5E7EB] text-[#101828] hover:border-[#2B7FFF]',
			props.class
		]"
	>
		<slot />
	</button>
</template>

<style scoped>
	.pc-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px rgba(43, 127, 255, 0.14);
	}
</style>

