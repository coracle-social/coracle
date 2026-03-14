<script lang="ts">
  import {_} from "svelte-i18n"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {router} from "src/app/util/router"
  import {publishDeletion} from "src/engine"

  export let id
  export let kind

  const onCancel = () => router.pop()

  const onConfirm = () => {
    publishDeletion({kind, id})
    router.pop()
  }
</script>

<FlexColumn>
  <p class="flex items-center gap-4 text-xl">
    <i class="fa fa-triangle-exclamation" /> {$_("noteDelete.confirmDelete")}
  </p>
  <p>
    {$_("noteDelete.deleteWarning")}
  </p>
  <div class="flex gap-2">
    <Button class="btn" on:click={onCancel}>{$_("noteDelete.cancel")}</Button>
    <Button class="btn btn-danger" on:click={onConfirm}>{$_("noteDelete.confirm")}</Button>
  </div>
</FlexColumn>
