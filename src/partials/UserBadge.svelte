<script>
  export let user
</script>

{#if user}
<a href={`/users/${user.pubkey}`} class="flex gap-2 items-center">
  <div
    class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({user.picture})" />
  <span class="text-lg font-bold">{user.name}</span>
</a>
{/if}
