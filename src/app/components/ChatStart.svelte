<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {goto} from "$app/navigation"
  import {tryCatch, uniq} from "@welshman/lib"
  import {fromNostrURI} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {makeChatPath} from "@app/routes"

  const back = () => history.back()

  const onSubmit = () => goto(makeChatPath([...pubkeys, $pubkey!]))

  const addPubkey = (pubkey: string) => {
    pubkeys = uniq([...pubkeys, pubkey])
    term.set("")
  }

  const term = writable("")

  let pubkeys: string[] = $state([])

  onMount(() => {
    return term.subscribe(t => {
      if (t.match(/^[0-9a-f]{64}$/)) {
        addPubkey(t)
      }

      if (t.match(/^(nostr:)?(npub1|nprofile1)/)) {
        tryCatch(() => {
          const {type, data} = nip19.decode(fromNostrURI(t))

          if (type === "npub") {
            addPubkey(data)
          }

          if (type === "nprofile") {
            addPubkey(data.pubkey)
          }
        })
      }
    })
  })
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Start a Chat</div>
    {/snippet}
    {#snippet info()}
      <div>Create an encrypted chat room for private conversations.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet input()}
      <ProfileMultiSelect autofocus bind:value={pubkeys} {term} />
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={pubkeys.length === 0}>
      Create Chat
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
