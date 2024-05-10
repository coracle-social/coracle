<script lang="ts">
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {makeList} from "src/domain"

  const list = makeList()

  const exit = () => router.clearModals()
</script>

<ListForm {list} {exit} />
