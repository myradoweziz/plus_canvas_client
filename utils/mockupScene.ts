import type { Image } from '~/utils/types'
import type { MockupScene, MockupSceneSetting } from '~/utils/types/mockupScene'

const WALL_PALETTE = ['#ffffff', '#f5f0e8', '#e6e6e6', '#d4c4b0', '#c9a88a', '#b69f85', '#8b7355', '#5c6bc0', '#c0392b']
const SOFA_PALETTE = ['#b69f85', '#8b7355', '#4a6741', '#2c3e50', '#34495e', '#95a5a6', '#c0392b', '#e67e22', '#1a5276']
const DEFAULT_PALETTE = ['#ffffff', '#e6e6e6', '#b69f85', '#8b7355', '#4a6741', '#2c3e50', '#c0392b', '#2980b9', '#2ecc71']

export function normalizeHexColor(color: string): string {
	const raw = String(color ?? '').trim()
	if (!raw) return '#ffffff'
	if (raw.startsWith('#')) {
		const hex = raw.slice(1)
		if (hex.length === 3) {
			return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase()
		}
		return `#${hex.slice(0, 6)}`.toLowerCase()
	}
	return raw.startsWith('rgb') ? raw : `#${raw}`.toLowerCase()
}

export function getSettingPoint(setting: MockupSceneSetting): { x: number; y: number } {
	const poi = (setting.point ?? setting.point_of_interest ?? setting.PointOfInterest) as
		| { x?: number; y?: number; X?: number; Y?: number }
		| undefined
	if (!poi) return { x: 50, y: 50 }
	const x = Number(poi.x ?? poi.X ?? 50)
	const y = Number(poi.y ?? poi.Y ?? 50)
	return {
		x: Number.isFinite(x) ? x : 50,
		y: Number.isFinite(y) ? y : 50
	}
}

export function getDefaultPaletteForSetting(name: string): string[] {
	const n = name.toLowerCase()
	if (/duvar|wall|стен/i.test(n)) return WALL_PALETTE
	if (/koltuk|sofa|диван|couch/i.test(n)) return SOFA_PALETTE
	return DEFAULT_PALETTE
}

const normalizeSetting = (raw: unknown): MockupSceneSetting | null => {
	if (!raw || typeof raw !== 'object') return null
	const row = raw as Record<string, unknown>
	const name = String(row.name ?? row.Name ?? '').trim()
	if (!name) return null
	const value = normalizeHexColor(String(row.value ?? row.Value ?? '#ffffff'))
	const palette = Array.isArray(row.palette)
		? row.palette.map((c) => normalizeHexColor(String(c)))
		: Array.isArray(row.Palette)
			? row.Palette.map((c) => normalizeHexColor(String(c)))
			: undefined

	return {
		id: (row.id ?? row.Id ?? null) as string | number | null,
		name,
		value,
		palette,
		point: row.point as MockupSceneSetting['point'],
		point_of_interest: row.point_of_interest as MockupSceneSetting['point_of_interest'],
		PointOfInterest: row.PointOfInterest as MockupSceneSetting['PointOfInterest']
	}
}

const normalizeScene = (raw: unknown): MockupScene | null => {
	if (!raw || typeof raw !== 'object') return null
	const row = raw as Record<string, unknown>
	const settingsRaw = row.settings ?? row.Settings
	if (!Array.isArray(settingsRaw)) return null
	const settings = settingsRaw.map(normalizeSetting).filter((s): s is MockupSceneSetting => s != null)
	if (!settings.length) return null

	return {
		group: String(row.group ?? row.Group ?? '').trim() || undefined,
		settings,
		associated_format_ids: Array.isArray(row.associated_format_ids)
			? row.associated_format_ids.map(Number).filter(Number.isFinite)
			: Array.isArray(row.AssociatedSpecificationOptionIds)
				? row.AssociatedSpecificationOptionIds.map(Number).filter(Number.isFinite)
				: undefined,
		associated_frame_ids: Array.isArray(row.associated_frame_ids)
			? row.associated_frame_ids
			: undefined,
		render_template: String(row.render_template ?? row.renderTemplate ?? '').trim() || undefined
	}
}

/** Читает scene из product.image / images[i] (PlusCanvas / свой API). */
export function parseMockupSceneFromImage(img: Image | Record<string, unknown> | null | undefined): MockupScene | null {
	if (!img || typeof img !== 'object') return null
	const row = img as Record<string, unknown>
	if (row.dynamic === false) return null

	const direct = normalizeScene(row.scene ?? row.mockup_scene ?? row.mockupScene)
	if (direct) return direct

	if (row.dynamic === true && row.scene) return normalizeScene(row.scene)

	const settingsOnly = row.scene_settings ?? row.sceneSettings
	if (Array.isArray(settingsOnly)) {
		return normalizeScene({ settings: settingsOnly })
	}

	return null
}

export function stripSceneQueryParams(url: string): string {
	const trimmed = String(url ?? '').trim()
	if (!trimmed) return trimmed
	return trimmed
		.replace(/([?&])(sceneSettings|scene_settings)=[^&]*/gi, '$1')
		.replace(/[?&]$/, '')
		.replace(/\?&/, '?')
}

export type MockupSceneUrlOptions = {
	formatId?: number | null
	sizeId?: number | null
	frameId?: string | number | null
	productId?: number | null
	width?: number
	height?: number
}

/** Собирает URL mockup с sceneSettings (как PlusCanvas CDN). */
export function buildMockupSceneUrl(
	baseUrl: string,
	colors: string[],
	opts?: MockupSceneUrlOptions
): string {
	const trimmed = stripSceneQueryParams(String(baseUrl ?? '').trim())
	if (!trimmed || !colors.length) return trimmed

	const normalized = colors.map(normalizeHexColor)
	const sep = trimmed.includes('?') ? '&' : '?'
	const params = new URLSearchParams()

	params.set('sceneSettings', normalized.join(','))
	if (opts?.productId != null) params.set('sourceProductId', String(opts.productId))
	if (opts?.formatId != null) params.set('canvasPrintOptionId', String(opts.formatId))
	if (opts?.sizeId != null) params.set('printSizeOptionId', String(opts.sizeId))
	if (opts?.frameId != null) params.set('frameOptionId', String(opts.frameId))
	if (opts?.width != null) params.set('width', String(opts.width))
	if (opts?.height != null) params.set('height', String(opts.height))

	return `${trimmed}${sep}${params.toString()}`
}

export function getInitialSceneColors(scene: MockupScene): string[] {
	return scene.settings.map((s) => normalizeHexColor(s.value || '#ffffff'))
}
