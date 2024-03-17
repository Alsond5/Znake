import { Field, Provable, PublicKey, SelfProof, UInt32, ZkProgram } from "o1js";
import { GameField, UP, RIGHT, DOWN, LEFT } from "./GameField.js";
import { Coordinate, Snake } from "./Snake.js";

export const Controller = ZkProgram({
    name: "game-controller",
    publicInput: Field,
    publicOutput: GameField,

    methods: {
        startGame: {
            privateInputs: [PublicKey],
            
            method(publicInput: Field, player: PublicKey) {
                const snake = Snake.create();
                const gameField = GameField.create(player, snake);

                return gameField;
            }
        },
        
        move: {
            privateInputs: [SelfProof],
            
            method(publicInput: Field, earlierProof: SelfProof<Field, GameField>) {
                earlierProof.verify();
                const gameField = earlierProof.publicOutput;
                const snake = gameField.snake;

                const direction = snake.direction;

                let x = snake.coordinates[0].x;
                let y = snake.coordinates[0].y;

                y = Provable.if(
                    direction.equals(UP),
                    y.sub(1),
                    y
                );

                y = Provable.if(
                    direction.equals(DOWN),
                    y.add(1),
                    y
                );

                x = Provable.if(
                    direction.equals(RIGHT),
                    x.add(1),
                    x
                );

                x = Provable.if(
                    direction.equals(LEFT),
                    x.sub(1),
                    x
                );

                snake.coordinates.unshift(Coordinate.create(x, y));
                
                return gameField;
            }
        }
    }
});