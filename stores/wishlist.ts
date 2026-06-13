import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
    const wishlistItems = ref<any[]>([])
    const sessionId = ref<string | null>(null)

    // Load session_id from localStorage on init
    if (import.meta.client) {
        sessionId.value = localStorage.getItem('wishlist_session_id')
    }

    const fetchWishlist = async () => {
        try {
            const { $customFetch } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }
            
            const response: any = await $customFetch('/api/wishlists', {
                headers
            })

            if (response && response.session_id) {
                sessionId.value = response.session_id
                if (import.meta.client) {
                    localStorage.setItem('wishlist_session_id', response.session_id)
                }
            }

            if (response && response.wishlist) {
                wishlistItems.value = response.wishlist.items || []
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error)
        }
    }

    const addToWishlist = async (productId: number, options = {}) => {
        try {
            const { $customFetch, $toast } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            const response: any = await $customFetch('/api/wishlists', {
                method: 'POST',
                headers,
                body: {
                    canvas_product_id: productId,
                    options
                }
            })

            if (response && response.session_id) {
                sessionId.value = response.session_id
                if (import.meta.client) {
                    localStorage.setItem('wishlist_session_id', response.session_id)
                }
            }

            if (response && response.wishlist) {
                wishlistItems.value = response.wishlist.items || []
                $toast.success('Ürün favorilerinize eklendi.')
            }
        } catch (error) {
            const { $toast } = useNuxtApp()
            console.error('Failed to add to wishlist:', error)
            $toast.error('Ürün favorilere eklenirken bir hata oluştu.')
        }
    }

    const removeFromWishlist = async (itemId: number) => {
        try {
            const { $customFetch } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            await $customFetch(`/api/wishlists/${itemId}`, {
                method: 'DELETE',
                headers
            })

            // Filter item locally immediately for better UX
            wishlistItems.value = wishlistItems.value.filter(item => item.id !== itemId)
            
            // Refetch to get updated list
            fetchWishlist()
        } catch (error) {
            console.error('Failed to remove item:', error)
        }
    }

    return {
        wishlistItems,
        sessionId,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist
    }
})
