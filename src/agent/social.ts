import {uniq} from 'ramda'
import {Tags} from 'src/util/nostr'
import database from 'src/agent/database'

export const getFollows = pubkey =>
  Tags.wrap(database.getPersonWithFallback(pubkey).petnames).type("p").values().all()

export const getNetwork = pubkey =>
  uniq(getFollows(pubkey).flatMap(getFollows))
