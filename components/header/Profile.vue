<script setup lang="ts">
	import { storeToRefs } from 'pinia'

	import Icon from '~/utils/ui/Icon.vue'

	type ProfileItem = {
		title: string
		icon?: string
		link?: string
		isLogout?: boolean
	}

	const authStore = useAuthStore()
	const { user, authorizationToken } = storeToRefs(authStore)
	const route = useRoute()

	const profileItems = computed<ProfileItem[]>(() => {
		if (authorizationToken.value) {
			const displayName = user.value?.name?.trim() || ''
			return [
				{ title: displayName, link: '/profile' },
				{ icon: 'favorite', title: 'Favorilerim', link: '/profile/favorites' },
				{ icon: 'user', title: 'Hesabım', link: '/profile' },
				{ icon: 'car', title: 'Sipariş takibi', link: '/profile/orders' },
				{ icon: 'logout', title: 'Çıkış Yap', isLogout: true }
			]
		}

		return [
			{ title: 'Giriş Yap', link: '/login', icon: 'logout' },
			{ icon: 'favorite', title: 'Favorilerim', link: '/profile/favorites' },
			{ icon: 'user', title: 'Hesabım', link: '/profile' },
			{ icon: 'car', title: 'Sipariş takibi', link: '/profile/orders' }
		]
	})

	const showProfileMenu = ref<boolean>(false)
	const profileMenu = ref<HTMLDivElement | null>(null)
	const profileContainer = ref<HTMLDivElement | null>(null)

	watch(
		() => route.fullPath,
		() => {
			showProfileMenu.value = false
		}
	)

	const handleLogout = async () => {
		// Сначала закрываем меню, затем логаут без редиректа — чтобы пункты обновились мгновенно
		showProfileMenu.value = false
		await authStore.logout('manual', false)
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (profileContainer.value && !profileContainer.value.contains(event.target as Node)) {
			showProfileMenu.value = false
		}
	}

	onMounted(async () => {
		document.addEventListener('click', handleClickOutside)
		authStore.syncTokenFromCookie()
		if (authorizationToken.value) {
			await authStore.getMe()
		}
	})

	onUnmounted(() => {
		document.removeEventListener('click', handleClickOutside)
		profileMenu.value = null
	})

	const openProfileMenu = (index: number) => {
		if (index === 0) {
			showProfileMenu.value = !showProfileMenu.value
		} else {
			showProfileMenu.value = false
		}
	}
</script>

<template>
	<div class="flex items-center gap-4 relative" ref="profileContainer">
		<Icon
			name="profile"
			@click="openProfileMenu(0)"
			class="hidden md:block hover:text-[#215EA5] transition-all duration-300"
		/>
		<div class="relative cursor-pointer group" @click="openProfileMenu(1)">
			<Icon name="basket" class="group-hover:text-[#215EA5] transition-all duration-300" />
			<span
				class="absolute -top-1.5 -right-2 bg-[#215EA5] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full pointer-events-none transition-transform group-hover:scale-110"
			>
				0
			</span>
		</div>

		<nav
			ref="profileMenu"
			v-show="showProfileMenu"
			class="absolute top-10 -left-10 bg-white min-w-[160px] px-5 py-6 shadow-[0px_4px_4px_0px_#D5D2CD40] rounded-[14px] text-sm text-[#101828]"
		>
			<ul class="flex flex-col gap-6">
				<li v-for="(profileItem, index) in profileItems" :key="index" class="cursor-pointer">
					<button
						v-if="profileItem.isLogout"
						type="button"
						class="flex items-center gap-3 w-full text-left hover:underline hover:text-[#215EA5] transition-all duration-300"
						@click="handleLogout"
					>
						<Icon v-if="profileItem.icon" :name="profileItem.icon" />
						{{ profileItem.title }}
					</button>
					<nuxt-link
						v-else
						:to="profileItem.link || '#'"
						class="flex items-center gap-3 hover:underline hover:text-[#215EA5] transition-all duration-300"
					>
						<Icon v-if="profileItem.icon" :name="profileItem.icon" />
						{{ profileItem.title }}
					</nuxt-link>
				</li>
			</ul>
		</nav>
	</div>
</template>

<style scoped>
	:deep(svg) {
		cursor: pointer;
	}
</style>
