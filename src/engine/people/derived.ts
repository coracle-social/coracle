import Fuse from "fuse.js"
import {doPipe} from "hurdak"
import {defaultTo, map, filter, sortBy} from "ramda"
import {derived} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {user} from "src/engine/session/derived"
import type {Person} from "./model"
import {people} from "./state"
import {personHasName, primeWotCaches, getWotScore, getMutes, getFollows, getNetwork} from "./utils"

export const peopleWithName = people.derived(filter(personHasName))

export const derivePerson = pubkey => people.key(pubkey).derived(defaultTo({pubkey}))

export const mutes = user.derived(getMutes)

export const follows = user.derived(getFollows)

export const network = user.derived(getNetwork)

export const deriveMuted = (value: string) => mutes.derived(s => s.has(value))

export const deriveFollowing = (pubkey: string) => follows.derived(s => s.has(pubkey))

export const searchPeople = derived(
  [pubkey, peopleWithName.throttle(300)],
  ([$pubkey, $peopleWithName]: [string, Person[]]): ((term: string) => Person[]) => {
    primeWotCaches($pubkey)

    const options = $peopleWithName.map(p => ({person: p, score: getWotScore($pubkey, p.pubkey)}))

    const fuse = new Fuse(options, {
      keys: [
        "person.profile.name",
        "person.profile.display_name",
        {name: "person.profile.nip05", weight: 0.5},
        {name: "person.profile.about", weight: 0.1},
      ],
      threshold: 0.3,
      shouldSort: false,
      includeScore: true,
    })

    return (term: string) => {
      if (!term) {
        return sortBy(item => -item.score, options).map(item => item.person)
      }

      return doPipe(fuse.search(term), [
        sortBy((r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100)),
        map((r: any) => r.item.person),
      ])
    }
  },
)
