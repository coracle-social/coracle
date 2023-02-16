<script lang="ts">
  import Onboarding from 'src/Onboarding.svelte'
  import App from 'src/App.svelte'
  import {relays} from 'src/agent/relays'
  import {showOnboarding} from 'src/app/ui'

  $: {
    if ($relays.length === 0) {
      showOnboarding.set(true)
    }
  }
</script>

{#if $showOnboarding}
<Onboarding />
{:else}
<App />
{/if}
