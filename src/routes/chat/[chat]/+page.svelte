<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import Chat from "@app/components/Chat.svelte"
  import {setChecked} from "@app/state"

  onMount(() => {
    setChecked($page.url.pathname)
  })
</script>

<Chat id={$page.params.chat} />
