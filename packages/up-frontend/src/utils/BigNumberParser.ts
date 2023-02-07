import { BigNumber } from 'ethers'

export function BigNumberParser(input: any): Record<string, unknown> {
  Object.keys(input).forEach((key) => {
    if (Array.isArray(input[key])) {
      ;(input[key] as Array<unknown>).forEach((item) => {
        BigNumberParser(item)
      })
    } else if (input[key].type && input[key].type === 'BigNumber') {
      input[key] = BigNumber.from(input[key])
    } else if (typeof input[key] === 'object') {
      BigNumberParser(input[key])
    }
  })
  return input
}
