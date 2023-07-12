import * as Keys from "./components/Keys"
import * as Crypt from "./components/Crypt"
import * as Events from "./components/Events"
import * as Alerts from "./components/Alerts"

export const createEngine = (engine, components) => {
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
    component.initialize?.(engine)
  }

  return engine
}

export const createDefaultEngine = () => {
  return createEngine({}, {Keys, Crypt, Events, Alerts})
}

export const engine = createDefaultEngine()
