<script lang="ts">
  import {reject, equals, identity} from "ramda"
  import Chip from "src/partials/Chip.svelte"
  import Input from "src/partials/Input.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"

  export let value
  export let placeholder = ""
  export let delimiters = []
  export let search = null
  export let termToItem = null
  export let getKey: (x: any) => any = identity
  export let autofocus = null

  let term = ""
  let input
  let suggestions

  $: suggestions?.setData(term ? search(term).slice(0, 10) : [])

  const remove = item => {
    value = reject(equals(item), value)
  }

  const select = item => {
    value = value.concat([item])
    term = ""
  }

  const onKeyDown = event => {
    if (term && termToItem && delimiters.includes(event.key)) {
      event.preventDefault()
      select(termToItem(term))
    }

    if (event.key === "Escape") {
      event.stopPropagation()
      term = ""
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (suggestions.get()) {
        select(suggestions.get())
      } else if (term && termToItem) {
        select(termToItem(term))
      }
    }

    if (suggestions?.get() && event.code === "ArrowUp") {
      event.preventDefault()
      suggestions.prev()
    }

    if (suggestions?.get() && event.code === "ArrowDown") {
      event.preventDefault()
      suggestions.next()
    }
  }

  const onBlur = () => {
    setTimeout(() => {
      term = ""
    }, 100)
  }
</script>

<div class="text-sm">
  {#each value as item}
    <Chip class="mb-1 mr-1" theme="dark" onClick={() => remove(item)}>
      <slot name="item" context="value" {item}>
        {item}
      </slot>
    </Chip>
  {/each}
</div>

<Input
  class="cursor-text text-black outline-0"
  {autofocus}
  {placeholder}
  bind:value={term}
  bind:element={input}
  on:keydown={onKeyDown}
  on:blur={onBlur}
  hideBefore={!$$slots.before}>
  <slot slot="before" name="before" />
</Input>

{#if search}
  <div class="relative w-full">
    <div class="absolute z-10 w-full">
      <Suggestions bind:this={suggestions} {select} {getKey}>
        <div slot="item" let:item>
          <slot name="item" context="option" {item}>
            {item}
          </slot>
        </div>
      </Suggestions>
    </div>
  </div>
{/if}
