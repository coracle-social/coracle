<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {reject, equals, identity} from "ramda"
  import Chip from "src/partials/Chip.svelte"
  import Input from "src/partials/Input.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"

  export let value
  export let inputClass = ""
  export let inputWrapperClass = ""
  export let placeholder = ""
  export let delimiters = []
  export let search = null
  export let termToItem = null
  export let getKey: (x: any) => any = identity
  export let displayItem = getKey
  export let autofocus = false
  export let multiple = false
  export let loading = false
  export let defaultOptions = []
  export let term = multiple ? "" : displayItem(value)

  let input, suggestions
  let focused = autofocus

  $: suggestions?.setData?.(term ? search(term).slice(0, 10) : defaultOptions)

  const create = term => {
    select(termToItem(term))
  }

  const remove = item => {
    value = multiple ? reject(equals(item), value) : null
  }

  const select = item => {
    if (multiple) {
      value = value.concat([item])
      term = ""
    } else {
      value = item
      term = displayItem(item)
      focused = false
    }
  }

  const onKeyDown = event => {
    if (term && termToItem && delimiters.includes(event.key)) {
      event.preventDefault()
      create(term)
    }

    if (event.key === "Escape") {
      event.stopPropagation()
      term = ""
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (suggestions?.get?.()) {
        select(suggestions.get())
      } else if (term && termToItem) {
        create(term)
      }
    }

    if (suggestions?.get?.() && event.code === "ArrowUp") {
      event.preventDefault()
      suggestions.prev()
    }

    if (suggestions?.get?.() && event.code === "ArrowDown") {
      event.preventDefault()
      suggestions.next()
    }
  }

  const onFocus = () => {
    focused = true
  }

  const onBlur = () => {
    focused = false

    if (multiple) {
      term = ""
    }
  }

  onMount(() => {
    if (input === document.activeElement) {
      onFocus()
    }
  })
</script>

{#if multiple}
  <div class="text-sm">
    {#each value as item}
      <Chip class="mb-1 mr-1" onRemove={() => remove(item)}>
        <slot name="item" context="value" {item}>
          {item}
        </slot>
      </Chip>
    {/each}
  </div>
{/if}

<div>
  <Input
    class={cx(inputClass, "cursor-text text-black outline-0")}
    wrapperClass={inputWrapperClass}
    {autofocus}
    {placeholder}
    bind:value={term}
    bind:element={input}
    on:keydown={onKeyDown}
    on:focus={onFocus}
    on:blur={onBlur}
    hideBefore={!$$slots.before}>
    <slot slot="before" name="before" />
    <div slot="after" on:click={onFocus}>
      {#if defaultOptions.length > 0}
        <div class="cursor-pointer">
          <i class="fa fa-caret-down" />
        </div>
      {/if}
    </div>
  </Input>
  {#if focused}
    <Popover2>
      <Suggestions
        bind:this={suggestions}
        create={termToItem ? create : null}
        {loading}
        {select}
        {term}
        {getKey}>
        <div slot="item" let:item>
          <slot name="item" context="option" {item}>
            {item}
          </slot>
        </div>
      </Suggestions>
    </Popover2>
  {/if}
</div>
