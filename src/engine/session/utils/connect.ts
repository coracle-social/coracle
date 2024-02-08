import {NostrConnectBroker} from "src/engine/network/utils"
import type {Session} from "src/engine/session/model"

export class Connect {
  broker?: NostrConnectBroker

  constructor(readonly session: Session) {
    if (this.isEnabled()) {
      const {pubkey, connectKey, connectHandler} = session

      this.broker = NostrConnectBroker.get(pubkey, connectKey, connectHandler)

      if (!this.broker.connected) {
        this.broker.connect()
      }
    }
  }

  isEnabled() {
    return this.session?.method === "connect"
  }
}
