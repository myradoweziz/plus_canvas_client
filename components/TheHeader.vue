<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { ContactInfo } from '~/utils/types'

	defineProps<{
		contactInfo: ContactInfo
	}>()

	const headerRef = ref<HTMLElement | null>(null)
	const isScrolled = ref(false)

	const handleScroll = () => {
		isScrolled.value = window.scrollY > 0
	}

	onMounted(() => {
		window.addEventListener('scroll', handleScroll)
	})

	onUnmounted(() => {
		window.removeEventListener('scroll', handleScroll)
	})
</script>

<template>
	<header
		class="sticky top-0 z-50 bg-[#F6F6F6] transition-all duration-300"
		:class="{ 'shadow-lg shadow-black/30': isScrolled }"
		ref="headerRef"
	>
		<div class="max-w-[1400px] mx-auto py-2 md:py-2">
			<div class="hidden md:block">
				<header-top />
			</div>

			<div class="border-b border-gray-50 pt-4 md:pt-6 flex items-center justify-between">
				<nuxt-link to="/" class="mr-auto ml-4 md:m-0">
					<img :src="contactInfo.logo_path" alt="plus_logo" class="h-8 md:h-auto object-contain" />
				</nuxt-link>
				<div class="hidden md:block">
					<header-menu />
				</div>

				<header-profile />
				<button class="md:hidden text-gray-800 p-1 pl-4">
					<Icon name="hamburger" class="w-6 h-6" />
				</button>
			</div>
		</div>
	</header>
</template>

<style lang="scss" scoped></style>
