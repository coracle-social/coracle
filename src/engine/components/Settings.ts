import {Tags, appDataKeys} from "src/util/nostr"
import {writable} from "src/engine/util/store"
import type {Writable} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"

export class Settings {
  engine: Engine
  settings: Writable<Record<string, any>>

  getSetting = (k: string) => this.settings.get()[k]

  imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
    const base = this.getSetting("imgproxy_url")

    try {
      return base && url ? `${base}/x/s:${w}:${h}/${btoa(url)}` : url
    } catch (e) {
      return url
    }
  }

  dufflepud = (path: string) => `${this.getSetting("dufflepud_url")}/${path}`

  initialize(engine: Engine) {
    this.engine = engine

    this.settings = writable<Record<string, any>>({
      last_updated: 0,
      relay_limit: 10,
      default_zap: 21,
      show_media: true,
      report_analytics: true,
      imgproxy_url: engine.Env.IMGPROXY_URL,
      dufflepud_url: engine.Env.DUFFLEPUD_URL,
      multiplextr_url: engine.Env.MULTIPLEXTR_URL,
    })

    engine.Events.addHandler(30078, async e => {
      if (
        engine.Keys.canSign.get() &&
        Tags.from(e).getMeta("d") === appDataKeys.USER_SETTINGS &&
        e.created_at > this.getSetting("last_updated")
      ) {
        const updates = await engine.Crypt.decryptJson(e.content)

        if (updates) {
          this.settings.update($settings => ({
            ...$settings,
            ...updates,
            last_updated: e.created_at,
          }))
        }
      }
    })
  }
}
