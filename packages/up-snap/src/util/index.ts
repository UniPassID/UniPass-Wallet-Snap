
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