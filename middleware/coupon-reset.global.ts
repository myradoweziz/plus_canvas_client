import { defineNuxtRouteMiddleware } from '#app'
import { useCartStore } from '~/stores/cart'

export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.client && from && from.path !== to.path) {
        const isCartOrCheckout = (path: string) => path === '/cart' || path === '/checkout'
        if (isCartOrCheckout(from.path) && !isCartOrCheckout(to.path)) {
            const cartStore = useCartStore()
            if (cartStore.appliedCoupon) {
                cartStore.removeCoupon()
            }
        }
    }
})
