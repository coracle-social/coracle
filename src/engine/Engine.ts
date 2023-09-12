import type {Env} from "./types"
import {Content} from "./components/Content"
import {Crypt} from "./components/Crypt"
import {Directory} from "./components/Directory"
import {Events} from "./components/Events"
import {Keys} from "./components/Keys"
import {Nip04} from "./components/Nip04"

export class Engine {
  Env: Env
  Content = new Content()
  Crypt = new Crypt()
  Directory = new Directory()
  Events = new Events()
  Keys = new Keys()
  Nip04 = new Nip04()

  constructor(Env: Env) {
    this.Env = Env

    for (const component of Object.values(this)) {
      component.initialize?.(this)
    }
  }
}
