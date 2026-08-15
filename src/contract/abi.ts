export const echoPassAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'signer', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createEvent',
    inputs: [
      { name: 'eventId', type: 'bytes32' },
      { name: 'endsAt', type: 'uint64' },
      { name: 'reward', type: 'uint96' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'eventId', type: 'bytes32' },
      { name: 'validUntil', type: 'uint64' },
      { name: 'signalHash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasClaimed',
    inputs: [
      { name: 'eventId', type: 'bytes32' },
      { name: 'claimant', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PresenceClaimed',
    inputs: [
      { name: 'eventId', type: 'bytes32', indexed: true },
      { name: 'claimant', type: 'address', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
] as const
