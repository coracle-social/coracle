<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {page} from "$app/stores"
  import {remove} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey, inboxRelaySelectionsByPubkey, loadInboxRelaySelections} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {makeChatPath} from "@app/routes"

  export let id: string
  export let pubkeys: string[]
  export let messages: TrustedEvent[]

  const message = messages[0]
  const others = remove($pubkey!, pubkeys)
  const active = $page.params.chat === id
  const missingInbox = derived(inboxRelaySelectionsByPubkey, $m => others.some(pk => !$m.has(pk)))

  onMount(() => {
    for (const pk of others) {
      loadInboxRelaySelections(pk)
    }
  })
</script>

<Link class="flex flex-col justify-start gap-1" href={makeChatPath(pubkeys)}>
  <div
    class="cursor-pointer border-t border-solid border-base-100 px-6 py-2 transition-colors hover:bg-base-100 {$$props.class}"
    class:bg-base-100={active}>
    <div class="flex flex-col justify-start gap-1">
      <div class="flex justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          {#if others.length === 1}
            <ProfileCircle pubkey={others[0]} size={5} />
            <ProfileName pubkey={others[0]} />
          {:else}
            <ProfileCircles pubkeys={others} size={5} />
            <p class="overflow-hidden text-ellipsis whitespace-nowrap">
              <ProfileName pubkey={others[0]} />
              and {others.length - 1}
              {others.length > 2 ? "others" : "other"}
            </p>
          {/if}
        </div>
        {#if $missingInbox}
          <Icon icon="danger" class="text-error" />
        {/if}
      </div>
      <p class="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
        {message.content}
      </p>
    </div>
  </div>
</Link>
