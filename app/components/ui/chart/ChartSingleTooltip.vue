<script setup lang="ts">
import { VisTooltip } from '@unovis/vue'
import type { BulletLegendItemInterface } from '@unovis/ts'
import { omit } from '@unovis/ts'
import { type Component, createApp } from 'vue'
import { ChartTooltip } from '.'

const props = withDefaults(defineProps<{
  selector: string
  index: string
  items?: BulletLegendItemInterface[]
  valueFormatter?: (tick: number, i?: number, ticks?: number[]) => string
  customTooltip?: Component
}>(), {
  valueFormatter: (tick: number) => `${tick}`,
})

// Use weakmap to store reference to each datapoint for Tooltip
const wm = new WeakMap()
function template(d: any, i: number, elements: (HTMLElement | SVGElement)[]) {
  // Prefer using the provided index field if present on the data object
  const hasIndexOnD = typeof props.index === 'string' && d && Object.prototype.hasOwnProperty.call(d, props.index)

  if (hasIndexOnD) {
    if (wm.has(d))
      return wm.get(d)

    const componentDiv = document.createElement('div')
    const omittedData = Object.entries(omit(d, [props.index])).map(([key, value]) => {
      const legendReference = props.items?.find(i => i.name === key)
      return { ...legendReference, value: props.valueFormatter(Number(value)) }
    })
    const TooltipComponent = props.customTooltip ?? ChartTooltip
    createApp(TooltipComponent, { title: String(d[props.index]), data: omittedData }).mount(componentDiv)
    wm.set(d, componentDiv.innerHTML)
    return componentDiv.innerHTML
  }

  // fallback to nested data
  const data = d?.data
  if (!data)
    return ''

  if (wm.has(data))
    return wm.get(data)

  const el = elements?.[i]
  const style = el ? getComputedStyle(el as Element) : { fill: undefined }
  const omittedData = [{ name: data.name, value: props.valueFormatter(Number(data?.[props.index])), color: (style as any).fill }]
  const componentDiv = document.createElement('div')
  const TooltipComponent = props.customTooltip ?? ChartTooltip
  createApp(TooltipComponent, { title: String(d?.[props.index] ?? ''), data: omittedData }).mount(componentDiv)
  wm.set(d, componentDiv.innerHTML)
  return componentDiv.innerHTML
}
</script>

<template>
  <VisTooltip
    :horizontal-shift="20"
    :vertical-shift="20"
    :triggers="{
      [selector]: template,
    }"
  />
</template>
