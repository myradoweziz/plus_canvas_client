import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
    const wishlistItems = ref<any[]>([])
    const sessionId = ref<string | null>(null)

    // Load session_id from localStorage on init
    if (import.meta.client) {
        sessionId.value = localStorage.getItem('wishlist_session_id')
    }

    const PREVIEW_STORAGE_KEY_WISHLIST = 'pluscanvas:wishlist-item-previews'

    const loadStoredPreviews = (): Record<number, string> => {
        if (!import.meta.client) return {}
        try {
            const raw = localStorage.getItem(PREVIEW_STORAGE_KEY_WISHLIST)
            if (!raw) return {}
            const parsed = JSON.parse(raw) as Record<string, string>
            const next: Record<number, string> = {}
            for (const [id, src] of Object.entries(parsed)) {
                const numId = Number(id)
                if (Number.isFinite(numId) && String(src).trim()) next[numId] = String(src).trim()
            }
            return next
        } catch {
            return {}
        }
    }

    const saveStoredPreviews = () => {
        if (!import.meta.client) return
        localStorage.setItem(PREVIEW_STORAGE_KEY_WISHLIST, JSON.stringify(itemPreviewById.value))
    }

    const itemPreviewById = ref<Record<number, string>>(loadStoredPreviews())

    const pruneItemPreviews = (items: { id: number }[]) => {
        const ids = new Set(items.map((item) => item.id))
        const next: Record<number, string> = {}
        for (const [id, src] of Object.entries(itemPreviewById.value)) {
            if (ids.has(Number(id)) && src.trim()) next[Number(id)] = src
        }
        itemPreviewById.value = next
        saveStoredPreviews()
    }

    const getItemPreview = (itemId: number) => itemPreviewById.value[itemId] ?? ''

    const setItemPreview = (itemId: number, src: string) => {
        const trimmed = String(src ?? '').trim()
        if (!itemId || !trimmed) return
        itemPreviewById.value = { ...itemPreviewById.value, [itemId]: trimmed }
        saveStoredPreviews()
    }

    const attachPreviewToLatestItem = (productId: number, previewSrc: string) => {
        const trimmed = String(previewSrc ?? '').trim()
        if (!trimmed) return
        const match = [...wishlistItems.value].reverse().find((item) => item.canvas_product_id === productId)
        if (match) setItemPreview(match.id, trimmed)
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
                pruneItemPreviews(wishlistItems.value)
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error)
        }
    }

    const addToWishlist = async (productId: number, options: Record<string, unknown> = {}) => {
        try {
            const { $customFetch, $toast } = useNuxtApp()
            const headers: any = {}
            if (sessionId.value) {
                headers['X-Session-ID'] = sessionId.value
            }

            let previewUrl = String(options.preview_url ?? '').trim()
            const previewSrc = String(options.preview_src ?? '').trim()
            const apiOptions = { ...options }

            // If we have a base64 preview, upload it to the backend to get a permanent URL
            if (!previewUrl && previewSrc && previewSrc.startsWith('data:image/')) {
                try {
                    const res = await fetch(previewSrc)
                    const blob = await res.blob()
                    const file = new File([blob], 'wishlist_preview.png', { type: 'image/png' })
                    const formData = new FormData()
                    formData.append('file', file)

                    const uploadRes: any = await $customFetch('/api/media/upload-temp', {
                        method: 'POST',
                        body: formData
                    })

                    if (uploadRes && uploadRes.url) {
                        previewUrl = uploadRes.url
                    }
                } catch (e) {
                    console.error('Failed to upload preview image:', e)
                }
            }

            if (previewUrl) {
                apiOptions.preview_url = previewUrl
            }
            delete apiOptions.preview_src

            const response: any = await $customFetch('/api/wishlists', {
                method: 'POST',
                headers,
                body: {
                    canvas_product_id: productId,
                    options: apiOptions
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
                pruneItemPreviews(wishlistItems.value)
                if (previewSrc) attachPreviewToLatestItem(productId, previewSrc)
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
            const nextPreviews = { ...itemPreviewById.value }
            delete nextPreviews[itemId]
            itemPreviewById.value = nextPreviews
            saveStoredPreviews()
            
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
        removeFromWishlist,
        getItemPreview,
        setItemPreview
    }
})
