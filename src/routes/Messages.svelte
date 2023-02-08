<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {sortBy, pluck} from 'ramda'
  import {personKinds} from 'src/util/nostr'
  import {batch, now} from 'src/util/misc'
  import Channel from 'src/partials/Channel.svelte'
  import {database, getRelays, user, db, listen, keys} from 'src/agent'
  import {messages} from 'src/app'
  import {routes} from 'src/app/ui'
  import cmd from 'src/app/cmd'

  export let entity

  let crypt = keys.getCrypt()
  let {data: pubkey} = nip19.decode(entity) as {data: string}
  let person = database.watch('people', p => p.get(pubkey))

  messages.lastCheckedByPubkey.update($obj => ({...$obj, [pubkey]: now()}))

  const decryptMessages = async events => {
    // Gotta do it in serial because of extension limitations
    for (const event of events) {
      const key = event.pubkey === pubkey ? pubkey : event.recipient

      event.content = await crypt.decrypt(key, event.content)
    }

    return events
  }

  const listenForMessages = cb => listen(
    getRelays().concat(getRelays(pubkey)),
    [{kinds: personKinds, authors: [pubkey]},
     {kinds: [4], authors: [$user.pubkey], '#p': [pubkey]},
     {kinds: [4], authors: [pubkey], '#p': [$user.pubkey]}],
    batch(300, async events => {
      // Reload from db since we annotate messages there
      const messageIds = pluck('id', events.filter(e => e.kind === 4))
      const messages = await db.table('messages').where('id').anyOf(messageIds).toArray()

      cb(await decryptMessages(messages))
    })
  )

  const loadMessages = async ({until, limit}) => {
    const fromThem = await db.table('messages').where('pubkey').equals(pubkey).toArray()
    const toThem = await db.table('messages').where('recipient').equals(pubkey).toArray()
    const events = fromThem.concat(toThem).filter(e => e.created_at < until)
    const messages = sortBy(e => -e.created_at, events).slice(0, limit)

    return await decryptMessages(messages)
  }

  const sendMessage = async content => {
    const cyphertext = await crypt.encrypt(pubkey, content)
    const event = await cmd.createDirectMessage(getRelays(), pubkey, cyphertext)

    // Return unencrypted content so we can display it immediately
    return {...event, content}
  }
</script>

<Channel
  type="dm"
  name={$person?.name}
  about={$person?.about}
  picture={$person?.picture}
  link={$person ? routes.person($person.pubkey) : null}
  {loadMessages}
  {listenForMessages}
  {sendMessage}
/>
