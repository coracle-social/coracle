<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import Input from "src/partials/Input.svelte"

  export let feed
  export let onChange

  const onInput = e => onChange([FeedType.Search, e.target.value!])
</script>

<span class="staatliches text-lg">Which would you like to search for?</span>
<Input value={feed[1]} on:input={onInput} />
