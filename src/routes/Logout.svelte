<script>
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {settings} from "src/state/app"
  import relay, {connections} from 'src/relay'

  setTimeout(async () => {
    const $connections = get(connections)
    const $settings = get(settings)

    // Clear localstorage
    localStorage.clear()

    // Keep relays around, but delete events/tags
    await relay.db.events.clear()
    await relay.db.tags.clear()

    // Remember the user's relay selection and settings
    connections.set($connections)
    settings.set($settings)

    // do a hard refresh so everything gets totally cleared
    window.location = '/login'
  }, 300)
</script>

<div class="max-w-xl m-auto text-center py-20" in:fly={{y:20}}>
  Clearing your local database...
</div>
