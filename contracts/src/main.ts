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

const gameField = GameField.create(senderAccount);
console.log(gameField.player.toBase58());

setInterval(() => {
    gameField.snake.move(gameField.food);
    const didScoreIncrease = gameField.incrementScoreIfSnakeEatFood();

    if (didScoreIncrease.toBoolean()) {
        gameField.food.respawn();
    }

    draw(gameField);
    console.log({ x: gameField.snake.headCoordinate.x.toString(), y: gameField.snake.headCoordinate.y.toString() })
    console.log({ x: gameField.food.coordinate.x.toString(), y: gameField.food.coordinate.y.toString() })
    console.log({ score: gameField.score.toString() })
    console.log({ length: gameField.snake.length.toString() })
}, 1000);

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
