<script lang="ts">
  import {nip19} from "nostr-tools"
  import {ctx} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {clip} from "@app/toast"

  export let event

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
    <div slot="title">Event Details</div>
    <div slot="info">The full details of this event are shown below.</div>
  </ModalHeader>
  <FieldInline>
    <p slot="label">Event Link</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="file" />
      <input type="text" class="ellipsize min-w-0 grow" value={nevent1} />
      <Button on:click={copyLink} class="flex items-center">
        <Icon icon="copy" />
      </Button>
    </label>
  </FieldInline>
  <FieldInline>
    <p slot="label">Author Pubkey</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="user-circle" />
      <input type="text" class="ellipsize min-w-0 grow" value={npub1} />
      <Button on:click={copyPubkey} class="flex items-center">
        <Icon icon="copy" />
      </Button>
    </label>
  </FieldInline>
  <div class="relative">
    <pre class="card2 card2-sm bg-alt overflow-auto text-xs"><code>{json}</code></pre>
    <p class="absolute right-2 top-2 flex flex-grow items-center justify-between">
      <Button on:click={copyJson} class="btn btn-neutral btn-sm flex items-center">
        <Icon icon="copy" /> Copy
      </Button>
    </p>
  </div>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
