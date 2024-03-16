import { Bool, Field, Provable, Struct, UInt32 } from "o1js";

const GAME_WIDTH = 700;
const GAME_HEIGHT = 700;
const SPEED = 50;
const MAX_SNAKE_SIZE = GAME_WIDTH * GAME_HEIGHT;
const BODY_PARTS = 3;

export class Coordinate extends Struct({
    x: UInt32,
    y: UInt32
}) {
    static create(x: UInt32, y: UInt32) {
        return new Coordinate({ x, y });
    }
}

export class Snake extends Struct({
    direction: UInt32,
    length: UInt32,
    coordinates: Provable.Array(Coordinate, MAX_SNAKE_SIZE)
}) {
    static create() {
        return new Snake({
            direction: UInt32.from(1),
            length: UInt32.from(BODY_PARTS),
            coordinates: [...new Array(MAX_SNAKE_SIZE).map(
                () => {
                    return Coordinate.create(UInt32.from(0), UInt32.from(0));
                }
            )]
        });
    }

    checkInitialState() {
        this.direction.assertEquals(UInt32.from(1));
        this.length.assertEquals(UInt32.from(BODY_PARTS));

        for (let i = 0; i < MAX_SNAKE_SIZE; i++) {
            this.coordinates[i].x.assertEquals(UInt32.from(0));
            this.coordinates[i].y.assertEquals(UInt32.from(0));
        }
    }
}