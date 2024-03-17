import { PublicKey, Struct, UInt32 } from "o1js";
import { Snake } from "./Snake.js";

export const UP = UInt32.zero;
export const RIGHT = UInt32.one;
export const DOWN = UInt32.from(2);
export const LEFT = UInt32.from(3);

export class GameField extends Struct({
    player: PublicKey,
    score: UInt32,
    snake: Snake
}) {
    static create(player: PublicKey, snake: Snake) {
        snake.checkInitialState();

        const score = UInt32.zero;

        return new GameField({ player, score, snake });
    }
}