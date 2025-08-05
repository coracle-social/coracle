<script lang="ts">
  import {copyToClipboard} from "src/util/html"
  import {displayDomain} from "src/util/misc"
  import {showInfo} from "src/partials/Toast.svelte"
  import Card from "src/partials/Card.svelte"
  import Link from "src/partials/Link.svelte"
  import Chip from "src/partials/Chip.svelte"
  import HandlerSummary from "src/app/shared/HandlerSummary.svelte"

  export let handler

  const copy = text => {
    copyToClipboard(text)
    showInfo("Copied to clipboard!")
  }
</script>

<Card>
  <HandlerSummary {handler}>
    <div class="pt-1">
      {#if handler.website}
        <Link external href={handler.website} class="mb-2 mr-2 inline-block">
          <Chip>
            <i class="fa fa-link" />
            {displayDomain(handler.website)}
          </Chip>
        </Link>
      {/if}
      {#if handler.lud16}
        <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => copy(handler.lud16)}>
          <i class="fa fa-bolt" />
          {handler.lud16}
        </Chip>
      {/if}
      {#if handler.nip05}
        <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => copy(handler.nip05)}>
          <i class="fa fa-at" />
          {handler.nip05}
        </Chip>
      {/if}
    </div>
  </HandlerSummary>
</Card>
