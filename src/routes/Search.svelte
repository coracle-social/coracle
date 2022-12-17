<script>
  import {fly} from 'svelte/transition'
  import Input from "src/partials/Input.svelte"
  import SearchPeople from 'src/views/SearchPeople.svelte'
  import SearchNotes from 'src/views/SearchNotes.svelte'

  export let type

  let q = ''
</script>

<ul class="border-b border-solid border-dark flex max-w-xl m-auto pt-2" in:fly={{y: 20}}>
  <li
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'people'}>
    <a class="block px-8 py-4 " href="/search/people">People</a>
  </li>
  <li
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'notes'}>
    <a class="block px-8 py-4 " href="/search/notes">Notes</a>
  </li>
</ul>

<div class="max-w-xl m-auto mt-4" in:fly={{y: 20}}>
  <Input bind:value={q} placeholder="Search for people">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
</div>

{#if type === 'people'}
<SearchPeople {q} />
{:else if type === 'notes'}
<SearchNotes {q} />
{/if}
