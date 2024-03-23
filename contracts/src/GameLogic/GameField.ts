import { Field, Provable, PublicKey, Struct, UInt32 } from "o1js";
import { Food, Snake } from "./types.js";

export class GameField extends Struct({
    player: PublicKey,
    score: UInt32,
    snake: Snake,
    food: Food,
    root: Field
}) {
    static create(player: PublicKey, initialRoot: Field) {
        const score = UInt32.zero;
        const snake = Snake.create();
        const food = Food.create();

        return new GameField({ player, score, snake, food, root: initialRoot });
    }
    
    incrementScoreIfSnakeEatFood() {
        const isFoodEaten = this.food.eaten.equals(true);
        const foodEatenValue = isFoodEaten.toField().rangeCheckHelper(32);

        this.score = this.score.add(UInt32.from(foodEatenValue));
        
        return isFoodEaten;
    }
}