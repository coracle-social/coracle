<script lang="ts">
  import {showInfo} from "src/partials/Toast.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {displayGroupMeta} from "src/domain"
  import {deriveGroupMeta, deleteGroupMeta, deriveAdminKeyForGroup} from "src/engine"
  import {router} from "src/app/util/router"

  export let address

  const meta = deriveGroupMeta(address)
  const adminKey = deriveAdminKeyForGroup(address)

  const abort = () => router.pop()

  const confirm = () => {
    deleteGroupMeta(address)
    showInfo("Group deleted!")
    router.pop()
  }

  if (!$adminKey) {
    router.pop()
  }
</script>

<Subheading>Delete Group</Subheading>
<p>Are you sure you want to delete {displayGroupMeta($meta)}?</p>
<p>
  This will only hide this group from supporting clients. Messages sent to the group may not be
  deleted from relays.
</p>
<div class="flex gap-2">
  <Anchor button on:click={abort}>Abort</Anchor>
  <Anchor button accent on:click={confirm}>Confirm</Anchor>
</div>
