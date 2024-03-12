<script lang="ts">
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import {router} from "src/app/router"
  import {deriveGroup, getGroupNaddr} from "src/engine"

  export let address

  const group = deriveGroup(address)

  const createInvite = () => router.at("invite/create").qp({initialGroupAddress: address}).open()

  let claim

  $: link = window.origin + router.at('groups').of(address).qp({claim}).toString()
</script>

<Heading>Share group</Heading>
<div class="flex flex-col justify-between gap-2 sm:flex-row">
  <GroupSummary hideAbout {address} />
  <Anchor button accent on:click={createInvite}>Create invite link</Anchor>
</div>
<Field label="Invite Code (optional)">
  <Input bind:value={claim} />
</Field>
<QRCode code={link} />
