<script lang="ts">
  import {prop} from "ramda"
  import {toast} from "src/partials/state"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {
    deleteGroupMeta,
    publishGroupMeta,
    publishCommunityMeta,
    getGroupId,
    getGroupName,
    deriveGroup,
  } from "src/engine"
  import {router} from "src/app/router"

  export let address

  const group = deriveGroup(address)

  const initialValues = {
    id: getGroupId($group),
    type: address.startsWith("34550:") ? "open" : "closed",
    relays: $group.relays || [],
    list_publicly: $group.listing_is_public,
    meta: {
      name: getGroupName($group),
      about: $group.meta?.about || "",
      picture: $group.meta?.picture || "",
      banner: $group.meta?.banner || "",
    },
  }

  const onSubmit = async ({id, type, list_publicly, relays, meta}: Values) => {
    // If we're switching group listing visibility, delete the old listing
    if ($group.listing_is_public && !list_publicly) {
      await prop("result", await deleteGroupMeta($group.address))
    }

    if (type === "open") {
      await prop("result", await publishCommunityMeta(address, id, relays, meta))
    } else {
      await prop("result", await publishGroupMeta(address, id, relays, meta, list_publicly))
    }

    toast.show("info", "Your group has been updated!")
    router.pop()
  }
</script>

<GroupDetailsForm {onSubmit} mode="edit" values={initialValues} />
