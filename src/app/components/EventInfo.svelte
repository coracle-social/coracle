<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {clip} from "@app/toast"

  const {event} = $props()

  const relays = ctx.app.router.Event(event).getUrls()
  const nevent1 = nip19.neventEncode({...event, relays})
  const npub1 = nip19.npubEncode(event.pubkey)
  const json = JSON.stringify(event, null, 2)
  const copyLink = () => clip(nevent1)
  const copyPubkey = () => clip(npub1)
  const copyJson = () => clip(json)
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>Event Details</div>
    {/snippet}
    {#snippet info()}
      <div>The full details of this event are shown below.</div>
    {/snippet}
  </ModalHeader>
  <FieldInline>
    {#snippet label()}
      <p>Event Link</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="file" />
        <input type="text" class="ellipsize min-w-0 grow" value={nevent1} />
        <Button onclick={copyLink} class="flex items-center">
          <Icon icon="copy" />
        </Button>
      </label>
    {/snippet}
  </FieldInline>
  <FieldInline>
    {#snippet label()}
      <p>Author Pubkey</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="user-circle" />
        <input type="text" class="ellipsize min-w-0 grow" value={npub1} />
        <Button onclick={copyPubkey} class="flex items-center">
          <Icon icon="copy" />
        </Button>
      </label>
    {/snippet}
  </FieldInline>
  <div class="relative">
    <pre class="card2 card2-sm bg-alt overflow-auto text-xs"><code>{json}</code></pre>
    <p class="absolute right-2 top-2 flex flex-grow items-center justify-between">
      <Button onclick={copyJson} class="btn btn-neutral btn-sm flex items-center">
        <Icon icon="copy" /> Copy
      </Button>
    </p>
  </div>
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
