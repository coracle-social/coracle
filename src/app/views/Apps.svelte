<script>
  import {fly} from "svelte/transition"
  import Media from "src/partials/Media.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"

  const apps = [
    ["https://zapstr.live", "Zapstr", "Stream music, zap artists"],
    [
      "https://highlighter.com",
      "Highlighter",
      "Highlight anything on the web - add notes and share with friends.",
    ],
    ["https://www.wavman.app", "Wavman", "A nostalgic music player built on nostr."],
    ["https://feeds.nostr.band", "Feeds", "Find custom curated feeds - and create your own."],
    ["https://blowater.deno.dev", "Blowater", "The best nostr micro-client for managing DMs."],
    ["https://listr.lol", "Listr", "Build, share, and browse custom lists."],
    ["https://nosbin.com", "Nosbin", "Copy/paste/share."],
    ["https://nostrnests.com/", "Nostr Nests", "Live stream your thoughts, as the happen."],
    ["https://nostr.watch", "Nostr Watch", "A directory of nostr relays."],
    ["https://nostr.directory", "Nostr Directory", "Validate your nostr pubkey with Twitter."],
    ["https://getalby.com", "Alby", "Sign in to nostr apps without sharing your private key."],
    ["https://nak.nostr.com", "NAK", "A Nostr Army Knife, for advanced users."],
    ["https://nostrplebs.com", "NostrPlebs", "Get verified at nostrplebs.com."],
  ]

  document.title = "Apps"
</script>

<div in:fly={{y: 20}}>
  <div class="flex flex-col gap-12 p-4">
    <div class="flex flex-col items-center justify-center">
      <Heading>Recommended micro-apps</Heading>
      <p>Hand-picked recommendations to enhance your nostr experience.</p>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      {#each apps as [url, title, description]}
        <Card class="flex flex-col gap-2">
          <h1 class="text-2xl">{title}</h1>
          <p>{description}</p>
          <Media link={{url}} />
        </Card>
      {/each}
    </div>
  </div>
</div>
