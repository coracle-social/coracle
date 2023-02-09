<script lang="ts">
  import {last} from 'ramda'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {renderContent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import {routes} from "src/app/ui"

  export let person
</script>

<a
  href={routes.person(person.pubkey)}
  class="flex gap-4 border-l-2 border-solid border-dark hover:bg-black hover:border-accent transition-all py-3 px-6 overflow-hidden">
  <div
    class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({person.picture})" />
  <div class="flex-grow">
    <div class="flex gap-2 items-center justify-between">
      <h1 class="text-2xl">{displayPerson(person)}</h1>
      {#if person.verified_as}
      <div class="flex gap-1 text-sm">
        <i class="fa fa-user-check text-accent" />
        <span class="text-light">{last(person.verified_as.split('@'))}</span>
      </div>
      {/if}
    </div>
    <p>{@html renderContent(ellipsize(person.about || '', 140))}</p>
  </div>
</a>
