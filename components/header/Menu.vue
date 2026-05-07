<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'
	import CategoryMenu from './CategoryMenu.vue'

	const route = useRoute()
	const isCategoriesOpen = ref(false)
	let closeTimeout: any = null

	const openCategories = () => {
		if (closeTimeout) clearTimeout(closeTimeout)
		isCategoriesOpen.value = true
	}

	const closeCategories = () => {
		closeTimeout = setTimeout(() => {
			isCategoriesOpen.value = false
		}, 300)
	}

	const menu = [
		{ id: 0, title: 'KİŞİYE ÖZEL KANVAS TABLO', link: '/catalog/1' },
		{ id: 1, title: 'KATEGORİLER', link: '/categories' },
		{ id: 2, title: 'GALERI', link: '/gallery' }
	]
</script>

<template>
	<div class="relative">
		<ul class="flex gap-10">
			<li
				v-for="item in menu"
				:key="item.id"
				class="py-4"
				@mouseenter="item.id === 1 ? openCategories() : null"
				@mouseleave="item.id === 1 ? closeCategories() : null"
			>
				<nuxt-link
					:to="item.link"
					class="font-medium text-sm uppercase flex items-center gap-2 hover:text-[#215EA5] hover:underline transition-all duration-300"
					:class="route.path === item.link ? 'text-[#215EA5] underline' : 'text-[#101828]'"
				>
					{{ item.title }}
					<Icon
						v-if="item.id === 1"
						name="arrowBottom"
						class="w-4 h-4 transition-transform duration-300"
						:class="{ 'rotate-180': isCategoriesOpen }"
					/>

					<!-- Animated underline for active/hover state -->
					<span
						class="absolute -bottom-1 left-0 h-[2px] bg-[#215EA5] transition-all duration-300"
						:class="
							route.path === item.link || (item.id === 1 && isCategoriesOpen) ? 'w-full' : 'w-0 group-hover:w-full'
						"
					></span>
				</nuxt-link>

				<!-- Marketplace Style Category Menu -->
				<Transition
					enter-active-class="transition duration-300 ease-out"
					enter-from-class="opacity-0 translate-y-4"
					enter-to-class="opacity-100 translate-y-0"
					leave-active-class="transition duration-200 ease-in"
					leave-from-class="opacity-100 translate-y-0"
					leave-to-class="opacity-0 translate-y-4"
				>
					<CategoryMenu
						v-if="item.id === 1 && isCategoriesOpen"
						@mouseenter="openCategories"
						@mouseleave="closeCategories"
					/>
				</Transition>
			</li>
		</ul>
	</div>
</template>

<style lang="scss" scoped></style>
