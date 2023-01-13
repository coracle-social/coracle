<script>
  import {fly} from 'svelte/transition'

  setTimeout(async () => {
    // Clear localstorage
    localStorage.clear()

    // do a hard refresh so everything gets totally cleared
    window.location = '/login'
  }, 300)
</script>

<div class="max-w-xl m-auto text-center py-20" in:fly={{y:20}}>
  Clearing your local database...
</div>
