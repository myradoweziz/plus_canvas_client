<script setup lang="ts">
	import icons from '@/helpers/icons'

	const props = withDefaults(defineProps<{ name: string }>(), {
		name: ''
	})

	const path = computed<string>(() => {
		return (icons as any)[props.name]
	})
</script>

<template>
	<span class="flex items-center justify-center cursor-pointer" v-html="path" />
</template>
