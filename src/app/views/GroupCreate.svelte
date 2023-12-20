<script lang="ts">
  import {pluck} from "ramda"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {
    publishGroupMeta,
    publishGroupInvites,
    initGroup,
    publishAdminKeyShares,
    user,
    GroupAccess,
  } from "src/engine"
  import {router} from "src/app/router"

  const initialValues = {
    name: "",
    image: "",
    description: "",
    isPublic: false,
    access: GroupAccess.Closed,
    members: [$user],
    relays: [],
  }

  const onSubmit = async (values: Values) => {
    const members = pluck("pubkey", values.members)
    const {id, address} = initGroup(members, values.relays)

    await publishAdminKeyShares(address, [$user.pubkey], values.relays)
    await publishGroupInvites(address, members, values.relays)
    await publishGroupMeta(address, values.isPublic, {...values, id})

    router.at("groups").of(address).at("members").replace()
  }
</script>

<GroupDetailsForm {onSubmit} showMembers values={initialValues} />
