<script lang="ts">
  import {onMount} from "svelte"
  import {goto} from "$app/navigation"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"
  import {PLATFORM_NAME, PLATFORM_RELAY} from "@app/state"

  const addSpace = () => pushModal(SpaceAdd)

  const startChat = () => pushModal(ChatStart)

  onMount(() => {
    if (PLATFORM_RELAY) {
      goto(makeSpacePath(PLATFORM_RELAY))
    }
  })
</script>

{#if !PLATFORM_RELAY}
  <div class="hero min-h-screen">
    <div class="hero-content">
      <div class="column content gap-4">
        <h1 class="text-center text-5xl">Welcome to</h1>
        <h1 class="mb-4 text-center text-5xl font-bold uppercase">{PLATFORM_NAME}</h1>
        <div class="col-3">
          <Button on:click={addSpace}>
            <CardButton>
              <div slot="icon"><Icon icon="add-circle" size={7} /></div>
              <div slot="title">Add a space</div>
              <div slot="info">Use an invite link, or create your own space.</div>
            </CardButton>
          </Button>
          <Link href="/people">
            <CardButton>
              <div slot="icon"><Icon icon="compass" size={7} /></div>
              <div slot="title">Browse the network</div>
              <div slot="info">Find your people on the nostr network.</div>
            </CardButton>
          </Link>
          <Button on:click={startChat}>
            <CardButton>
              <div slot="icon"><Icon icon="chat-round" size={7} /></div>
              <div slot="title">Start a conversation</div>
              <div slot="info">Use nostr's encrypted group chats to stay in touch.</div>
            </CardButton>
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
