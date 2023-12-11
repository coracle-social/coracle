<script lang="ts">
  import {toast} from "src/partials/state"
  import type {Values} from "src/app/shared/GroupDetailsForm.svelte"
  import GroupDetailsForm from "src/app/shared/GroupDetailsForm.svelte"
  import {groups, publishGroupMeta, getGroupId, getGroupName} from "src/engine"
  import {router} from "src/app/router"

  export let address

  const group = groups.key(address)

  const initialValues = {
    id: getGroupId($group),
    name: getGroupName($group),
    image: $group.image || "",
    description: $group.description || "",
    isPublic: $group.access && $group.access !== "closed",
    relays: $group.relays || [],
  }

  const onSubmit = async (values: Values) => {
    const access = values.isPublic ? "hybrid" : "closed"
    const pub = await publishGroupMeta(address, {...values, access})

    await pub.result

    toast.show("info", "Your group has been updated!")
    router.pop()
  }
</script>

<GroupDetailsForm {onSubmit} mode="edit" values={initialValues} />
