<script lang="ts">
  import {onMount} from "svelte"
  import {goto} from "$app/navigation"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"
  import {PLATFORM_NAME, PLATFORM_RELAY} from "@app/state"

  const addSpace = () => pushModal(SpaceAdd)

  onMount(() => {
    if (PLATFORM_RELAY) {
      goto(makeSpacePath(PLATFORM_RELAY))
    }
  })
</script>

{#if !PLATFORM_RELAY}
  <div class="hero min-h-screen overflow-auto pb-8">
    <div class="hero-content">
      <div class="column content gap-4">
        <h1 class="text-center text-5xl">Welcome to</h1>
        <h1 class="mb-4 text-center text-5xl font-bold uppercase">{PLATFORM_NAME}</h1>
        <div class="col-3">
          <Button onclick={addSpace}>
            <CardButton>
              {#snippet icon()}
                <div><Icon icon="add-circle" size={7} /></div>
              {/snippet}
              {#snippet title()}
                <div>Add a space</div>
              {/snippet}
              {#snippet info()}
                <div>Use an invite link, or create your own space.</div>
              {/snippet}
            </CardButton>
          </Button>
          <Link href="/discover">
            <CardButton>
              {#snippet icon()}
                <div><Icon icon="compass" size={7} /></div>
              {/snippet}
              {#snippet title()}
                <div>Browse the network</div>
              {/snippet}
              {#snippet info()}
                <div>Find communities on the nostr network.</div>
              {/snippet}
            </CardButton>
          </Link>
          <Link href="/people">
            <CardButton>
              {#snippet icon()}
                <div><Icon icon="chat-round" size={7} /></div>
              {/snippet}
              {#snippet title()}
                <div>Start a conversation</div>
              {/snippet}
              {#snippet info()}
                <div>Use nostr's encrypted group chats to stay in touch.</div>
              {/snippet}
            </CardButton>
          </Link>
        </div>
      </div>
    </div>
  </div>
{/if}
