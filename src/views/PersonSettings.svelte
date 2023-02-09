<script>
  import {last} from 'ramda'
  import {switcher, first} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import Button from "src/partials/Button.svelte"
  import Content from 'src/partials/Content.svelte'
  import SelectButton from "src/partials/SelectButton.svelte"
  import {user, getWriteRelays} from 'src/agent'
  import {modal} from 'src/app'
  import cmd from 'src/app/cmd'

  const muffle = $user.muffle || []
  const muffleOptions = ['Never', 'Sometimes', 'Often', 'Always']
  const muffleValue = parseFloat(first(muffle.filter(t => t[1] === $modal.person.pubkey).map(last)) || 1)

  const values = {
    // Scale up to integers for each choice we have
    muffle: switcher(Math.round(muffleValue * 3), muffleOptions),
  }

  const save = async e => {
    e.preventDefault()

    // Scale back down to a decimal based on string value
    const muffleValue = muffleOptions.indexOf(values.muffle) / 3
    const muffleTags = muffle
      .filter(t => t[1] !== $modal.person.pubkey)
      .concat([["p", $modal.person.pubkey, muffleValue.toString()]])
      .filter(t => last(t) !== "1")

    cmd.muffle(getWriteRelays(), muffleTags)

    history.back()
  }
</script>

<form in:fly={{y: 20}} on:submit={save}>
  <Content class="text-white">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl">Advanced Follow</h1>
      <p>
        Fine grained controls for interacting with other people.
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
  </Content>
</form>
