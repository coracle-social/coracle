<script lang="ts">
  import {session} from "@welshman/app"
  import {own} from "@welshman/signer"
  import {createEvent} from "@welshman/util"
  import {onMount} from "svelte"
  import {addPoWStamp} from "src/util/pow"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import PowWorker from "src/workers/pow?worker"
  import {isMobile} from "src/util/html"
  import {benchmark} from "src/engine"

  export let value

  const benchmarkDifficulty = isMobile ? 14 : 16

  onMount(() => {
    if ($benchmark) return
    // try to generate a simple pow to estimate the device capacities
    const powWorker = new PowWorker()
    const ownedEvent = own(
      createEvent(1, {
        content: "this is a random pow test",
        tags: [],
      }),
      $session.pubkey,
    )
    const start = Date.now()
    addPoWStamp(powWorker, ownedEvent, benchmarkDifficulty).then(_ => {
      $benchmark = Date.now() - start
    })
    return () => powWorker.terminate()
  })

  $: powEstimate = Math.ceil($benchmark * Math.pow(2, value - benchmarkDifficulty))
</script>

<Field>
  <div slot="label" class="flex justify-between">
    <strong>Proof Of Work</strong>
    <div>
      difficulty {value}
      ({#if !$benchmark}
        <div class="inline-flex items-center space-x-2">Calculating...</div>
      {:else if powEstimate < 1000}
        ~{powEstimate} ms
      {:else if powEstimate < 60 * 5 * 1000}
        ~{Math.ceil(powEstimate / 1000)} seconds
      {:else}
        ~{Math.ceil(powEstimate / 1000 / 60)} minutes
      {/if})
    </div>
  </div>
  <Input type="range" step="1" bind:value min={0} max={32}></Input>
  <p slot="info">Add a proof-of-work stamp to your notes to increase your reach.</p>
</Field>
