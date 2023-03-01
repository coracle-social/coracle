<script lang="ts">
  import {onMount} from 'svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {menuIsOpen} from 'src/app/ui'
  import {newAlerts} from "src/app/alerts"

  const toggleMenu = () => menuIsOpen.update(x => !x)

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).matches('.fa-bars')) {
        menuIsOpen.set(false)
      }
    })
  })
</script>

<div
  class="fixed top-0 bg-dark flex justify-between items-center text-white w-full p-4
            border-b border-medium z-10 h-16"
>
  <button class="lg:hidden fa fa-bars fa-2xl cursor-pointer" on:click={toggleMenu} />
  <Anchor external type="unstyled" href="https://github.com/staab/coracle" class="flex items-center gap-2">
    <img alt="Coracle Logo" src="/images/logo.png" class="w-8" />
    <h1 class="staatliches text-3xl">Coracle</h1>
  </Anchor>
  {#if $newAlerts}
  <div class="w-2 h-2 rounded bg-accent absolute top-4 left-12 lg:hidden" />
  {/if}
</div>
