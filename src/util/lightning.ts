const DIVISORS = {
  m: BigInt(1e3),
  u: BigInt(1e6),
  n: BigInt(1e9),
  p: BigInt(1e12)
}

const MAX_MILLISATS = BigInt('2100000000000000000')

const MILLISATS_PER_BTC = BigInt(1e11)

function hrpToMillisat(hrpString: string) {
  let divisor, value
  if (hrpString.slice(-1).match(/^[munp]$/)) {
    divisor = hrpString.slice(-1)
    value = hrpString.slice(0, -1)
  } else if (hrpString.slice(-1).match(/^[^munp0-9]$/)) {
    throw new Error('Not a valid multiplier for the amount')
  } else {
    value = hrpString
  }

  if (!value.match(/^\d+$/))
    throw new Error('Not a valid human readable amount')

  const valueBN = BigInt(value)

  const millisatoshisBN = divisor
    ? (valueBN * MILLISATS_PER_BTC) / DIVISORS[divisor]
    : valueBN * MILLISATS_PER_BTC

  if (
    (divisor === 'p' && !(valueBN % BigInt(10) === BigInt(0))) ||
    millisatoshisBN > MAX_MILLISATS
  ) {
    throw new Error('Amount is outside of valid range')
  }

  return millisatoshisBN
}

export function invoiceAmount(bolt11: string): number {
  const hrp = bolt11.match(/lnbc(\d+\w)/)
  const bn = hrpToMillisat(hrp[1])
  return Number(bn)
}
