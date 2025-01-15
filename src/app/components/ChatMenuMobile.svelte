<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import {setChecked} from "@app/notifications"
  import {pushModal} from "@app/modal"

  const startChat = () => pushModal(ChatStart, {}, {replaceState: true})

  const markAsRead = () => {
    setChecked("/chat/*")
    history.back()
  }
</script>

<div class="col-2">
  <Button class="btn btn-primary" on:click={startChat}>
    <Icon size={4} icon="add-circle" />
    Start chat
  </Button>
  <Button class="btn btn-neutral" on:click={markAsRead}>
    <Icon size={4} icon="check-circle" />
    Mark all read
  </Button>
</div>
