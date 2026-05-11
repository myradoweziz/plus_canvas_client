<script setup lang="ts">
	useHead({
		title: 'Ana Sayfa | PlusCanvas'
	})

	const homeStore = useHomeStore()
	await homeStore.fetchHomePage()
</script>

<template>
	<main>
		<home-banner :banners="homeStore.banners" :status="homeStore.bannersStatus" />
		<home-canvas-steps />
		<home-featured-categories :categories="homeStore.featuredCategories" />
		<home-personalized-canvas-paintings />
		<home-popular-categories :categories="homeStore.mostSearchedCategories" />
		<home-best-sellers />
		<home-discounts :discounts="homeStore.discounts" :main-category-id="homeStore.mainCategoryId" />
		<home-gallery />
		<home-frequently-asked-questions :faqs="homeStore.faqs" />
		<home-custom-text />
		<home-customer-reviews />
	</main>
</template>

<style lang="scss" scoped></style>
