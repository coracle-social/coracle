<script>
  import {liveQuery} from "dexie"
  import {navigate} from "svelte-routing"
  import Anchor from "src/partials/Anchor.svelte"
  import {user} from "src/state/user"
  import {db} from "src/state/db"

  const relays = liveQuery(() => db.relays.toArray())

  const createPost = () => {
    if ($user) {
      navigate("/post/new")
    } else {
      navigate("/login")
    }
  }
</script>

{#if $relays && $relays.length > 0}
  feed
  <div class="fixed bottom-0 right-0 pb-24 pr-8">
    <div
      class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
              items-center border border-dark shadow-2xl cursor-pointer"
      on:click={createPost}
    >
      <span class="fa-sold fa-plus fa-2xl" />
    </div>
  </div>
{:else if $relays}
  <div class="flex w-full justify-center items-center py-16">
    <div class="text-center max-w-2xl">
      You aren't yet connected to any relays. Please click <Anchor href="/relays"
        >here</Anchor
      > to get started.
    </div>
  </div>
{/if}

