import { Field, Provable, PublicKey, SelfProof, UInt32, ZkProgram } from "o1js";
import { GameField } from "./GameField.js";

export const Controller = ZkProgram({
    name: "game-controller",
    publicInput: Field,
    publicOutput: GameField,

    methods: {
        startGame: {
            privateInputs: [PublicKey, GameField],
            
            method(publicInput: Field, player: PublicKey, gameField: GameField) {
                gameField.snake.checkInitialState();

                return gameField;
            }
        },
        
        move: {
            privateInputs: [SelfProof],
            
            method(publicInput: Field, earlierProof: SelfProof<Field, GameField>) {
                earlierProof.verify();
                const gameField = earlierProof.publicOutput;
                
                return gameField;
            }
        }
    }
});