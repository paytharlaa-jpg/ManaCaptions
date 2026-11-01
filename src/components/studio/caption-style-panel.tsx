import { RotateCcw, Undo2, Redo2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAPTION_PRESETS, presetStyle } from "@/lib/captions/presets";
import { FONT_REGISTRY, fontStack } from "@/lib/captions/font-registry";
import type { CaptionStyle } from "@/lib/captions/style-schema";

interface Props { style: CaptionStyle; onChange: (s: CaptionStyle) => void; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
export function CaptionStylePanel({ style, onChange, undo, redo, canUndo, canRedo }: Props) {
  const patch = (v: Partial<CaptionStyle>) => onChange({ ...style, ...v });
  const numeric = (key: keyof CaptionStyle, label: string, min: number, max: number, step = 1) => (
    <div className="space-y-1" key={key}><Label htmlFor={`style-${key}`}>{label}</Label><div className="flex items-center gap-2"><input id={`style-${key}`} aria-label={label} type="range" min={min} max={max} step={step} value={Number(style[key])} onChange={(e) => patch({ [key]: Number(e.target.value) })} className="h-11 min-w-0 flex-1 accent-primary" /><Input aria-label={`${label} value`} type="number" min={min} max={max} step={step} value={Number(style[key])} className="h-11 w-20" onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) patch({ [key]: Math.min(max, Math.max(min, n)) }); }} /></div></div>
  );
  const colors = (["textColor", "highlightColor", "backgroundColor", "outlineColor", "shadowColor"] as const).map((key, i) => <Label key={key} className="flex items-center justify-between gap-2">{["Text", "Highlight", "Background", "Outline", "Shadow"][i]}<input type="color" aria-label={`${key} color`} value={style[key]} onChange={(e) => patch({ [key]: e.target.value })} className="size-11 cursor-pointer rounded border border-border bg-transparent p-1" /></Label>);
  return <div className="min-w-0 space-y-4">
    <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Caption design</h2><div className="flex"><Button size="icon" variant="ghost" title="Undo style" aria-label="Undo style" disabled={!canUndo} onClick={undo}><Undo2 /></Button><Button size="icon" variant="ghost" title="Redo style" aria-label="Redo style" disabled={!canRedo} onClick={redo}><Redo2 /></Button><Button size="icon" variant="ghost" title="Reset preset" aria-label="Reset preset" onClick={() => onChange(presetStyle(style.presetId))}><RotateCcw /></Button></div></div>
    <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-3">
      {CAPTION_PRESETS.map((p) => <Button key={p.id} variant="outline" aria-pressed={p.id === style.presetId} onClick={() => onChange(presetStyle(p.id))} className={`h-auto min-h-20 min-w-28 flex-col whitespace-normal rounded-lg p-2 ${p.id === style.presetId ? "border-primary bg-accent" : "bg-card"}`}><span className="font-telugu text-lg">మాట <span className="text-primary">మీది</span></span><span className="flex items-center gap-1 text-[11px]">{p.id === style.presetId && <Check className="size-3" />}{p.name}</span></Button>)}
    </div>
    <details open className="border-t border-border pt-3"><summary className="cursor-pointer py-2 text-sm font-semibold">Typography</summary><div className="space-y-3 pt-2">
      <Label>Font family</Label><Select value={style.fontFamily} onValueChange={(family) => { const f = FONT_REGISTRY.find((item) => item.family === family); if (f) patch({ fontFamily: family, fontWeight: f.weights.some((w) => w === style.fontWeight) ? style.fontWeight : f.weights[0] }); }}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{FONT_REGISTRY.map((f) => <SelectItem key={f.family} value={f.family}>{f.family}</SelectItem>)}</SelectContent></Select>
      <p className="text-sm" style={{ fontFamily: fontStack(style.fontFamily) }}>నమస్కారం, మీరు ఎలా ఉన్నారు? Welcome.</p>
      <Label>Font weight</Label><Select value={String(style.fontWeight)} onValueChange={(v) => patch({ fontWeight: Number(v) })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{FONT_REGISTRY.find((f) => f.family === style.fontFamily)?.weights.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}</SelectContent></Select>
      {numeric("fontSize", "Font size", 12, 120)}{numeric("lineSpacing", "Line spacing", 1, 2, 0.1)}{numeric("characterSpacing", "Character spacing", 0, 10, 0.5)}
    </div></details>
    <details className="border-t border-border pt-3"><summary className="cursor-pointer py-2 text-sm font-semibold">Colors, outline & shadow</summary><div className="space-y-3 pt-2">{colors}{numeric("backgroundOpacity", "Background opacity", 0, 1, 0.05)}{numeric("outlineWidth", "Outline width", 0, 8, 0.5)}{numeric("shadowBlur", "Shadow blur", 0, 30)}{numeric("shadowOffsetX", "Shadow X", -20, 20)}{numeric("shadowOffsetY", "Shadow Y", -20, 20)}</div></details>
    <details className="border-t border-border pt-3"><summary className="cursor-pointer py-2 text-sm font-semibold">Position & motion</summary><div className="space-y-3 pt-2">
      {([{ key: "position", label: "Position", values: ["top", "center", "bottom", "custom"] }, { key: "alignment", label: "Alignment", values: ["left", "center", "right"] }, { key: "displayMode", label: "Display mode", values: ["word", "sentence"] }, { key: "animation", label: "Animation", values: ["none", "pop", "fade", "slide", "karaoke"] }] as const).map((item) => <div key={item.key}><Label>{item.label}</Label><Select value={style[item.key]} onValueChange={(v) => patch({ [item.key]: v })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{item.values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>)}
      {style.position === "custom" && <>{numeric("customPositionX", "Position X (%)", 5, 95)}{numeric("customPositionY", "Position Y (%)", 5, 95)}</>}
    </div></details>
  </div>;
}