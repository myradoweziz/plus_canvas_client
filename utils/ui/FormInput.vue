<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' | 'search'

	const props = withDefaults(
		defineProps<{
			id: string
			label: string
			modelValue: string
			type?: InputType
			name?: string
			placeholder?: string
			autocomplete?: string
			required?: boolean
			disabled?: boolean
			error?: string
			passwordToggle?: boolean
		}>(),
		{
			type: 'text',
			name: undefined,
			placeholder: undefined,
			autocomplete: undefined,
			required: false,
			disabled: false,
			error: undefined,
			passwordToggle: false
		}
	)

	const emit = defineEmits<{
		(e: 'update:modelValue', value: string): void
		(e: 'blur', evt: FocusEvent): void
		(e: 'focus', evt: FocusEvent): void
	}>()

	const showPassword = ref(false)
	const inputType = computed<InputType>(() => {
		if (props.type !== 'password') return props.type
		if (!props.passwordToggle) return 'password'
		return showPassword.value ? 'text' : 'password'
	})
</script>

<template>
	<div>
		<label :for="props.id" class="block text-sm font-medium text-[#364153] mb-2">
			{{ props.label }}
			<span v-if="props.required" class="text-red-500"> *</span>
		</label>
		<div class="relative">
			<input
				:id="props.id"
				:value="props.modelValue"
				:type="inputType"
				:name="props.name"
				:placeholder="props.placeholder"
				:autocomplete="props.autocomplete"
				:required="props.required"
				:disabled="props.disabled"
				class="pc-input w-full rounded-2xl border-2 bg-white px-4 py-3.5 placeholder:text-[#98A2B3] outline-none transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
				:class="[
					props.error ? 'border-red-300' : 'border-[#E5E7EB]',
					props.type === 'password' && props.passwordToggle ? 'pr-12' : ''
				]"
				@input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
				@blur="emit('blur', $event)"
				@focus="emit('focus', $event)"
			/>

			<button
				v-if="props.type === 'password' && props.passwordToggle"
				type="button"
				class="absolute inset-y-0 top-1/2 -translate-y-1/2 right-2 my-auto h-9 w-9 rounded-xl text-[#215EA5] hover:bg-[#2B7FFF]/10 transition-all"
				:aria-label="showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'"
				@click="showPassword = !showPassword"
			>
				<Icon :name="showPassword ? 'eyeSlash' : 'eye'" class="w-5 h-5" />
			</button>
		</div>
		<p v-if="props.error" class="mt-2 text-sm font-medium text-red-600">
			{{ props.error }}
		</p>
	</div>
</template>

<style scoped>
	.pc-input:focus {
		box-shadow: 0 0 0 4px rgba(43, 127, 255, 0.12);
		border-color: rgba(43, 127, 255, 0.55);
	}

	.pc-input.border-red-300:focus {
		box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
		border-color: rgba(220, 38, 38, 0.55);
	}
</style>
