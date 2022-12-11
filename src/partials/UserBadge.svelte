<script>
  export let user
</script>

<a href={`/users/${user.pubkey}/notes`} class="flex gap-2 items-center relative z-10">
  <div
    class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({user.picture})" />
  <span class="text-lg font-bold">{user.name || user.pubkey.slice(0, 8)}</span>
</a>
