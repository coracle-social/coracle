<script lang="ts">
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import {router} from "src/app/router"
  import {deriveGroup, getGroupNaddr} from "src/engine"

  export let address

  const group = deriveGroup(address)

  const createInvite = () => router.at("invites/create").qp({initialGroupAddress: address}).open()
</script>

<Heading>Share group</Heading>
<div class="flex flex-col justify-between gap-2 sm:flex-row">
  <GroupSummary hideAbout {address} />
  <Anchor button accent on:click={createInvite}>Create invite link</Anchor>
</div>
<QRCode code={getGroupNaddr($group)} />
