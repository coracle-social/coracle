<script lang="ts">
  import {isGroupAddress} from "@welshman/util"
  import {session} from "@welshman/app"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {deriveAdminKeyForGroup} from "src/engine"
  import {router} from "src/app/util/router"

  export let address
  export let pubkey

  const adminKey = deriveAdminKeyForGroup(address)

  const remove = () =>
    router
      .at("groups")
      .of(address)
      .at("rotate")
      .qp({removeMembers: [pubkey]})
      .open()

  const openPerson = pubkey => router.at("people").of(pubkey).open()
</script>

<Card interactive on:click={() => openPerson(pubkey)}>
  <PersonSummary inert {pubkey}>
    <div slot="actions" on:click|stopPropagation>
      {#if $adminKey && pubkey !== $session.pubkey && isGroupAddress(address)}
        <Anchor on:click={remove} button accent>Remove</Anchor>
      {/if}
    </div>
  </PersonSummary>
</Card>
