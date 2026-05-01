<script setup lang="ts">
	const route = useRoute()
	const categoryId = route.params.categoryId
</script>

<template>
	<div>{{ categoryId }}</div>
</template>

<style lang="scss" scoped></style>
