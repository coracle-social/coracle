<script>
  import {last, find, whereEq} from 'ramda'
  import {fly} from 'svelte/transition'
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {user} from 'src/agent'
  import {addRelay, removeRelay} from "src/app"

  export let person
</script>

<div in:fly={{y: 20}}>
  <Content>
    <p>
      Below are the relays this user publishes to. Join one or more to make sure you never
      miss their updates.
    </p>
    {#if (person.relays || []).length === 0}
    <div class="pt-8 text-center">No relays found</div>
    {:else}
      {#each person.relays as {url, write}, i (url)}
        <div class="rounded border border-solid border-medium bg-dark shadow p-2 px-3">
          <div class="flex gap-2 items-center justify-between">
            <strong class="flex gap-2 items-center">
              <i class={url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
              {last(url.split('://'))}
            </strong>
            {#if find(whereEq({url}), $user.relays)}
            <Anchor type="button" on:click={() => removeRelay({url})}>Leave</Anchor>
            {:else}
            <Anchor type="button" on:click={() => addRelay({url})}>Join</Anchor>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </Content>
</div>
