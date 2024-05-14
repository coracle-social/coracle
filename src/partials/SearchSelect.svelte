<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {reject, equals, identity} from "ramda"
  import Input from "src/partials/Input.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"

  export let value = null
  export let onChange = null
  export let inputClass = ""
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
  export let term = multiple || !value ? "" : displayItem(value) || ""

  let input, suggestions
  let focused = autofocus

  $: suggestions?.setData?.(term ? search(String(term)).slice(0, 10) : defaultOptions)

  export const clear = () => {
    clearValue()
    clearTerm()
  }

  export const clearValue = () => {
    value = multiple ? [] : null
    onChange?.(value)
  }

  export const clearTerm = () => {
    term = multiple || !value ? "" : displayItem(value) || ""
  }

  const create = term => {
    select(termToItem(term))
  }

  const remove = item => {
    value = multiple ? reject(equals(item), value) : null
    onChange?.(value)
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

    onChange?.(value)
  }

  const onKeyDown = event => {
    onFocus()

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
    if (input === document.activeElement && autofocus) {
      onFocus()
    }
  })
</script>

{#if multiple}
  <div class="text-sm">
    {#each value as item}
      <div
        class="mb-1 mr-1 inline-flex h-7 items-center rounded-full bg-neutral-900 px-3 text-neutral-400">
        <div class="flex h-7 w-5 cursor-pointer items-center" on:click={() => remove(item)}>
          <i class="fa fa-times" />
        </div>
        <slot name="item" context="value" {item}>
          {displayItem(item)}
        </slot>
      </div>
    {/each}
  </div>
{/if}

<div>
  <Input
    class={cx(inputClass, "cursor-text text-black outline-0")}
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
    <div class="relative">
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
              {displayItem(item)}
            </slot>
          </div>
        </Suggestions>
      </Popover2>
    </div>
  {/if}
</div>
