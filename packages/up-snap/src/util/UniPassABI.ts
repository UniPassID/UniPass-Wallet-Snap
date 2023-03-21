export default [
  {
    inputs: [
      {
        internalType: 'uint32',
        name: '_ownerWeight',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: '_assetsOpWeight',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: '_guardianWeight',
        type: 'uint32',
      },
      {
        components: [
          {
            internalType: 'enum ModuleTransaction.CallType',
            name: 'callType',
            type: 'uint8',
          },
          {
            internalType: 'bool',
            name: 'revertOnError',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'target',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'gasLimit',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct ModuleTransaction.Transaction[]',
        name: '_txs',
        type: 'tuple[]',
      },
    ],
    name: 'selfExecute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]