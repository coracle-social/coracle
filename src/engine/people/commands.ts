import {reject} from "ramda"
import {now} from "@coracle.social/lib"
import {createEvent} from "@coracle.social/util"
import {stateKey, user, canSign, session, signer} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {Publisher, createAndPublish, getClientTags, mention} from "src/engine/network/utils"
import {hints, forcePlatformRelays, withIndexers} from "src/engine/relays/utils"
import {people} from "./state"

export const publishProfile = async profile => {
  const relays = withIndexers(forcePlatformRelays(hints.WriteRelays().getUrls()))
  const event = await signer.get().signAsUser(
    createEvent(0, {
      content: JSON.stringify(profile),
      tags: getClientTags(),
    }),
  )

  return Publisher.publish({event, relays})
}

export const publishPetnames = async (petnames: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {petnames})

  if (canSign.get()) {
    const relays = withIndexers(forcePlatformRelays(hints.WriteRelays().getUrls()))
    const event = await signer.get().signAsUser(
      createEvent(3, {
        content: session.get().kind3?.content || "",
        tags: [...petnames, ...getClientTags()],
      }),
    )

    return Publisher.publish({event, relays})
  }
}

export const follow = (type: string, value: string) => {
  const tag = type === "p" ? mention(value) : [type, value]

  return publishPetnames([
    ...reject((t: string[]) => t[1] === value, user.get()?.petnames || []),
    tag,
  ])
}

export const unfollow = (value: string) =>
  publishPetnames(reject((t: string[]) => t[1] === value, user.get()?.petnames || []))

export const publishMutes = ($mutes: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {mutes: $mutes})

  if (canSign.get()) {
    return createAndPublish(10000, {
      tags: [...$mutes.map(t => t.slice(0, 2)), ...getClientTags()],
    })
  }
}

export const mute = (type: string, pubkey: string) =>
  publishMutes([
    ...reject((t: string[]) => t[1] === pubkey, user.get()?.mutes || []),
    [type, pubkey],
  ])

export const unmute = (value: string) =>
  publishMutes(reject((t: string[]) => t[1] === value, user.get()?.mutes || []))
