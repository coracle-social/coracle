<script>
  import {onMount} from "svelte"
  import {navigate} from "svelte-routing"
  import RoomList from "src/partials/chat/RoomList.svelte"
  import {user} from "src/state/user"

  onMount(() => {
    if (!$user) {
      return navigate('/login')
    }
  })
</script>

<div class="flex gap-4 h-full">
  <div class="sm:ml-56 w-full hidden sm:block">
    <div class="max-w-sm m-auto pt-24 text-center">
      Select a room to join the conversation!
    </div>
  </div>
  <RoomList />
</div>

