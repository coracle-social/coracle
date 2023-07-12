import {EventEmitter} from "events"
import * as keys from "./components/keys"
import * as crypt from "./components/crypt"

export const createEngine = (engine, components) => {
  const emitter = new EventEmitter()

  for (const component of components) {
    engine[component.name] = component.contributeState?.()
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
    component.initialize?.(engine, emitter)
  }

  return engine
}

export const createDefaultEngine = () => {
  return createEngine({}, [keys, crypt])
}

export const engine = createDefaultEngine()
