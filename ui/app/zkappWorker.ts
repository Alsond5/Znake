import { Mina, PublicKey, Struct, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Znake } from '../../contracts/src/Znake';
import type { Snake } from '../../contracts/src/GameLogic/types';
import type { GameField } from '../../contracts/src/GameLogic/GameField';

const state = {
  Znake: null as null | typeof Znake,
  zkapp: null as null | Znake,
  snake: null as null | typeof Snake,
  gameField: null as null | typeof GameField,
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
  loadContract: async (args: {}) => {
    const { Znake } = await import('../../contracts/build/src/Znake.js');
    const { Snake } = await import('../../contracts/build/src/GameLogic/types.js');
    const { GameField } = await import('../../contracts/build/src/GameLogic/GameField.js');
    state.Znake = Znake;
    state.snake = Snake;
    state.gameField = GameField;
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
  getNum: async (args: {}) => {
    const currentNum = await state.zkapp!.num.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async (args: {}) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.update();
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