import axios, { isAxiosError } from 'axios'

import { createUploadSessionId } from '~/utils/uploadSessionId'

type TempUploadApiResponse = {
	message?: string
	data: {
		session_id: string
		user_id: number | null
		file_path: string
		original_name: string
		mime_type: string
		size: number
		updated_at: string
		created_at: string
		id: number
		url: string
	}
}

export function useMediaUploadTemp() {
	const uploadSessionId = ref<string | null>(null)

	const getOrCreateUploadSessionId = (): string => {
		if (!uploadSessionId.value) {
			uploadSessionId.value = createUploadSessionId()
		}
		return uploadSessionId.value
	}

	const resetUploadSessionId = () => {
		uploadSessionId.value = null
	}

	const getUploadTempUrl = (): string | null => {
		const base = String(useRuntimeConfig().public.baseUrl ?? '')
			.trim()
			.replace(/\/+$/, '')
		if (!base) return null
		return `${base}/api/media/upload-temp`
	}

	const uploadAuthHeaders = (): Record<string, string> => {
		const authCookie = useCookie<string | null>('Authorization', {
			path: '/',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30,
			secure: !import.meta.dev
		})
		const t = typeof authCookie.value === 'string' ? authCookie.value.trim() : ''
		return t ? { Authorization: `Bearer ${t}` } : {}
	}

	const uploadFile = async (file: File): Promise<{ url: string; id: number; session_id: string }> => {
		const uploadUrl = getUploadTempUrl()
		if (!uploadUrl) {
			throw new Error('API adresi eksik: .env içinde BASE_URL tanımlayın.')
		}
		const sessionId = getOrCreateUploadSessionId()
		const formData = new FormData()
		formData.append('file', file)
		formData.append('session_id', sessionId)
		const { data: res } = await axios.post<TempUploadApiResponse>(uploadUrl, formData, {
			headers: uploadAuthHeaders()
		})
		const url = typeof res?.data?.url === 'string' ? res.data.url.trim() : ''
		if (!url) throw new Error('Sunucudan görüntü adresi alınamadı.')
		return {
			url,
			id: res.data.id,
			session_id: res.data.session_id?.trim() || sessionId
		}
	}

	const uploadFileSafe = async (file: File): Promise<{ url: string; id: number; session_id: string } | { error: string }> => {
		try {
			return await uploadFile(file)
		} catch (e) {
			if (isAxiosError(e)) {
				const data = e.response?.data as { message?: string } | undefined
				return { error: data?.message ?? e.message ?? 'Yükleme başarısız.' }
			}
			if (e instanceof Error) return { error: e.message }
			return { error: 'Yükleme başarısız.' }
		}
	}

	return {
		getUploadTempUrl,
		uploadAuthHeaders,
		uploadFile,
		uploadFileSafe,
		getOrCreateUploadSessionId,
		resetUploadSessionId
	}
}
