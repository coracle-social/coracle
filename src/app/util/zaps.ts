import {get} from "svelte/store"
import type {TrustedEvent} from "@welshman/util"
import {session, zappers} from "src/engine/core"
import type {SessionWithMeta} from "src/engine/model"
import {router} from "./router"

export const getValidZap = (zap: TrustedEvent, parent: TrustedEvent) =>
  zappers.get().validateZapReceipt(zap, parent)

export const getValidZaps = (zaps: TrustedEvent[], parent: TrustedEvent) =>
  zappers.get().validateZapReceipts(zaps, parent)

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
