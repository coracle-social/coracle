<script lang="ts">
  import cx from "classnames"
  import {defaultTo, filter, whereEq} from "ramda"
  import {onMount} from "svelte"
  import {toHex} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {
    User,
    Nip04,
    Nip65,
    Outbox,
    Crypt,
    Directory,
    Builder,
    Network,
    Keys,
  } from "src/app/engine"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"

  export let entity

  const pubkey = toHex(entity)
  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const messages = Nip04.messages.derived(filter(whereEq({contact: pubkey})))

  User.setContactLastChecked(pubkey)

  const getRelays = () =>
    Nip65.mergeHints(3, [
      Nip65.getPubkeyHints(3, pubkey),
      Nip65.getPubkeyHints(3, Keys.pubkey.get()),
    ])

  const sendMessage = async content => {
    const cyphertext = await Crypt.encrypt(pubkey, content)
    const [event] = await Outbox.publish(
      Builder.createDirectMessage(pubkey, cyphertext),
      getRelays()
    )

    // Return unencrypted content so we can display it immediately
    return {...event, content}
  }

  onMount(() => {
    return Network.subscribe({
      relays: getRelays(),
      filter: [
        {kinds: [4], authors: [Keys.pubkey.get()], "#p": [pubkey]},
        {kinds: [4], authors: [pubkey], "#p": [Keys.pubkey.get()]},
      ],
    })
  })

  document.title = `DMs with ${Directory.displayProfile($profile)}`
</script>

<Channel {messages} {sendMessage}>
  <div slot="header" class="mb-2 flex h-20 items-start gap-4 overflow-hidden p-4">
    <div class="flex items-center gap-4">
      <Anchor
        type="unstyled"
        class="fa fa-arrow-left cursor-pointer text-2xl"
        on:click={() => history.back()} />
      <PersonCircle {pubkey} size={12} />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <Anchor href={routes.person(pubkey)} class="text-lg font-bold">
            {Directory.displayProfile($profile)}
          </Anchor>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock text-gray-1" />
          <span class="text-gray-1">Encrypted</span>
        </div>
      </div>
      <PersonAbout truncate {pubkey} />
    </div>
  </div>
  <div
    slot="message"
    let:message
    class={cx("flex overflow-hidden text-ellipsis", {
      "ml-12 justify-end": message.profile.pubkey === Keys.pubkey.get(),
      "mr-12": message.profile.pubkey !== Keys.pubkey.get(),
    })}>
    <div
      class={cx("inline-block max-w-xl rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-end text-gray-8":
          message.profile.pubkey === Keys.pubkey.get(),
        "rounded-bl-none bg-gray-7": message.profile.pubkey !== Keys.pubkey.get(),
      })}>
      <div class="break-words">
        {#if typeof message.content === "string"}
          <NoteContent showEntire note={message} />
        {/if}
      </div>
      <small
        class="mt-1"
        class:text-gray-7={message.profile.pubkey === Keys.pubkey.get()}
        class:text-gray-1={message.profile.pubkey !== Keys.pubkey.get()}>
        {formatTimestamp(message.created_at)}
      </small>
    </div>
  </div>
</Channel>
