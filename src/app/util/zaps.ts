import {get} from "svelte/store"
import type {TrustedEvent} from "@welshman/util"
import {session, zappers} from "src/engine/core"
import type {SessionWithMeta} from "src/engine/model"
import {router} from "./router"

// Zap validation moved into the Zappers plugin: it reads the receipt's recipient, matches it
// against the parent's zap splits, loads that recipient's zapper and validates the receipt with
// it. The old lookup always used the first split's lnurl, so zaps to any other recipient of a
// split note were silently discarded.

export const getValidZap = (zap: TrustedEvent, parent: TrustedEvent) =>
  zappers.get().validateZapReceipt(zap, parent)

export const getValidZaps = (zaps: TrustedEvent[], parent: TrustedEvent) =>
  zappers.get().validateZapReceipts(zaps, parent)

// A live projection rather than the old one-shot store, so a zap that arrives (or a zapper that
// finishes loading) after the first pass shows up without re-rendering the note
export const deriveValidZaps = (zaps: TrustedEvent[], parent: TrustedEvent) =>
  zappers.get().validZapReceipts(zaps, parent).$

export const zap = (qp: Record<string, any>) => {
  const {wallet} = (get(session) || {}) as SessionWithMeta

  if (!wallet) {
    router.at("settings/wallet/connect").cx({qp}).open()
  } else {
    router.at("zap").qp(qp).open()
  }
}
