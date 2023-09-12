import type {Env} from "./types"
import {Directory} from "./components/Directory"
import {Events} from "./components/Events"
import {Keys} from "./components/Keys"

export class Engine {
  Env: Env
  Directory = new Directory()
  Events = new Events()
  Keys = new Keys()

  constructor(Env: Env) {
    this.Env = Env

    for (const component of Object.values(this)) {
      component.initialize?.(this)
    }
  }
}
