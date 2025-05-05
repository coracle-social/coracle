<script lang="ts">
  import type {Snippet} from "svelte"
  import {onMount} from "svelte"
  import {int, nthNe, MINUTE, sortBy, remove, formatTimestampAsDate} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, DIRECT_MESSAGE, INBOX_RELAYS} from "@welshman/util"
  import {
    pubkey,
    tagPubkey,
    sendWrapped,
    loadUsingOutbox,
    inboxRelaySelectionsByPubkey,
  } from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ProfileList from "@app/components/ProfileList.svelte"
  import ChatMessage from "@app/components/ChatMessage.svelte"
  import ChatCompose from "@app/components/ChatCompose.svelte"
  import ChatComposeParent from "@app/components/ChatComposeParent.svelte"
  import {
    INDEXER_RELAYS,
    userSettingValues,
    deriveChat,
    splitChatId,
    PLATFORM_NAME,
  } from "@app/state"
  import {pushModal} from "@app/modal"
  import {prependParent} from "@app/commands"

  type Props = {
    id: string
    info?: Snippet
  }

  const {id, info}: Props = $props()

  const chat = deriveChat(id)
  const pubkeys = splitChatId(id)
  const others = remove($pubkey!, pubkeys)
  const missingInboxes = $derived(pubkeys.filter(pk => !$inboxRelaySelectionsByPubkey.has(pk)))

  const showMembers = () =>
    pushModal(ProfileList, {pubkeys: others, title: `People in this conversation`})

  const replyTo = (event: TrustedEvent) => {
    parent = event
    compose?.focus()
  }

  const clearParent = () => {
    parent = undefined
  }

  const onSubmit = async (params: EventContent) => {
    // Remove p tags since they result in forking the conversation
    const tags = [...params.tags.filter(nthNe(0, "p")), ...remove($pubkey!, pubkeys).map(tagPubkey)]

    await sendWrapped({
      pubkeys,
      template: createEvent(DIRECT_MESSAGE, prependParent(parent, {...params, tags})),
      delay: $userSettingValues.send_delay,
    })

    clearParent()
  }

  let loading = $state(true)
  let compose: ChatCompose | undefined = $state()
  let parent: TrustedEvent | undefined = $state()
  let chatCompose: HTMLElement | undefined = $state()
  let dynamicPadding: HTMLElement | undefined = $state()

  const elements = $derived.by(() => {
    const elements = []

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

    return elements.reverse()
  })

  onMount(() => {
    // Don't use loadInboxRelaySelection because we want to force reload
    for (const pubkey of others) {
      loadUsingOutbox({
        pubkey,
        kind: INBOX_RELAYS,
        relays: INDEXER_RELAYS,
      })
    }

    const observer = new ResizeObserver(() => {
      if (dynamicPadding && chatCompose) {
        dynamicPadding.style.minHeight = `${chatCompose.offsetHeight}px`
      }
    })

    observer.observe(chatCompose!)

    return () => {
      observer.unobserve(chatCompose!)
    }
  })

  setTimeout(() => {
    loading = false
  }, 5000)
</script>

<PageBar>
  {#snippet title()}
    <div class="flex flex-col gap-1 sm:flex-row sm:gap-2">
      {#if others.length === 0}
        <div class="row-2">
          <ProfileCircle pubkey={$pubkey!} size={5} />
          <ProfileName pubkey={$pubkey!} />
        </div>
      {:else if others.length === 1}
        {@const pubkey = others[0]}
        {@const onClick = () => pushModal(ProfileDetail, {pubkey})}
        <Button onclick={onClick} class="row-2">
          <ProfileCircle {pubkey} size={5} />
          <ProfileName {pubkey} />
        </Button>
      {:else}
        <div class="flex items-center gap-2">
          <ProfileCircles pubkeys={others} size={5} />
          <p class="overflow-hidden text-ellipsis whitespace-nowrap">
            <ProfileName pubkey={others[0]} />
            and
            {#if others.length === 2}
              <ProfileName pubkey={others[1]} />
            {:else}
              {others.length - 1}
              {others.length > 2 ? "others" : "other"}
            {/if}
          </p>
        </div>
        {#if others.length > 2}
          <Button onclick={showMembers} class="btn btn-link hidden sm:block"
            >Show all members</Button>
        {/if}
      {/if}
    </div>
  {/snippet}
  {#snippet action()}
    <div>
      {#if remove($pubkey, missingInboxes).length > 0}
        {@const count = remove($pubkey, missingInboxes).length}
        {@const label = count > 1 ? "inboxes are" : "inbox is"}
        <div
          class="row-2 badge badge-error badge-lg tooltip tooltip-left cursor-pointer"
          data-tip="{count} {label} not configured.">
          <Icon icon="danger" />
          {count}
        </div>
      {/if}
    </div>
  {/snippet}
</PageBar>

<PageContent class="flex flex-col-reverse pt-4">
  <div bind:this={dynamicPadding}></div>
  {#if missingInboxes.includes($pubkey!)}
    <div class="py-12">
      <div class="card2 col-2 m-auto max-w-md items-center text-center">
        <p class="row-2 text-lg text-error">
          <Icon icon="danger" />
          Your inbox is not configured.
        </p>
        <p>
          In order to deliver messages, {PLATFORM_NAME} needs to know where to send them. Please visit
          your <Link class="link" href="/settings/relays">relay settings page</Link> to set up your inbox.
        </p>
      </div>
    </div>
  {:else if missingInboxes.length > 0}
    <div class="py-12">
      <div class="card2 col-2 m-auto max-w-md items-center text-center">
        <p class="row-2 text-lg text-error">
          <Icon icon="danger" />
          {missingInboxes.length}
          {missingInboxes.length > 1 ? "inboxes are" : "inbox is"} not configured.
        </p>
        <p>
          In order to deliver messages, {PLATFORM_NAME} needs to know where to send them. Please make
          sure everyone in this conversation has set up their inbox relays.
        </p>
      </div>
    </div>
  {/if}
  {#each elements as { type, id, value, showPubkey } (id)}
    {#if type === "date"}
      <Divider>{value}</Divider>
    {:else}
      <ChatMessage
        event={$state.snapshot(value as TrustedEvent)}
        {pubkeys}
        {showPubkey}
        {replyTo} />
    {/if}
  {/each}
  <p class="m-auto flex h-10 max-w-sm flex-col items-center justify-center gap-4 py-20 text-center">
    <Spinner {loading}>
      {#if loading}
        Looking for messages...
      {:else}
        End of message history
      {/if}
    </Spinner>
    {@render info?.()}
  </p>
</PageContent>

<div class="chat__compose bg-base-200" bind:this={chatCompose}>
  <div>
    {#if parent}
      <ChatComposeParent event={parent} clear={clearParent} verb="Replying to" />
    {/if}
  </div>
  <ChatCompose bind:this={compose} {onSubmit} />
</div>
