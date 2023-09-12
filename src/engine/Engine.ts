import type {Env} from "./types"
import {Content} from "./components/Content"
import {Crypt} from "./components/Crypt"
import {Directory} from "./components/Directory"
import {Events} from "./components/Events"
import {Keys} from "./components/Keys"
import {Network} from "./components/Network"
import {Nip04} from "./components/Nip04"
import {Nip05} from "./components/Nip05"
import {Nip28} from "./components/Nip28"
import {Nip44} from "./components/Nip44"
import {Nip65} from "./components/Nip65"
import {Settings} from "./components/Settings"

export class Engine {
  Env: Env
  Content = new Content()
  Crypt = new Crypt()
  Directory = new Directory()
  Events = new Events()
  Keys = new Keys()
  Network = new Network()
  Nip04 = new Nip04()
  Nip05 = new Nip05()
  Nip28 = new Nip28()
  Nip44 = new Nip44()
  Nip65 = new Nip65()
  Settings = new Settings()

  constructor(Env: Env) {
    this.Env = Env

    for (const component of Object.values(this)) {
      component.initialize?.(this)
    }
  }
}
