<script lang="ts">
  import {onMount} from "svelte"
  import {clamp, round} from "@welshman/lib"

  type Value = {
    min: number
    max: number
  }

  export let initialValue: Value = {min: 0, max: 0}
  export let value = initialValue
  export let onChange: (v: Value) => void
  export let min: number
  export let max: number
  export let step: number = 1

  let isDragging = false
  let activeHandle: "min" | "max" = null
  let container: HTMLDivElement

  const handleMouseDown = (e: MouseEvent, handle: "min" | "max") => {
    isDragging = true
    activeHandle = handle
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const rect = container.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const rawValue = min + (max - min) * percentage
    const steppedValue = Math.round(rawValue / step) * step
    const newValue = round(6, clamp([min, max], steppedValue))

    if (activeHandle === "min") {
      value = {
        min: newValue,
        max: clamp([newValue, max], value.max),
      }
    } else {
      value = {
        min: clamp([0, newValue], value.min),
        max: newValue,
      }
    }

    onChange(value)
  }

  const handleMouseUp = () => {
    isDragging = false
    activeHandle = null
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
  }

  onMount(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  })
</script>

<div class="relative h-7" bind:this={container}>
  <div class="absolute inset-0 h-1 translate-y-3 rounded-full bg-neutral-200">
    <div
      class="absolute h-full rounded-full bg-accent"
      style="left: {((value.min - min) / (max - min)) * 100}%; right: {100 -
        ((value.max - min) / (max - min)) * 100}%" />
  </div>
  <button
    type="button"
    class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent"
    style="left: calc({((value.min - min) / (max - min)) * 100}% - 0.5rem)"
    on:mousedown={e => handleMouseDown(e, "min")} />
  <button
    type="button"
    class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent"
    style="left: calc({((value.max - min) / (max - min)) * 100}% - 0.5rem)"
    on:mousedown={e => handleMouseDown(e, "max")} />
</div>
