<script setup lang="ts">
	import type { BreadcrumbItem } from '~/utils/types'

	defineProps<{
		items: BreadcrumbItem[]
		white?: boolean
	}>()
</script>

<template>
	<nav class="flex items-center gap-2 text-sm md:text-base font-medium" :class="white ? 'text-white' : 'text-gray-600'">
		<div v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
			<nuxt-link v-if="item.link" :to="item.link" class="hover:underline transition-all opacity-80 hover:opacity-100">
				{{ item.label }}
			</nuxt-link>
			<span v-else class="opacity-60">{{ item.label }}</span>

			<span v-if="index < items.length - 1" class="opacity-40">/</span>
		</div>
	</nav>
</template>

<style scoped></style>
