<script>
  export let person
</script>

<a href={`/people/${person.pubkey}/notes`} class="flex gap-2 items-center relative z-10">
  <div
    class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({person.picture})" />
  <span class="text-lg font-bold">{person.name || person.pubkey.slice(0, 8)}</span>
</a>
