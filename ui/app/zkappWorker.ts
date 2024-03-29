import { Field, MerkleMapWitness, Mina, Proof, PublicKey, Struct, UInt32, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Znake } from '../../contracts/src/Znake';
import { Snake } from '../../contracts/src/GameLogic/types';
import { GameField } from '../../contracts/src/GameLogic/GameField';

const state = {
  Znake: null as null | typeof Znake,
  zkapp: null as null | Znake,
  snake: null as null | Snake,
  gameField: null as null | GameField,
  transaction: null as null | Transaction
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://api.minascan.io/node/berkeley/v1/graphql'
    );
    console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: { player: PublicKey, initialRoot: Field }) => {
    const { Znake } = await import('../../contracts/build/src/Znake.js');
    
    state.Znake = Znake;
    state.snake = Snake.create();
    state.gameField = GameField.create(args.player, args.initialRoot);
  },
  compileContract: async (args: {}) => {
    await state.Znake!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Znake!(publicKey);
  },
  getScores: async (args: {}) => {
    const currentNum = await state.zkapp!.scores.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async (args: { proof: Proof<Field, GameField>, witness: MerkleMapWitness, score: UInt32 }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.update(args.proof, args.witness, args.score);
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  }
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== 'undefined') {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData
      };
      postMessage(message);
    }
  );
}

console.log('Web Worker Successfully Initialized.');