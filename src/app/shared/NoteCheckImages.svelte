<script lang="ts">
  import {onMount} from "svelte"
  import {postJson} from "@welshman/lib"
  import {pubkey} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import {dufflepud, getSetting, userFollows} from "src/engine"

  export let urls: string[]
  export let author: string

  const shouldSkip = author === $pubkey || $userFollows.has(author) || !getSetting("hide_sensitive")

  let maxScore = 0
  let threshold = shouldSkip ? 1 : 0.92

  const ignoreWarning = () => {
    threshold = 1
  }

  onMount(() => {
    if (threshold < 1) {
      for (const url of urls) {
        postJson(dufflepud("media/alert"), {url}).then(({score = 0}) => {
          maxScore = Math.max(score, maxScore)
        })
      }
    }
  })
</script>

{#if maxScore >= threshold}
  <div class="flex gap-2 text-neutral-300">
    <i class="fa fa-warning m-1" />
    <p>
      This note contains sensitive content.<br />
      <Button stopPropagation class="underline" on:click={ignoreWarning}>Show anyway</Button>
    </p>
  </div>
{:else}
  <slot />
{/if}
