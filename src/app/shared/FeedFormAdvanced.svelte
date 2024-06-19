<script lang="ts">
  import {tryCatch} from "@welshman/lib"
  import Card from "src/partials/Card.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"

  export let feed
  export let onChange

  const onInput = async e => {
    const newFeed = await tryCatch(() => JSON.parse(e.target.value))

    if (newFeed) {
      onChange(newFeed)
    }

    isValid = Boolean(newFeed)
  }

  const onFocus = () => {
    isFocused = true
  }

  const onBlur = () => {
    if (isValid) {
      json = JSON.stringify(feed, null, 2)
    }

    isFocused = false
  }

  let isValid = true
  let isFocused = false
  let json = JSON.stringify(feed, null, 2)
</script>

<Card>
  <FlexColumn>
    <span class="staatliches text-lg">Enter your custom feed below</span>
    <Textarea
      class="h-72 whitespace-pre-wrap"
      value={json}
      on:input={onInput}
      on:focus={onFocus}
      on:blur={onBlur} />
    {#if !isValid && !isFocused}
      <p>
        <i class="fa fa-triangle-exclamation" />
        Your feed is currently invalid. Please double check that it is valid JSON.
      </p>
    {/if}
  </FlexColumn>
</Card>
