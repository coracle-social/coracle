<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import pick from "ramda/src/pick"
  import {stripExifData} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {user, getRelays} from "src/agent"
  import {toast} from "src/app"
  import {routes} from "src/app/ui"
  import cmd from "src/app/cmd"

  let values = {picture: null, about: null, name: null, nip05: null}

  const nip05Url = "https://github.com/nostr-protocol/nips/blob/master/05.md"
  const pseudUrl = "https://www.coindesk.com/markets/2020/06/29/many-bitcoin-developers-are-choosing-to-use-pseudonyms-for-good-reason/"

  onMount(async () => {
    if (!$user) {
      return navigate("/login")
    }

    values = pick(Object.keys(values), $user)

    document.querySelector('[name=picture]').addEventListener('change', async e => {
      const [file] = e.target.files

      if (file) {
        const reader = new FileReader()
        reader.onload = () => values.picture = reader.result
        reader.onerror = e => console.error(e)
        reader.readAsDataURL(await stripExifData(file))
      } else {
        values.picture = null
      }
    })
  })

  const submit = async event => {
    event.preventDefault()

    await cmd.updateUser(getRelays(), values)

    navigate(routes.person($user.pubkey, 'profile'))

    toast.show("info", "Your profile has been updated!")
  }
</script>

<form on:submit={submit} in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-center items-center flex-col mb-4">
      <Heading>About You</Heading>
      <p>
        Give people a friendly way to recognize you. We recommend you do not use your real name or
        share your personal information. The future of the internet is
        <Anchor external href={pseudUrl}>pseudonymous</Anchor>.
      </p>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Username</strong>
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.name}>
          <i slot="before" class="fa-solid fa-user-astronaut" />
        </Input>
        <p class="text-sm text-light">
          Your username can be changed at any time. To prevent spoofing, a few characters of your
          public key will also be displayed next to your posts.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>NIP-05 Identifier</strong>
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.nip05}>
          <i slot="before" class="fa-solid fa-user-check" />
        </Input>
        <p class="text-sm text-light">
          Enter a <Anchor external href={nip05Url}>NIP-05</Anchor> identifier in the form
          "name@domain.com" to verify your public key.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>About you</strong>
        <Textarea name="about" bind:value={values.about} />
        <p class="text-sm text-light">
          Tell the world about yourself. This will be shown on your profile page.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Profile Image</strong>
        <input type="file" name="picture" />
        <p class="text-sm text-light">
          Your profile image will have all metadata removed before being published.
        </p>
      </div>
      <Button type="submit" class="text-center">Done</Button>
    </div>
  </Content>
</form>
