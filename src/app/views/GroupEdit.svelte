<script lang="ts">
  import {prop} from "ramda"
  import {COMMUNITY} from "@welshman/util"
  import {showInfo} from "src/partials/Toast.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import type {GroupMeta} from "src/domain"
  import {
    deriveGroup,
    deleteGroupMeta,
    publishGroupMeta,
    publishCommunityMeta,
    deriveGroupMeta,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let address

  const group = deriveGroup(address)
  const meta = deriveGroupMeta(address)
  const initialValues = {...$meta, members: $group?.members || []}

  const onSubmit = async ({
    kind,
    identifier,
    listing_is_public,
    ...meta
  }: GroupMeta & {members: string[]}) => {
    // If we're switching group listing visibility, delete the old listing
    if (listing_is_public && !initialValues.listing_is_public) {
      await prop("result", await deleteGroupMeta(address))
    }

    if (kind === COMMUNITY) {
      await publishCommunityMeta(address, identifier, meta)
    } else {
      await publishGroupMeta(address, identifier, meta, listing_is_public)
    }

    showInfo("Your group has been updated!")
    router.pop()
  }
</script>

<GroupDetailsForm {onSubmit} mode="edit" values={initialValues} />
