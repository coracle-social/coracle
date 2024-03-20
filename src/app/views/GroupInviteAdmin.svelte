<script lang="ts">
  import {pluck} from "ramda"
  import {toast} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {publishAdminKeyShares} from "src/engine"
  import {router} from "src/app/router"

  export let address

  const submit = () => {
    modal = "confirm"
  }

  const abort = () => {
    modal = null
  }

  const confirm = () => {
    publishAdminKeyShares(address, pluck("pubkey", people))
    toast.show("info", "Key shares sent!")
    router.clearModals()
  }

  let modal = null
  let people = []
</script>

<Subheading>Invite Group Admin</Subheading>
<p>
  Keys are shared over nostr using encrypted messages. Be aware that this can reduce your group's
  privacy, for example if any receipient's key is compromised.
</p>
<PersonMultiSelect bind:value={people} />
<Anchor button accent disabled={people.length === 0} on:click={submit}>Share Admin Key</Anchor>

{#if modal === "confirm"}
  <Modal>
    <Subheading>Confirm key share</Subheading>
    <p>
      Are you sure you want to share the <b>admin key</b> for <GroupName {address} /> with the following
      people?
    </p>
    <ul>
      {#each people as person (person.pubkey)}
        <PersonBadgeSmall pubkey={person.pubkey} />
      {/each}
    </ul>
    <div class="flex gap-2">
      <Anchor button on:click={abort}>Abort</Anchor>
      <Anchor button accent on:click={confirm}>Confirm</Anchor>
    </div>
  </Modal>
{/if}
