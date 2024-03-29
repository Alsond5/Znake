"use client";
import React from "react";
import { getCoordinates } from "../../contracts/build/src/GameLogic/types.js";
import type { GameField } from "../../contracts/src/GameLogic/GameField";
import { UInt32 } from "o1js";

type Props = {
    width: number;
    height: number;
    gameField: GameField;
}

const SnakeGrid: React.FC<Props> = ({ width, height, gameField }) => {
    console.log(getCoordinates(gameField.snake));
    
    setInterval(() => {
        gameField.snake.move(gameField.food);

        const didScoreIncrease = gameField.incrementScoreIfSnakeEatFood();

        if (didScoreIncrease.toBoolean()) {
            gameField.food.respawn();
        }
    })

    return (
        <div className="grid grid-cols-15 grid-rows-15 border border-black mt-10">
            {Array.from({ length: height }).map((_, y) => (
                <div key={y} className="flex">
                    {Array.from({ length: width }).map((_, x) => (
                        <div key={x} className={`
                            border w-5 h-5 border-gray-300
                            ${getCoordinates(gameField.snake).some(segment => segment.x.equals(UInt32.from(x)).toBoolean() && segment.y.equals(UInt32.from(y)).toBoolean()) ? 'bg-green' : 'bg-white'}
                            ${gameField.food.coordinate.x.equals(UInt32.from(x)).toBoolean() && gameField.food.coordinate.y.equals(UInt32.from(y)).toBoolean() ? 'bg-red' : ''}
                        `}>

                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default SnakeGrid;