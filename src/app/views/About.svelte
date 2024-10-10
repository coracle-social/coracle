<script lang="ts">
  import {tagZapSplit} from "@welshman/app"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/util/router"
  import {loadPubkeys, env} from "src/engine"

  const hash = import.meta.env.VITE_BUILD_HASH
  const hodlbodPubkey = "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322"
  const splits = [tagZapSplit(env.PLATFORM_PUBKEY)]

  loadPubkeys([env.PLATFORM_PUBKEY])

  document.title = "About"
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
          <Anchor modal button accent href={router.at("zap").qp({splits}).toString()}>
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
          <Anchor external href="https://coracle.tools">
            <i class="fa fa-earth-americas" />
          </Anchor>
        </div>
        <div slot="tooltip">Website</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href="https://hodlbod.npub.pro/"
            ><i class="fa fa-pen-clip" /></Anchor>
        </div>
        <div slot="tooltip">Dev Blog</div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <Anchor external href="https://fountain.fm/show/vnmoRQQ50siLFRE8k061">
            <i class="fa fa-rss" />
          </Anchor>
        </div>
        <div slot="tooltip">Podcast</div>
      </Popover>
    </p>
  </div>
</FlexColumn>
