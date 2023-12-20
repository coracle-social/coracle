<script lang="ts">
  import {toast} from "src/partials/state"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {groups, publishGroupMeta, getGroupId, getGroupName, GroupAccess} from "src/engine"
  import {router} from "src/app/router"

  export let address

  const group = groups.key(address)

  const initialValues = {
    id: getGroupId($group),
    name: getGroupName($group),
    image: $group.image || "",
    description: $group.description || "",
    relays: $group.relays || [],
    access: $group.access || GroupAccess.Closed,
    isPublic: $group.access === GroupAccess.Open,
  }

  const onSubmit = async (values: Values) => {
    const pub = await publishGroupMeta(address, values.isPublic, values)

    await pub.result

    toast.show("info", "Your group has been updated!")
    router.pop()
  }
</script>

<GroupDetailsForm {onSubmit} mode="edit" values={initialValues} />
