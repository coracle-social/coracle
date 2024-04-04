<script lang="ts">
  import {toast} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {groups, createAndPublish, hints, deriveAdminKeyForGroup, displayGroup} from "src/engine"
  import {router} from "src/app/router"

  export let address

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)

  const abort = () => router.pop()

  const confirm = () => {
    createAndPublish({
      kind: 5,
      tags: [["a", address]],
      relays: hints.WithinContext(address).getUrls(),
      sk: $adminKey.privkey,
    })

    toast.show("info", "Group deleted!")
    router.pop()
  }

  if (!$adminKey) {
    router.pop()
  }
</script>

<Subheading>Delete Group</Subheading>
<p>Are you sure you want to delete {displayGroup($group)}?</p>
<p>
  This will only hide this group from supporting clients. Messages sent to the group may not be
  deleted from relays.
</p>
<div class="flex gap-2">
  <Anchor button on:click={abort}>Abort</Anchor>
  <Anchor button accent on:click={confirm}>Confirm</Anchor>
</div>
