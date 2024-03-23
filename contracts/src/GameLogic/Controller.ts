import { Field, MerkleMapWitness, Poseidon, Provable, PublicKey, SelfProof, UInt32, ZkProgram } from "o1js";
import { GameField } from "./GameField.js";

export const Controller = ZkProgram({
    name: "game-controller",
    publicInput: Field,
    publicOutput: GameField,

    methods: {
        startGame: {
            privateInputs: [PublicKey, GameField, MerkleMapWitness],
            
            method(publicInput: Field, player: PublicKey, gameField: GameField, witness: MerkleMapWitness) {
                gameField.snake.checkInitialState();

                const hashedPlayerAddress = Poseidon.hash(player.toFields());

                const [root, key] = witness.computeRootAndKey(Field(0));
                root.assertEquals(gameField.root);
                hashedPlayerAddress.assertEquals(key);

                return gameField;
            }
        },
        
        proofMove: {
            privateInputs: [SelfProof, GameField, MerkleMapWitness],
            
            method(publicInput: Field, earlierProof: SelfProof<Field, GameField>, newGameField: GameField, witness: MerkleMapWitness) {
                earlierProof.verify();
                
                earlierProof.publicInput.assertEquals(publicInput);

                const gameField = earlierProof.publicOutput;

                gameField.player.assertEquals(newGameField.player);
                gameField.root.assertEquals(newGameField.root);
                
                const snake = gameField.snake;
                const newSnake = newGameField.snake;

                snake.length.assertEquals(gameField.score.add(3));
                newSnake.length.assertEquals(newGameField.score.add(3));

                const hashedPlayerAddress = Poseidon.hash(gameField.player.toFields());

                const [beforeRoot, key] = witness.computeRootAndKey(gameField.score.toFields()[0]);
                beforeRoot.assertEquals(gameField.root);
                hashedPlayerAddress.assertEquals(key);

                const gameOver = snake.checkGameOver();

                const newRoot = Provable.if(
                    gameOver.not(),
                    witness.computeRootAndKey(newGameField.score.toFields()[0])[0],
                    gameField.root
                );
                
                newGameField.root = newRoot;
                
                return newGameField;
            }
        }
    }
});