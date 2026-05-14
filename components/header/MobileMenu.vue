<script setup lang="ts">
	import Icon from '~/utils/ui/Icon.vue'

	import type { ContactInfo } from '~/utils/types'

	const props = defineProps<{
		isOpen: boolean
		contactInfo: ContactInfo
	}>()

	const emit = defineEmits<{
		(e: 'close'): void
	}>()

	const homeStore = useHomeStore()
	const route = useRoute()

	/** Aynı sıra ve metinler `header/Menu.vue` ile uyumlu. */
	const menu = computed(() => {
		const mid = homeStore.mainCategoryId
		const personalizedLink =
			mid != null && Number.isFinite(Number(mid)) ? `/products?main_category_id=${mid}` : '/products'
		return [
			{ id: 0, title: 'KİŞİYE ÖZEL KANVAS TABLO', link: personalizedLink },
			{ id: 1, title: 'KATEGORİLER', link: '/products' },
			{ id: 2, title: 'GALERI', link: '/gallery' }
		] as const
	})

	const close = () => emit('close')

	watch(
		() => route.fullPath,
		() => {
			if (props.isOpen) close()
		}
	)

	watch(
		() => props.isOpen,
		(open) => {
			if (!import.meta.client) return
			document.body.style.overflow = open ? 'hidden' : ''
		},
		{ immediate: true }
	)

	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && props.isOpen) close()
	}

	let removeMqListener: (() => void) | null = null

	onMounted(() => {
		if (!import.meta.client) return
		window.addEventListener('keydown', onKeydown)
		const mq = window.matchMedia('(min-width: 768px)')
		const onMq = () => {
			if (mq.matches && props.isOpen) close()
		}
		mq.addEventListener('change', onMq)
		removeMqListener = () => mq.removeEventListener('change', onMq)
	})

	onUnmounted(() => {
		if (!import.meta.client) return
		window.removeEventListener('keydown', onKeydown)
		removeMqListener?.()
		document.body.style.overflow = ''
	})
</script>

<template>
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="isOpen"
				class="fixed inset-0 z-[60] flex flex-col bg-white md:hidden"
				role="dialog"
				aria-modal="true"
				aria-label="Menü"
			>
				<div
					class="grid shrink-0 grid-cols-3 items-center border-b border-gray-100 px-2 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
				>
					<div class="flex justify-start">
						<button
							type="button"
							class="p-2 text-gray-800 rounded-lg hover:bg-gray-100"
							aria-label="Kapat"
							@click="close"
						>
							<Icon name="close" class="w-6 h-6" />
						</button>
					</div>
					<nuxt-link to="/" class="flex justify-center min-w-0" @click="close">
						<img
							:src="contactInfo.logo_path"
							alt="PlusCanvas"
							class="h-8 w-auto max-w-[min(140px,100%)] object-contain"
						/>
					</nuxt-link>
					<div class="flex justify-end">
						<nuxt-link to="/" class="p-2 text-gray-800 rounded-lg hover:bg-gray-100" aria-label="Sepet" @click="close">
							<Icon name="basket" class="w-6 h-6" />
						</nuxt-link>
					</div>
				</div>

				<div
					class="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10"
				>
					<nav class="flex w-full max-w-sm flex-col items-center gap-8" aria-label="Ana menü">
						<nuxt-link
							v-for="item in menu"
							:key="item.id"
							:to="item.link"
							class="text-center font-medium text-sm uppercase tracking-wide hover:text-[#215EA5] hover:underline transition-all duration-300"
							:class="route.path.includes(item.link) ? 'text-[#215EA5] underline' : 'text-[#101828]'"
							@click="close"
						>
							{{ item.title }}
						</nuxt-link>
					</nav>

					<div class="mt-12 flex items-center justify-center gap-8 text-sm font-medium text-[#101828]">
						<nuxt-link to="/login" class="hover:text-[#215EA5] transition-colors" @click="close">Giriş Yap</nuxt-link>
						<nuxt-link to="/register" class="hover:text-[#215EA5] transition-colors" @click="close">Kayıt Ol</nuxt-link>
					</div>

					<div class="mt-10 flex items-center justify-center gap-3">
						<a
							href="#"
							class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#215EA5] hover:bg-gray-50 transition-colors"
							aria-label="Facebook"
							@click="close"
						>
							<Icon name="facebook" class="h-5 w-5" />
						</a>
						<a
							href="#"
							class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#215EA5] hover:bg-gray-50 transition-colors"
							aria-label="Instagram"
							@click="close"
						>
							<Icon name="instagram" class="h-5 w-5" />
						</a>
						<a
							href="#"
							class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#215EA5] hover:bg-gray-50 transition-colors"
							aria-label="YouTube"
							@click="close"
						>
							<Icon name="youtube" class="h-5 w-5" />
						</a>
					</div>

					<p class="mt-auto max-w-md pt-16 text-center text-sm font-medium leading-5 text-[#6B7280]">
						{{ contactInfo.slogan }}
					</p>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
