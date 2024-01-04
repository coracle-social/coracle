<script lang="ts">
  import {pluck} from "ramda"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {
    nip44,
    publishGroupMeta,
    publishGroupInvites,
    initGroup,
    publishAdminKeyShares,
    user,
    joinGroup,
    GroupAccess,
  } from "src/engine"
  import {router} from "src/app/router"

  const initialValues = {
    name: "",
    image: "",
    description: "",
    isPublic: !$nip44.isEnabled(),
    access: $nip44.isEnabled() ? GroupAccess.Closed : GroupAccess.Open,
    members: [$user],
    relays: [],
  }

  const onSubmit = async (values: Values) => {
    const members = pluck("pubkey", values.members)
    const {id, address} = initGroup(values.relays)

    await publishAdminKeyShares(address, [$user.pubkey], values.relays)
    await publishGroupMeta(address, values.isPublic, {...values, id})

    if (values.access === GroupAccess.Open) {
      joinGroup(address)
    } else {
      await publishGroupInvites(address, members, values.relays)
    }

    router.at("groups").of(address).at("members").replace()
  }
</script>

<GroupDetailsForm {onSubmit} showMembers values={initialValues} />
