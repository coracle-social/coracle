<script>
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {fuzzy} from "src/util/misc"
  import {renderContent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import {user, database} from 'src/agent'
  import {routes} from "src/app/ui"

  export let q

  let search

  database.people.all({'name:!nil': null}).then(people => {
    search = fuzzy(people, {keys: ["name", "about", "pubkey"]})
  })
</script>

{#each (search ? search(q) : []).slice(0, 30) as p (p.pubkey)}
  {#if p.pubkey !== $user.pubkey}
  <a href={routes.person(p.pubkey)} class="flex gap-4">
    <div
      class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
      style="background-image: url({p.picture})" />
    <div class="flex-grow">
      <div class="flex gap-2 items-center justify-between">
        <h1 class="text-2xl">{displayPerson(p)}</h1>
      </div>
      <p>{@html renderContent(ellipsize(p.about || '', 140))}</p>
    </div>
  </a>
  {/if}
{/each}
