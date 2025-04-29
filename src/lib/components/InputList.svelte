<script lang="ts">
  import type {Snippet} from "svelte"
  import {append, removeAt, replaceAt, insertAt} from "@welshman/lib"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"

  type Props = {
    value: string[]
    addLabel?: Snippet
    placeholder?: string
  }

  let {value = $bindable(), addLabel, placeholder = "Enter text..."}: Props = $props()
  let draggedIndex: number | null = $state(null)

  const onChange = (newValue: string[]) => {
    value = newValue
  }

  const addItem = () => onChange(append("", value))

  const removeItem = (index: number) => onChange(removeAt(index, value))

  const updateItem = (index: number, item: string) => onChange(replaceAt(index, item, value))

  const handleDragStart = (e: DragEvent, index: number) => {
    draggedIndex = index

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
    }
  }

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex !== null && draggedIndex !== index) {
      onChange(insertAt(index, value[draggedIndex], removeAt(draggedIndex, value)))
      draggedIndex = index
    }
  }

  const handleDragEnd = () => {
    draggedIndex = null
  }
</script>

<div class="flex flex-col gap-2" role="list">
  {#each value as item, index (item)}
    <div
      class="flex items-center gap-2"
      draggable="true"
      role="listitem"
      aria-label="Draggable item"
      ondragstart={e => handleDragStart(e, index)}
      ondragover={e => handleDragOver(e, index)}
      ondragend={handleDragEnd}>
      <Button onclick={() => removeItem(index)}>
        <Icon icon="trash-bin-2" />
      </Button>
      <input
        type="text"
        class="input input-bordered w-full"
        value={item}
        {placeholder}
        oninput={e => updateItem(index, e.currentTarget.value)} />
      <div class="cursor-move" role="button" aria-label="Drag handle">
        <Icon icon="hamburger-menu" />
      </div>
    </div>
  {/each}
  <Button onclick={addItem} class="btn btn-link w-fit px-0">
    <Icon icon="add-circle" size={5} />
    {#if addLabel}
      {@render addLabel?.()}
    {:else}
      Add Item
    {/if}
  </Button>
</div>
