export type TransformState = { x: number; y: number; scale: number; rotation: number }

export function applyTransform(ctx: CanvasRenderingContext2D, t: TransformState) {
  ctx.translate(t.x, t.y)
  ctx.rotate((t.rotation * Math.PI) / 180)
  ctx.scale(t.scale, t.scale)
}

export function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
