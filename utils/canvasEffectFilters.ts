import type { EffectOption } from '~/utils/types'

export type EffectFilterParams = {
	details: number
	/** Слайдер Detaylar (последние 3 эффекта в списке) */
	useDetails?: boolean
	color: string
	colorSecondary: string
	/** 0–1, только для fallback без pixel-blend */
	effectAmount?: number
}

export type EffectKind =
	| 'grayscale'
	| 'sepia'
	| 'invert'
	| 'duotone'
	| 'posterize'
	| 'pop-yellow-blue'
	| 'pop-cyan'
	| 'pop-green'
	| 'pop-purple'
	| 'vivid'
	| 'fade'
	| 'cool'
	| 'warm'
	| 'pink'
	| 'contrast'

type FabricFilterCtor = new (opts?: object) => import('fabric').fabric.IBaseFilter
type FabricFiltersLib = Record<string, FabricFilterCtor>

/** Порядок пресетов PlusCanvas по позиции в списке эффектов (sort_order). */
const EFFECT_KIND_BY_ORDER: EffectKind[] = [
	'grayscale',
	'sepia',
	'duotone',
	'pop-yellow-blue',
	'pop-cyan',
	'posterize',
	'pop-green',
	'pop-purple'
]

export const getSortedEffects = (effects?: EffectOption[]) =>
	[...(effects ?? [])]
		.filter((effect) => effect?.is_active !== false && effect?.image_url?.trim())
		.sort(
			(a, b) =>
				Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
				Number(a.id) - Number(b.id)
		)

export const getEffectIndex = (effects: EffectOption[] | undefined, effect: EffectOption) => {
	const sorted = getSortedEffects(effects)
	const index = sorted.findIndex((item) => Number(item.id) === Number(effect.id))
	return index
}

/** Detaylar — у последних 3 эффектов в списке (как на PlusCanvas). */
export const effectUsesDetails = (effect: EffectOption, effects?: EffectOption[]) => {
	const sorted = getSortedEffects(effects)
	if (!sorted.length) return false
	const index = getEffectIndex(effects, effect)
	if (index < 0) return false
	return index >= sorted.length - 3
}

/**
 * Тип эффекта по позиции в API-списке (sort_order), не по name.
 * name может дублироваться (напр. несколько «Posterize» с разными image_url).
 */
export const resolveEffectKind = (effect: EffectOption, effects?: EffectOption[]): EffectKind => {
	const index = getEffectIndex(effects, effect)
	if (index < 0) return 'contrast'
	return EFFECT_KIND_BY_ORDER[index] ?? EFFECT_KIND_BY_ORDER[EFFECT_KIND_BY_ORDER.length - 1]!
}

export const defaultEffectColors = (kind: EffectKind) => {
	switch (kind) {
		case 'sepia':
			return { color: '#8B6914', colorSecondary: '#EAB308' }
		case 'duotone':
			return { color: '#7C3AED', colorSecondary: '#EAB308' }
		case 'pop-yellow-blue':
			return { color: '#FACC15', colorSecondary: '#1D4ED8' }
		case 'pop-cyan':
			return { color: '#22D3EE', colorSecondary: '#0E7490' }
		case 'pop-green':
			return { color: '#4ADE80', colorSecondary: '#15803D' }
		case 'pop-purple':
			return { color: '#C084FC', colorSecondary: '#5B21B6' }
		default:
			return { color: '#8B6914', colorSecondary: '#EAB308' }
	}
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const pushPopArtDuotone = (
	filters: import('fabric').fabric.IBaseFilter[],
	filtersLib: FabricFiltersLib,
	lightColor: string,
	darkColor: string,
	amount = 1,
	detail = 1
) => {
	const detailMix = 0.55 + detail * 0.85
	if (amount < 1 && filtersLib.Saturate) {
		filters.push(new filtersLib.Saturate({ saturation: -amount * 0.85 }))
	}
	if (amount >= 0.35 && filtersLib.Grayscale) filters.push(new filtersLib.Grayscale())
	if (filtersLib.Contrast) {
		filters.push(new filtersLib.Contrast({ contrast: (0.5 + amount * 0.85) * detailMix }))
	}
	if (filtersLib.Brightness) {
		filters.push(new filtersLib.Brightness({ brightness: 0.08 + 0.14 * amount + detail * 0.08 }))
	}
	if (filtersLib.Saturate) {
		filters.push(new filtersLib.Saturate({ saturation: detail * 0.75 }))
	}
	if (filtersLib.BlendColor) {
		filters.push(
			new filtersLib.BlendColor({
				color: lightColor,
				mode: 'lighten',
				alpha: 0.75 * amount
			})
		)
		filters.push(
			new filtersLib.BlendColor({
				color: darkColor,
				mode: 'multiply',
				alpha: 0.7 * amount
			})
		)
	}
}

export const buildCanvasEffectFilters = (
	filtersLib: FabricFiltersLib | undefined,
	kind: EffectKind,
	params: EffectFilterParams
): import('fabric').fabric.IBaseFilter[] => {
	if (!filtersLib) return []

	const amount = params.effectAmount != null ? clamp01(params.effectAmount) : 1
	const detail = params.useDetails ? clamp01(params.details / 110) : 1
	const filters: import('fabric').fabric.IBaseFilter[] = []

	switch (kind) {
		case 'grayscale':
			if (amount < 1 && filtersLib.Saturate) {
				filters.push(new filtersLib.Saturate({ saturation: -amount }))
				return filters
			}
			if (filtersLib.Grayscale) filters.push(new filtersLib.Grayscale())
			return filters

		case 'sepia':
			if (amount >= 1 && filtersLib.Sepia) filters.push(new filtersLib.Sepia())
			if (filtersLib.BlendColor) {
				filters.push(
					new filtersLib.BlendColor({
						color: params.color,
						mode: 'multiply',
						alpha: 0.6 * amount
					})
				)
			}
			return filters

		case 'duotone':
			pushPopArtDuotone(filters, filtersLib, params.color, params.colorSecondary, amount)
			return filters

		case 'posterize':
			if (filtersLib.Contrast) {
				filters.push(new filtersLib.Contrast({ contrast: (0.25 + detail * 1.35) * amount }))
			}
			if (filtersLib.Saturate) {
				filters.push(new filtersLib.Saturate({ saturation: (0.2 + detail * 1.15) * amount }))
			}
			if (filtersLib.Brightness) {
				filters.push(new filtersLib.Brightness({ brightness: (-0.08 + detail * 0.18) * amount }))
			}
			return filters

		case 'pop-yellow-blue':
			pushPopArtDuotone(filters, filtersLib, '#FACC15', '#1D4ED8', amount, detail)
			return filters

		case 'pop-cyan':
			pushPopArtDuotone(filters, filtersLib, '#22D3EE', '#0E7490', amount, detail)
			return filters

		case 'pop-green':
			pushPopArtDuotone(filters, filtersLib, '#4ADE80', '#166534', amount, detail)
			return filters

		case 'pop-purple':
			pushPopArtDuotone(filters, filtersLib, '#C084FC', '#5B21B6', amount, detail)
			return filters

		case 'invert':
			if (amount < 1 && filtersLib.BlendColor) {
				filters.push(
					new filtersLib.BlendColor({
						color: '#ffffff',
						mode: 'diff',
						alpha: amount * 0.5
					})
				)
				return filters
			}
			if (filtersLib.Invert) filters.push(new filtersLib.Invert())
			return filters

		case 'vivid':
			if (filtersLib.Brightness) filters.push(new filtersLib.Brightness({ brightness: 0.35 * amount }))
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: 0.45 * amount }))
			if (filtersLib.Saturate) filters.push(new filtersLib.Saturate({ saturation: 0.55 * amount }))
			return filters

		case 'fade':
			if (filtersLib.Brightness) filters.push(new filtersLib.Brightness({ brightness: 0.12 * amount }))
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: -0.25 * amount }))
			return filters

		case 'cool':
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#60a5fa', mode: 'multiply', alpha: 0.45 * amount }))
			}
			return filters

		case 'warm':
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#f97316', mode: 'multiply', alpha: 0.4 * amount }))
			}
			return filters

		case 'pink':
			if (filtersLib.BlendColor) {
				filters.push(new filtersLib.BlendColor({ color: '#f472b6', mode: 'multiply', alpha: 0.4 * amount }))
			}
			return filters

		case 'contrast':
		default:
			if (filtersLib.Contrast) filters.push(new filtersLib.Contrast({ contrast: 0.3 * amount }))
			return filters
	}
}
