
export function getFunctionText (type: string, addr: string, amount: string): string {
  let res
  if (type === 'transfer') {
    // erc20 transfer
    res = 
      `  recipient: ${addr}\n` +
      `  amount: ${amount}\n`
  } else if (type === 'approve') {
    // approve
    res = 
      `  spender: ${addr}\n` +
      `  amount: ${amount}\n`
  } else {
    // others
    res = 
      `  address spender: ${addr}\n` +
      `  uint256 value: ${amount}\n` + 
      `  type: ${type}\n`
  }
  return res
}