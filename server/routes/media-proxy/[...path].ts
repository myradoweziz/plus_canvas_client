import { createError, defineEventHandler, getQuery, getRequestHeaders, proxyRequest } from 'h3'

/** Same-origin прокси к API (prod + dev): Fabric загружает медиа без CORS. */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const base = String(config.public.baseUrl ?? '')
		.trim()
		.replace(/\/+$/, '')
	if (!base) {
		throw createError({ statusCode: 502, statusMessage: 'BASE_URL is not configured' })
	}

	const pathParam = event.context.params?.path
	const rest = Array.isArray(pathParam) ? pathParam.join('/') : String(pathParam ?? '')
	const query = getQuery(event)
	const search = new URLSearchParams()
	for (const [key, value] of Object.entries(query)) {
		if (value == null) continue
		if (Array.isArray(value)) {
			for (const v of value) search.append(key, String(v))
		} else {
			search.append(key, String(value))
		}
	}
	const qs = search.toString()
	const targetPath = rest ? `/${rest}` : ''
	const target = `${base}${targetPath}${qs ? `?${qs}` : ''}`

	const incomingAuth = getRequestHeaders(event).authorization
	return proxyRequest(event, target, {
		fetchOptions: incomingAuth ? { headers: { authorization: incomingAuth } } : undefined
	})
})
