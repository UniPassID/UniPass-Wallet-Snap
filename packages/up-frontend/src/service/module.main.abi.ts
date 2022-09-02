export const moduleMainAbi = {
  contractName: 'ModuleMain',
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_factory',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
        {
          internalType: 'bytes32',
          name: '_s',
          type: 'bytes32',
        },
      ],
      name: 'InvalidSValue',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
      ],
      name: 'InvalidSignatureLength',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'enum IModuleAuth.SigType',
          name: '',
          type: 'uint8',
        },
      ],
      name: 'InvalidSignatureType',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_v',
          type: 'uint256',
        },
      ],
      name: 'InvalidVValue',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256',
        },
      ],
      name: 'ReadAddressOutOfBounds',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256',
        },
      ],
      name: 'ReadBytes32OutOfBounds',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256',
        },
      ],
      name: 'ReadBytes66OutOfBounds',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_datam',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '_length',
          type: 'uint256',
        },
      ],
      name: 'ReadBytesOutOfBounds',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_data',
          type: 'bytes',
        },
      ],
      name: 'ReadFirstUint8OutOfBounds',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
      ],
      name: 'SignerIsAddress0',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_type',
          type: 'uint256',
        },
        {
          internalType: 'bool',
          name: '_recoverMode',
          type: 'bool',
        },
      ],
      name: 'UnsupportedSignatureType',
      type: 'error',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'enum ModuleCall.CallType',
              name: 'callType',
              type: 'uint8',
            },
            {
              internalType: 'uint256',
              name: 'gasLimit',
              type: 'uint256',
            },
            {
              internalType: 'address',
              name: 'target',
              type: 'address',
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
          internalType: 'struct ModuleCall.Transaction',
          name: '',
          type: 'tuple',
        },
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: '',
          type: 'bytes',
        },
      ],
      name: 'txFailed',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'newKeysetHash',
          type: 'bytes32',
        },
      ],
      name: 'KeysetHashUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      name: 'TxExecuted',
      type: 'event',
    },
    {
      inputs: [],
      name: 'FACTORY',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'INIT_CODE_HASH',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'delay',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'dkimKeys',
      outputs: [
        {
          internalType: 'contract IDkimKeys',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'bytes',
              name: 'emailHeader',
              type: 'bytes',
            },
            {
              internalType: 'bytes',
              name: 'dkimSig',
              type: 'bytes',
            },
            {
              internalType: 'uint256',
              name: 'fromIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'fromLeftIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'fromRightIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'subjectIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'subjectRightIndex',
              type: 'uint256',
            },
            {
              internalType: 'bool[]',
              name: 'isSubBase64',
              type: 'bool[]',
            },
            {
              internalType: 'bytes',
              name: 'subjectPadding',
              type: 'bytes',
            },
            {
              internalType: 'bytes[]',
              name: 'subject',
              type: 'bytes[]',
            },
            {
              internalType: 'uint256',
              name: 'dkimHeaderIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'selectorIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'selectorRightIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'sdidIndex',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'sdidRightIndex',
              type: 'uint256',
            },
          ],
          internalType: 'struct DkimParams',
          name: 'params',
          type: 'tuple',
        },
      ],
      name: 'dkimVerify',
      outputs: [
        {
          internalType: 'bool',
          name: 'ret',
          type: 'bool',
        },
        {
          internalType: 'bytes32',
          name: 'emailHash',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: 'sigHashHex',
          type: 'bytes',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'enum ModuleCall.CallType',
              name: 'callType',
              type: 'uint8',
            },
            {
              internalType: 'uint256',
              name: 'gasLimit',
              type: 'uint256',
            },
            {
              internalType: 'address',
              name: 'target',
              type: 'address',
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
          internalType: 'struct ModuleCall.Transaction[]',
          name: '_txs',
          type: 'tuple[]',
        },
        {
          internalType: 'uint256',
          name: '_nonce',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'feeToken',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'feeReceiver',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'feeAmount',
          type: 'uint256',
        },
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
      ],
      name: 'execute',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes',
          name: '_input',
          type: 'bytes',
        },
      ],
      name: 'executeAccountTx',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getKeysetHash',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'keysetHash',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getMetaNonce',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getNonce',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getPendingStatus',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'contract IDkimKeys',
          name: '_dkimKeys',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: '_keysetHash',
          type: 'bytes32',
        },
      ],
      name: 'init',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'isPending',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'enum IModuleAuth.SigType',
          name: '_sigType',
          type: 'uint8',
        },
        {
          internalType: 'bytes32',
          name: '_hash',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
        {
          internalType: 'uint256',
          name: '_index',
          type: 'uint256',
        },
      ],
      name: 'isValidSignature',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: '_keysetHash',
          type: 'bytes32',
        },
      ],
      name: 'lock',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'newKeysetHash',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: '_hash',
          type: 'bytes32',
        },
        {
          internalType: 'bytes',
          name: '_signature',
          type: 'bytes',
        },
      ],
      name: 'recoverySigner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [],
      name: 'timestamp',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      stateMutability: 'payable',
      type: 'receive',
    },
  ],
}
