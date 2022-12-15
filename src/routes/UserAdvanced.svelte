<script>
  import {last} from 'ramda'
  import {switcher} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import Button from "src/partials/Button.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import {getMuffleValue} from "src/util/notes"
  import {user} from 'src/state/user'
  import {dispatch, t} from 'src/state/dispatch'
  import {modal} from "src/state/app"

  const muffleOptions = ['Never', 'Sometimes', 'Often', 'Always']

  const values = {
    // Scale up to integers for each choice we have
    muffle: switcher(Math.round(getMuffleValue($modal.user.pubkey) * 3), muffleOptions),
  }

  const save = async e => {
    e.preventDefault()

    // Scale back down to a decimal based on string value
    const muffleValue = muffleOptions.indexOf(values.muffle) / 3
    const muffle = $user.muffle
      .filter(x => x[1] !== $modal.user.pubkey)
      .concat([t("p", $modal.user.pubkey, muffleValue.toString())])
      .filter(x => last(x) !== "1")

    dispatch('account/muffle', muffle)

    modal.set(null)
  }
</script>

<form class="flex flex-col gap-4 w-full text-white max-w-2xl m-auto" in:fly={{y: 20}} on:submit={save}>
  <div class="flex flex-col gap-2">
    <h1 class="text-3xl">Advanced Follow</h1>
    <p>
      Fine grained controls for interacting with other users.
    </p>
  </div>
  <div class="flex flex-col gap-1">
    <strong>How often do you want to see notes from this person?</strong>
    <SelectButton bind:value={values.muffle} options={muffleOptions} />
    <p class="text-sm text-light">
      "Never" is effectively a mute, while "Always" will show posts whenever available.
      If you want a middle ground, choose "Sometimes" or "Often".
    </p>
  </div>
  <Button type="submit" class="text-center">Done</Button>
</form>
