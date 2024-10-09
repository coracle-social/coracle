<script lang="ts">
  import {onMount} from "svelte"
  import {ctx, ago, remove} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Name from "@app/components/Name.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {chatSearch, pullConservatively} from "@app/state"

  let term = ""

  $: chats = $chatSearch.searchOptions(term).filter(c => c.pubkeys.length > 1)

  onMount(() => {
    const filter = {kinds: [WRAP], "#p": [$pubkey!]}
    const sub = subscribe({filters: [{...filter, since: ago(30)}]})

    pullConservatively({
      filters: [filter],
      relays: ctx.app.router.InboxRelays().getUrls(),
    })

    return () => sub.close()
  })
</script>

<div class="content column gap-2">
  <label class="input input-bordered mb-2 flex items-center gap-2" in:fly={{delay: 250}}>
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for conversations..." />
  </label>
  <div class="column gap-2 overflow-auto">
    {#each chats as { id, pubkeys, messages }, i (id)}
      {@const message = messages[0]}
      {@const others = remove($pubkey, pubkeys)}
      <div class="card2 bg-alt hover:bg-alt cursor-pointer px-6 py-2 transition-colors">
        <Link class="flex flex-col justify-start gap-1" href="/home/{id}">
          <div class="flex items-center gap-2">
            {#if others.length === 1}
              <ProfileCircle pubkey={others[0]} size={5} />
              <Name pubkey={others[0]} />
            {:else}
              <ProfileCircles pubkeys={others} size={5} />
              <p class="overflow-hidden text-ellipsis whitespace-nowrap">
                <Name pubkey={others[0]} />
                and {others.length - 1}
                {others.length > 2 ? "others" : "other"}
              </p>
            {/if}
          </div>
          <p class="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {message.content}
          </p>
        </Link>
      </div>
    {/each}
  </div>
</div>
