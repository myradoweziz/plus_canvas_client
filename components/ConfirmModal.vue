<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
	isOpen: boolean
	title?: string
	message?: string
	confirmText?: string
	cancelText?: string
}>(), {
	title: 'Silmek İstediğinize Emin Misiniz?',
	message: 'Bu işlemi geri alamayacaksınız.',
	confirmText: 'Evet, Sil',
	cancelText: 'İptal'
})

const emit = defineEmits<{
	(e: 'confirm'): void
	(e: 'cancel'): void
}>()
</script>

<template>
	<Teleport to="body">
		<Transition name="fade">
			<div v-if="isOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
				<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cancel')"></div>
				
				<div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6">
					<div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
						<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</div>
					
					<h3 class="text-lg font-bold text-gray-900 text-center mb-2">{{ title }}</h3>
					<p class="text-sm text-gray-500 text-center mb-6">{{ message }}</p>
					
					<div class="flex gap-3">
						<button 
							@click="emit('cancel')" 
							class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
						>
							{{ cancelText }}
						</button>
						<button 
							@click="emit('confirm')" 
							class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
						>
							{{ confirmText }}
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
