import {writable, assoc} from '@welshman/lib'

export const formCtrl = ({submit}) => {
  const store = writable({
    loading: false,
    submit: async () => {
      if (store.get().loading) {
        return
      }

      store.update(assoc("loading", true))

      try {
        await submit()
      } catch (e) {
        // pass
      }

      store.update(assoc("loading", false))
    },
  })

  return store
}

export const boolCtrl = ({defaultValue = false} = {}) => {
  const store = writable({
    enabled: defaultValue,
    disable: () => store.update(assoc('enabled', false)),
    enable: () => store.update(assoc('enabled', true)),
  })

  return store
}

export const valueCtrl = ({defaultValue = null} = {}) => {
  const store = writable({
    enabled: defaultValue,
    clear: () => store.update(assoc('enabled', null)),
    set: value => store.update(assoc('enabled', value)),
  })

  return store
}
