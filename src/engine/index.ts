import * as Alerts from "./components/Alerts"
import * as Builder from "./components/Builder"
import * as Chat from "./components/Chat"
import * as Content from "./components/Content"
import * as Crypt from "./components/Crypt"
import * as Directory from "./components/Directory"
import * as Events from "./components/Events"
import * as Keys from "./components/Keys"
import * as Meta from "./components/Meta"
import * as Network from "./components/Network"
import * as Nip05 from "./components/Nip05"
import * as Nip57 from "./components/Nip57"
import * as PubkeyLoader from "./components/PubkeyLoader"
import * as Routing from "./components/Routing"
import * as Social from "./components/Social"
import * as User from "./components/User"

export const createEngine = (engine, components) => {
  const componentState = components.map(c => [c, c.contributeState?.(engine)])

  for (const [component, state] of componentState) {
    Object.assign(engine[component.name], state)
  }

  const componentSelectors = components.map(c => [c, c.contributeSelectors?.(engine)])

  for (const [component, selectors] of componentSelectors) {
    Object.assign(engine[component.name], selectors)
  }

  const componentActions = components.map(c => [c, c.contributeActions?.(engine)])

  for (const [component, actions] of componentActions) {
    Object.assign(engine[component.name], actions)
  }

  for (const component of components) {
    component.initialize?.(engine)
  }

  return engine
}

export const createDefaultEngine = Env => {
  return createEngine(
    {Env},
    {
      Alerts,
      Builder,
      Chat,
      Content,
      Crypt,
      Directory,
      Events,
      Keys,
      Meta,
      Network,
      Nip05,
      Nip57,
      PubkeyLoader,
      Routing,
      Social,
      User,
    }
  )
}
