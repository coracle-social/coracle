<script lang="ts">
  import {onMount} from 'svelte'
  import {postJson} from '@welshman/lib'
  import {pubkey} from '@welshman/app'
  import Anchor from 'src/partials/Anchor.svelte'
  import {dufflepud, getSetting} from 'src/engine'

  export let urls: string[]
  export let author: string

  let maxScore = 0
  let threshold = author !== $pubkey && getSetting('hide_sensitive') ? 0.5 : 1

  const ignoreWarning = () => {
    threshold = 1
  }

  onMount(() => {
    for (const url of urls) {
      postJson(dufflepud('media/alert'), {url}).then(({score = 0}) => {
        maxScore = Math.max(score, maxScore)
      })
    }
  })
</script>

{#if maxScore >= threshold}
  <div class="flex gap-2 text-neutral-300">
    <i class="fa fa-warning m-1" />
    <p>
      This note contains sensitive content.<br />
      <Anchor underline on:click={ignoreWarning}>Show anyway</Anchor>
    </p>
  </div>
{:else}
  <slot />
{/if}
