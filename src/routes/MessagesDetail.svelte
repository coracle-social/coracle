<script lang="ts">
  import cx from 'classnames'
  import {assoc} from 'ramda'
  import {renameProp} from 'hurdak/lib/hurdak'
  import {toHex, displayPerson} from 'src/util/nostr'
  import {now} from 'src/util/misc'
  import {Tags} from 'src/util/nostr'
  import Channel from 'src/partials/Channel.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {getAllPubkeyRelays, sampleRelays} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import keys from 'src/agent/keys'
  import user from 'src/agent/user'
  import cmd from 'src/agent/cmd'
  import {routes} from 'src/app/ui'
  import {lastChecked} from 'src/app/alerts'
  import {renderNote} from 'src/app'

  export let entity

  let crypt = keys.getCrypt()
  let pubkey = toHex(entity)
  let person = database.watch('people', () => database.getPersonWithFallback(pubkey))

  lastChecked.update(assoc(pubkey, now()))

  const getRelays = () => {
    return sampleRelays(getAllPubkeyRelays([pubkey, user.getPubkey()]))
  }

  const decryptMessages = async events => {
    // Gotta do it in serial because of extension limitations
    for (const event of events) {
      const key = event.pubkey === pubkey
        ? pubkey
        : Tags.from(event).type("p").values().first()

      event.decryptedContent = await crypt.decrypt(key, event.content)
    }

    return events.map(renameProp('decryptedContent', 'content'))
  }

  const getFilters = () => [
    {kinds: [4], authors: [user.getPubkey()], '#p': [pubkey]},
    {kinds: [4], authors: [pubkey], '#p': [user.getPubkey()]},
  ]

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: getFilters(),
      onChunk: async events => onChunk(await decryptMessages(events)),
    })

  const loadMessages = ({until, limit}, onChunk) =>
    network.load({
      relays: getRelays(),
      filter: getFilters(),
      onChunk: async events => onChunk(await decryptMessages(events)),
    })

  const sendMessage = async content => {
    const cyphertext = await crypt.encrypt(pubkey, content)
    const [event] = await cmd.createDirectMessage(pubkey, cyphertext).publish(getRelays())

    // Return unencrypted content so we can display it immediately
    return {...event, content}
  }
</script>

<Channel {loadMessages} {listenForMessages} {sendMessage}>
  <div slot="header" class="flex gap-4 items-start">
    <div class="flex items-center gap-4">
      <Anchor type="unstyled" class="fa fa-arrow-left text-2xl cursor-pointer" href="/messages" />
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$person.kind0?.picture})" />
    </div>
    <div class="w-full flex flex-col gap-2">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <Anchor type="unstyled" href={routes.person(pubkey)} class="text-lg font-bold">
            {displayPerson($person)}
          </Anchor>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock text-light" />
          <span class="text-light">Encrypted</span>
        </div>
      </div>
      <div>{$person.kind0?.about || ''}</div>
    </div>
  </div>
  <div slot="message" let:message class={cx("flex overflow-hidden text-ellipsis", {
    'ml-12 justify-end': message.person.pubkey === user.getPubkey(),
    'mr-12': message.person.pubkey !== user.getPubkey(),
  })}>
    <div class={cx('rounded-2xl py-2 px-4 flex max-w-xl', {
      'bg-light text-black rounded-br-none': message.person.pubkey === user.getPubkey(),
      'bg-dark rounded-bl-none': message.person.pubkey !== user.getPubkey(),
    })}>
      {@html renderNote(message, {showEntire: true})}
    </div>
  </div>
</Channel>
