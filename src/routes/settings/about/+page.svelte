<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {entityLink} from '@app/state'

  const nprofile =
    "nprofile1qqsf03c2gsmx5ef4c9zmxvlew04gdh7u94afnknp33qvv3c94kvwxgspz4mhxue69uhhyetvv9ujuerpd46hxtnfduhsz9rhwden5te0wfjkcctev93xcefwdaexwtcpzdmhxue69uhhqatjwpkx2urpvuhx2ue0vamm57"
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content">
    <div class="column content gap-6">
      <p class="text-center text-2xl">Thanks for using</p>
      <h1 class="mb-4 text-center text-5xl font-bold uppercase">Flotilla</h1>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="card2 flex flex-col gap-2 text-center shadow-2xl">
          <h3 class="text-2xl sm:h-12">Support development</h3>
          <p class="sm:h-16">Funds will be used to support development.</p>
          <Button class="btn btn-primary">Zap the Developer</Button>
        </div>
        <div class="card2 flex flex-col gap-2 text-center shadow-2xl">
          <h3 class="text-2xl sm:h-12">Get in touch</h3>
          <p class="sm:h-16">Having problems? Let us know by filing an issue.</p>
          <Link class="btn btn-primary" href="/home/97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322">
            Open an Issue
          </Link>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <p class="text-center">
          Built with 💜 by
          <span class="text-primary">
            @<Link external href={entityLink(nprofile)} class="link">hodlbod</Link>
          </span>
        </p>
        <div class="flex justify-center gap-4">
          <div class="tooltip" data-tip="Source Code">
            <Link external href="https://github.com/coracle-social/flotilla">
              <Icon icon="code-2" />
            </Link>
          </div>
          <div class="tooltip" data-tip="About the Developer">
            <Link external href="https://coracle.tools">
              <Icon icon="earth" />
            </Link>
          </div>
          <div class="tooltip" data-tip="Dev Blog">
            <Link external href={`https://yakihonne.com/users/${nprofile}`}>
              <Icon icon="pen" />
            </Link>
          </div>
          <div class="tooltip" data-tip="Podcast">
            <Link external href="https://tgfb.com/podcasts/thank-god-for-nostr/">
              <Icon icon="headphones-round" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
