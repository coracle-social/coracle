<script>
  import {fly} from 'svelte/transition'
  import {db} from 'src/agent'

  setTimeout(async () => {
    // Clear localstorage and database
    localStorage.clear()
    db.delete()

    // do a hard refresh so everything gets totally cleared
    window.location = '/login'
  }, 300)
</script>

<div class="max-w-xl m-auto text-center py-20" in:fly={{y:20}}>
  Clearing your local database...
</div>
