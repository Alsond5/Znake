import { Field, Provable, PublicKey, Struct, UInt32 } from "o1js";
import { Food, Snake } from "./types.js";

export class GameField extends Struct({
    player: PublicKey,
    score: Field,
    snake: Snake,
    food: Food
}) {
    static create(player: PublicKey) {
        const score = Field.empty();
        const snake = Snake.create();
        const food = Food.create();

        return new GameField({ player, score, snake, food });
    }
    
    incrementScoreIfSnakeEatFood() {
        const isFoodEaten = this.food.eaten.equals(true);
        this.score = this.score.add(isFoodEaten.toField());
        
        return isFoodEaten;
    }
}