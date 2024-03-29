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
    Proof,
    PublicKey,
} from 'o1js';
import {
    Controller
} from "./GameLogic/Controller.js"
import { GameField } from './GameLogic/GameField.js';
import readline from "readline";
import { DOWN, getCoordinates, LEFT, RIGHT, UP } from './GameLogic/types.js';

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

function draw(gameField: GameField) {
    const width = 15;
    const height = 15;

    const snake = gameField.snake;
    const food = gameField.food.coordinate;
    const snakeCoordinates = getCoordinates(snake);

    console.clear();

    console.log("#".repeat(width + 2));

    for (let y = 0; y < height; y++) {
        let row: string = "#";
        for (let x = 0; x < width; x++) {
            let cell: string = ' ';
            for (let i = 0; snake.length.greaterThan(UInt32.from(i)).toBoolean(); i++) {
                if (snakeCoordinates[i].x.equals(UInt32.from(x)).and(snakeCoordinates[i].y.equals(UInt32.from(y))).toBoolean()) {
                    cell = '*';
                }
            }
            if (food.x.equals(UInt32.from(x)).and(food.y.equals(UInt32.from(y))).toBoolean()) {
                cell = 'O';
            }
            row += cell;
        }
        row += "#";
        console.log(row);
    }

    console.log("#".repeat(width + 2));
}

const merkle = new MerkleMap();

const hashedPlayerAddress = Poseidon.hash(senderAccount.toFields());

merkle.set(hashedPlayerAddress, Field(0));

const initialRoot = merkle.getRoot();

const gameField = GameField.create(senderAccount, initialRoot);
console.log(gameField.player.toBase58());

let proof = await Controller.startGame(initialRoot, senderAccount, gameField, merkle.getWitness(hashedPlayerAddress));

async function proofTransaction(proof: Proof<Field, GameField>, sender: PublicKey, senderKey: PrivateKey) {
    const score = gameField.score;
    proof = await Controller.proofMove(initialRoot, proof, gameField, merkle.getWitness(hashedPlayerAddress));

    const txn = await Mina.transaction(sender, () => {
        zkAppInstance.update(proof, merkle.getWitness(Poseidon.hash(sender.toFields())), score);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
}

setInterval(async () => {
    try {
        gameField.snake.move(gameField.food);
    } catch (error) {
        await proofTransaction(proof, senderAccount, senderKey);
    }
    const didScoreIncrease = gameField.incrementScoreIfSnakeEatFood();

    if (didScoreIncrease.toBoolean()) {
        gameField.food.respawn();
    }

    draw(gameField);
}, 1000);

setInterval(async () => {
    proof = await Controller.proofMove(initialRoot, proof, gameField, merkle.getWitness(hashedPlayerAddress));
}, 10000)

console.log("girdi3");

readline.emitKeypressEvents(process.stdin);

process.stdin.on("keypress", (ch, key) => {
    if (key && key.name === "up") gameField.snake.changeDirection(UP);
    if (key && key.name === "down") gameField.snake.changeDirection(DOWN);
    if (key && key.name === "right") gameField.snake.changeDirection(RIGHT);
    if (key && key.name === "left") gameField.snake.changeDirection(LEFT);
    if (key && key.name === "c" && key.ctrl) process.exit();
})

process.stdin.setRawMode(true);
process.stdin.resume();
