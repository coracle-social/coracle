<script lang="ts">
  import Subheading from "src/partials/Subheading.svelte"
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {makeUserList} from "src/domain"

  export let tags = []
  export let kind: number | undefined = undefined
  export let title = ""
  export let description = ""

  const list = makeUserList({tags, title, description, ...(kind !== undefined ? {kind} : {})})

  const hide = tags.length > 0 ? ["type"] : []

  const exit = () => router.clearModals()
</script>

<Subheading class="text-center">Create list</Subheading>
<ListForm {list} {exit} {hide} />
