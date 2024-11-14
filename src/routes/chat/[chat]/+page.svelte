<script lang="ts">
  import {onDestroy} from "svelte"
  import {page} from "$app/stores"
  import Chat from "@app/components/Chat.svelte"
  import {setChecked} from "@app/notifications"

  onDestroy(() => {
    setChecked($page.url.pathname)
  })
</script>

<Chat id={$page.params.chat} />
