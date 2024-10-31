<script lang="ts" context="module">
  type Element = {
    id: string
    type: "date" | "note"
    value: string | TrustedEvent
    showPubkey: boolean
  }
</script>

<script lang="ts">
  import {onMount} from "svelte"
  import {derived, writable} from "svelte/store"
  import {int, assoc, MINUTE, sortBy, remove} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, DIRECT_MESSAGE} from "@welshman/util"
  import {
    pubkey,
    formatTimestampAsDate,
    inboxRelaySelectionsByPubkey,
    loadInboxRelaySelections,
    tagPubkey,
  } from "@welshman/app"
  import type {MergedThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import ProfileList from "@app/components/ProfileList.svelte"
  import ChatMessage from "@app/components/ChatMessage.svelte"
  import ChatCompose from "@app/components/ChannelCompose.svelte"
  import {userSettingValues, deriveChat, splitChatId, PLATFORM_NAME, pubkeyLink} from "@app/state"
  import {pushModal} from "@app/modal"
  import {sendWrapped} from "@app/commands"

  export let id

  const chat = deriveChat(id)
  const pubkeys = splitChatId(id)
  const others = remove($pubkey!, pubkeys)
  const thunks = writable({} as Record<string, MergedThunk>)
  const missingInboxes = derived(inboxRelaySelectionsByPubkey, $m =>
    pubkeys.filter(pk => !$m.has(pk)),
  )

  const assertEvent = (e: any) => e as TrustedEvent

  const assertNotNil = <T,>(x: T | undefined) => x!

  const showMembers = () =>
    pushModal(ProfileList, {pubkeys: others, title: `People in this conversation`})

  const onSubmit = async ({content, ...params}: EventContent) => {
    const tags = [...params.tags, ...remove($pubkey!, pubkeys).map(tagPubkey)]
    const template = createEvent(DIRECT_MESSAGE, {content, tags})
    const thunk = await sendWrapped({template, pubkeys, delay: $userSettingValues.send_delay})

    thunks.update(assoc(thunk.thunks[0].event.id, thunk))
  }

  let loading = true
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey
    let previousCreatedAt = 0

    for (const event of sortBy(e => e.created_at, $chat?.messages || [])) {
      const {id, pubkey, created_at} = event
      const date = formatTimestampAsDate(created_at)

      if (date !== previousDate) {
        elements.push({type: "date", value: date, id: date, showPubkey: false})
      }

      elements.push({
        id,
        type: "note",
        value: event,
        showPubkey: created_at - previousCreatedAt > int(15, MINUTE) || previousPubkey !== pubkey,
      })

      previousDate = date
      previousPubkey = pubkey
      previousCreatedAt = created_at
    }

    elements.reverse()
  }

  onMount(async () => {
    await Promise.all(others.map(pk => loadInboxRelaySelections(pk)))
  })

  setTimeout(() => {
    loading = false
  }, 5000)
</script>

<div class="relative flex h-full w-full flex-col">
  {#if others.length > 0}
    <PageBar>
      <div slot="title" class="row-2">
        {#if others.length === 1}
          {@const pubkey = others[0]}
          <Link external href={pubkeyLink(pubkey)} class="row-2">
            <ProfileCircle {pubkey} size={5} />
            <ProfileName {pubkey} />
          </Link>
        {:else}
          <ProfileCircles pubkeys={others} size={5} />
          <p class="overflow-hidden text-ellipsis whitespace-nowrap">
            <ProfileName pubkey={others[0]} />
            and {others.length - 1}
            {others.length > 2 ? "others" : "other"}
            <Button on:click={showMembers} class="btn btn-link">Show all members</Button>
          </p>
        {/if}
      </div>
      <div slot="action">
        {#if remove($pubkey, $missingInboxes).length > 0}
          {@const count = remove($pubkey, $missingInboxes).length}
          {@const label = count > 1 ? "inboxes are" : "inbox is"}
          <div
            class="row-2 badge badge-error badge-lg tooltip tooltip-left cursor-pointer"
            data-tip="{count} {label} not configured.">
            <Icon icon="danger" />
            {count}
          </div>
        {/if}
      </div>
    </PageBar>
  {/if}
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#if $missingInboxes.includes(assertNotNil($pubkey))}
      <div class="py-12">
        <div class="card2 col-2 m-auto max-w-md items-center text-center">
          <p class="row-2 text-lg text-error">
            <Icon icon="danger" />
            Your inbox is not configured.
          </p>
          <p>
            In order to deliver messages, {PLATFORM_NAME} needs to know where to send them. Please visit
            your <Link class="link" href="/settings/relays">relay settings page</Link> to set up your
            inbox.
          </p>
        </div>
      </div>
    {/if}
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        {@const event = assertEvent(value)}
        {@const thunk = $thunks[event.id]}
        <ChatMessage {event} {thunk} {pubkeys} {showPubkey} />
      {/if}
    {/each}
    <p
      class="m-auto flex h-10 max-w-sm flex-col items-center justify-center gap-4 py-20 text-center">
      <Spinner {loading}>
        {#if loading}
          Looking for messages...
        {:else}
          End of message history
        {/if}
      </Spinner>
      <slot name="info" />
    </p>
  </div>
  <ChatCompose {onSubmit} />
</div>
