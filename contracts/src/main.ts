import { Znake } from './Znake.js';
import {
    Field,
    Mina,
    PrivateKey,
    AccountUpdate,
    UInt64,
    Signature,
    MerkleMap,
    Poseidon,
    Bool,
    UInt32,
    MerkleTree,
    CircuitString,
    Int64,
} from 'o1js';
import {
    Controller
} from "./GameLogic/Controller.js"

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
// create an instance of Square - and deploy it to zkAppAddress
const zkAppInstance = new Znake(zkAppAddress);

console.log("Deploying ZkCab to: " + zkAppAddress.toBase58());

const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

console.log("Initializing ZkCab");

const { verificationKey } = await Controller.compile();

let proof = await Controller.startGame(Field(100), senderAccount);

for (let index = 0; index < 3; index++) {
    proof = await Controller.move(Field(100), proof);
    console.log(proof.publicOutput.snake.coordinates[0].x.toString(), proof.publicOutput.snake.coordinates[0].y.toString());
}