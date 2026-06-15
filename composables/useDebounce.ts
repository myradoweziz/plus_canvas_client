export function useDebounce<T extends (...args: never[]) => void>(fn: T, delayMs = 300) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null

	const cancel = () => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId)
			timeoutId = null
		}
	}

	const run = (...args: Parameters<T>) => {
		cancel()
		timeoutId = setTimeout(() => {
			timeoutId = null
			fn(...args)
		}, delayMs)
	}

	if (getCurrentScope()) {
		onScopeDispose(cancel)
	}

	return run
}
