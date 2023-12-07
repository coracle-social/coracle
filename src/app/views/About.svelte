<script lang="ts">
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/router"
  import {people} from "src/engine"

  document.title = "About"

  const hash = import.meta.env.VITE_BUILD_HASH
  const nprofile =
    "nprofile1qqsf03c2gsmx5ef4c9zmxvlew04gdh7u94afnknp33qvv3c94kvwxgspz4mhxue69uhhyetvv9ujuerpd46hxtnfduhsz9rhwden5te0wfjkcctev93xcefwdaexwtcpzdmhxue69uhhqatjwpkx2urpvuhx2ue0vamm57"
  const hodlbodPubkey = "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322"
  const coraclePubkey = "8ec86ac9e10979998652068ee6b00223b8e3265aabb3fe28fb6b3b6e294adc96"

  // Provide complete details in case they haven't loaded coracle's profile
  people.key(coraclePubkey).update($person => ({
    ...$person,
    pubkey: coraclePubkey,
    profile: {
      ...$person?.profile,
      name: "Coracle",
    },
    zapper: {
      lnurl:
        "lnurl1dp68gurn8ghj7em909ek2u3wve6kuep09emk2mrv944kummhdchkcmn4wfk8qtmrdaexzcmvv5tqwy7g",
      callback: "https://api.geyser.fund/.well-known/lnurlp/coracle",
      nostrPubkey: "b6dcdddf86675287d1a4e8620d92aa905c258d850bf8cc923d39df1edfee5ee7",
      allowsNostr: true,
      maxSendable: 5000000000,
      minSendable: 1000,
    },
  }))
</script>

<FlexColumn class="gap-8">
  <div class="flex flex-col items-center justify-center">
    <Heading>Coracle</Heading>
    <h2>An experimental nostr client</h2>
    {#if hash}
      <p class="mt-1 text-xs">Running build {hash.slice(0, 8)}</p>
    {/if}
  </div>
  <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
    <Card>
      <FlexColumn class="py-6 text-center">
        <h3 class="text-xl sm:h-12">Support development</h3>
        <p class="sm:h-24">
          All funds donated will be used to support server costs and development.
        </p>
        <div class="flex justify-center">
          <Anchor
            modal
            button
            accent
            href={router.at("people").of(coraclePubkey).at("zap").toString()}>
            Zap the developer
          </Anchor>
        </div>
      </FlexColumn>
    </Card>
    <Card>
      <FlexColumn class="py-6 text-center">
        <h3 class="text-xl sm:h-12">Get in touch</h3>
        <p class="sm:h-24">Having problems? Let us know.</p>
        <div class="flex justify-center">
          <Anchor
            button
            accent
            external
            href="https://github.com/coracle-social/coracle/issues/new">
            Open an Issue
          </Anchor>
        </div>
      </FlexColumn>
    </Card>
  </div>
  <div class="flex flex-col gap-4">
    <p class="text-center">
      Built with 💜 by @<Anchor
        modal
        underline
        href={router.at("people").of(hodlbodPubkey).toString()}>hodlbod</Anchor>
    </p>
    <p class="flex justify-center gap-4">
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href="https://github.com/coracle-social/coracle"
            ><i class="fa fa-code-branch" /></Anchor>
        </div>
        <div slot="tooltip">Source Code</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href="https://info.coracle.social"
            ><i class="fa fa-earth-americas" /></Anchor>
        </div>
        <div slot="tooltip">Website</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href={`https://yakihonne.com/users/${nprofile}`}
            ><i class="fa fa-pen-clip" /></Anchor>
        </div>
        <div slot="tooltip">Dev Blog</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href="https://tgfb.com/podcasts/thank-god-for-nostr/">
            <i class="fa fa-rss" />
          </Anchor>
        </div>
        <div slot="tooltip">Podcast</div>
      </Popover>
    </p>
  </div>
</FlexColumn>
