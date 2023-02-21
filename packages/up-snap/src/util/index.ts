import { BigNumber } from 'ethers';

export function getFunctionText (type: string, addr: string, amount: string): string {
  let res
  if (type === 'transfer') {
    // erc20 transfer
    res = 
      `recipient: ${addr}\n\n` +
      `\t\tamount: ${amount}\n\n`
  } else if (type === 'approve') {
    // approve
    res = 
      `spender: ${addr}\n\n` +
      `amount: ${amount}\n\n`
  } else {
    // others
    res = ``
  }
  return res
}

export function BigNumberParser(input: any): Record<string, unknown> {
  if(input) {
    if (Array.isArray(input)) {
      (input as Array<unknown>).forEach((item, index) => {
        input[index] = BigNumberParser(item)
      })
    } else if (input._isBigNumber) {
      input = BigNumber.from(input)
    } else if (typeof input === 'object') {
      Object.keys(input).forEach(key => {
        input[key] = BigNumberParser(input[key])
      })
    }
  }
  return input
}