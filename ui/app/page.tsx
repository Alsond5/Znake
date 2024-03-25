import SnakeGrid from "@/components/SnakeGrid";
import { useEffect, useState } from "react";

import './reactCOIServiceWorker';
import ZkappWorkerClient from './zkappWorkerClient';
import { PublicKey, Field } from 'o1js';

export default function Home() {
  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false
  });

  useEffect(() => {
    async function timeout(seconds: number): Promise<void> {
      return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
      });
    }

    (async () => {
      if (!state.hasBeenSetup) {
        console.log('Loading web worker...');
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);

        console.log('Done loading web worker');

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log(`Using key:${publicKey.toBase58()}`);

        console.log('Checking if fee payer account exists...');

        const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!
        });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();
      }
    })
  })

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1>Provable snake game with o1js</h1>
      <SnakeGrid
        width={15}
        height={15}
      />
    </main>
  );
}
