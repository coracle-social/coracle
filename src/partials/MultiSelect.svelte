<script lang="ts">
  import {reject, equals, identity} from "ramda"
  import Chip from "src/partials/Chip.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"

  export let value
  export let placeholder = ""
  export let delimiters = []
  export let search = null
  export let termToItem = null
  export let getKey = identity

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
      if (suggestions.get()) {
        event.preventDefault()
        select(suggestions.get())
      } else if (term && termToItem) {
        event.preventDefault()
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
</script>

<div class="text-sm">
  {#each value as item}
    <Chip class="mr-1 mb-1" theme="dark" onClick={() => remove(item)}>
      <slot name="item" {item}>
        {item}
      </slot>
    </Chip>
  {/each}
</div>

<input
  type="text"
  class="shadow-inset w-full cursor-text rounded-full border border-solid border-gray-3 bg-input bg-input py-2
         py-2 px-4 text-black outline-0 placeholder:text-gray-5"
  {placeholder}
  bind:value={term}
  bind:this={input}
  on:keydown={onKeyDown} />

{#if search}
  <div class="relative w-full">
    <div class="absolute w-full">
      <Suggestions bind:this={suggestions} {select}>
        <div slot="item" let:item>
          <slot name="item" {item}>
            {item}
          </slot>
        </div>
      </Suggestions>
    </div>
  </div>
{/if}
