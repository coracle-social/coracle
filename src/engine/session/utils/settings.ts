import {prop} from "ramda"
import {env, pubkey, sessions} from "src/engine/session/state"

export const getDefaultSettings = () => ({
  relay_limit: 10,
  default_zap: 21,
  show_media: true,
  muted_words: [],
  hide_sensitive: true,
  report_analytics: true,
  auto_authenticate: false,
  min_wot_score: 0,
  enable_reactions: true,
  enable_client_tag: false,
  nip96_urls: env.get().NIP96_URLS.slice(0, 1),
  imgproxy_url: env.get().IMGPROXY_URL,
  dufflepud_url: env.get().DUFFLEPUD_URL,
  multiplextr_url: env.get().MULTIPLEXTR_URL,
  platform_zap_split: env.get().PLATFORM_ZAP_SPLIT,
})

export const getSettings = () => {
  const session = sessions.get()[pubkey.get()]

  return {...getDefaultSettings(), ...session?.settings}
}

export const getSetting = k => prop(k, getSettings())

export const imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
  const base = getSetting("imgproxy_url")

  if (!url || url.match("gif$")) {
    return url
  }

  url = url.split("?")[0]

  try {
    return base && url ? `${base}/x/s:${w}:${h}/${btoa(url)}` : url
  } catch (e) {
    return url
  }
}

export const dufflepud = (path: string) => `${getSetting("dufflepud_url")}/${path}`
