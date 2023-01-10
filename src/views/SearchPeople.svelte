<script>
  import {prop} from 'ramda'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {fuzzy} from "src/util/misc"
  import {renderContent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import {user, people} from 'src/agent'
  import {routes} from "src/app/ui"

  export let q

  let search = fuzzy(
    Object.values($people).filter(prop('name')),
    {keys: ["name", "about", "pubkey"]}
  )
</script>

<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each search(q).slice(0, 30) as p (p.pubkey)}
    {#if p.pubkey !== $user.pubkey}
    <li in:fly={{y: 20}}>
      <a href={routes.person(p.pubkey)} class="flex gap-4 my-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({p.picture})" />
        <div class="flex-grow">
          <h1 class="text-2xl">{displayPerson(p)}</h1>
          <p>{@html renderContent(ellipsize(p.about || '', 140))}</p>
        </div>
      </a>
    <li>
    {/if}
  {/each}
</ul>
