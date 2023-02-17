<script>
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import user from 'src/agent/user'

  onMount(() => navigate(user.getProfile() ? '/notes/network' : '/login'))
</script>
