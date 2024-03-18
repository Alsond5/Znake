import { PublicKey, Struct, UInt32 } from "o1js";
import { Snake } from "./types.js";

export class GameField extends Struct({
    player: PublicKey,
    score: UInt32,
    snake: Snake
}) {
    static create(player: PublicKey) {
        const score = UInt32.zero;
        const snake = Snake.create();

        return new GameField({ player, score, snake });
    }
}