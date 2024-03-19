import { Bool, Field, Provable, Struct, UInt32, assert, provable, provablePure } from "o1js";

const GAME_WIDTH = 10;
const GAME_HEIGHT = 10;
const SPEED = 50;
const MAX_SNAKE_SIZE = GAME_WIDTH * GAME_HEIGHT;
const BODY_PARTS = 3;

export const UP = UInt32.zero;
export const RIGHT = UInt32.one;
export const DOWN = UInt32.from(2);
export const LEFT = UInt32.from(3);

export class Coordinate extends Struct({
    x: UInt32,
    y: UInt32
}) {
    static from(x: number, y: number) {
        return new Coordinate({
            x: UInt32.from(x),
            y: UInt32.from(y)
        });
    }

    equals(other: Coordinate) {
        return this.x.equals(other.x).and(this.y.equals(other.y));
    }
}

export class Snake extends Struct({
    direction: UInt32,
    length: UInt32,
    coordinates: Provable.Array(Coordinate, MAX_SNAKE_SIZE),
    gameOver: Bool
}) {
    static create() {
        return new Snake({
            direction: UInt32.one,
            length: UInt32.from(BODY_PARTS),
            coordinates: [...new Array(MAX_SNAKE_SIZE)].map(
                () => {
                    return Coordinate.from(1, 1);
                }
            ),
            gameOver: Bool(false)
        });
    }

    checkInitialState() {
        this.direction.assertEquals(UInt32.from(1));
        this.length.assertEquals(UInt32.from(BODY_PARTS));

        for (let i = 0; i < MAX_SNAKE_SIZE; i++) {
            this.coordinates[i].x.assertEquals(UInt32.one);
            this.coordinates[i].y.assertEquals(UInt32.one);
        }
    }

    move() {
        // Directions are represented as follows:
        // 0: Up, 1: Right, 2: Down, 3: Left

        assert(this.gameOver.equals(false), "Game is over");

        let initialX = this.coordinates[0].x;
        let initialY = this.coordinates[0].y;

        initialY = Provable.if(
            this.direction.equals(UP),
            initialY.sub(1),
            initialY
        );

        initialY = Provable.if(
            this.direction.equals(DOWN),
            initialY.add(1),
            initialY
        );

        initialX = Provable.if(
            this.direction.equals(LEFT),
            initialX.sub(1),
            initialX
        );

        initialX = Provable.if(
            this.direction.equals(RIGHT),
            initialX.add(1),
            initialX
        );

        let newCoordinate = new Coordinate({ x: initialX, y: initialY });
        
        // First, move the tail
        for (let i = 0; i < MAX_SNAKE_SIZE; i++) {
            const index = UInt32.from(i);
            const oldCoordinate = new Coordinate({
                x: this.coordinates[i].x,
                y: this.coordinates[i].y
            });

            this.coordinates[i].x = Provable.if(
                index.lessThan(this.length),
                newCoordinate.x,
                this.coordinates[i].x
            );

            this.coordinates[i].y = Provable.if(
                index.lessThan(this.length),
                newCoordinate.y,
                this.coordinates[i].y
            );

            newCoordinate.x = oldCoordinate.x;
            newCoordinate.y = oldCoordinate.y;
        }

        this.checkGameOver();
    }

    changeDirection(newDirection: UInt32) {
        this.direction = Provable.if(
            newDirection.equals(UP).and(this.direction.equals(DOWN).not()),
            newDirection,
            this.direction
        );

        this.direction = Provable.if(
            newDirection.equals(DOWN).and(this.direction.equals(UP).not()),
            newDirection,
            this.direction
        );

        this.direction = Provable.if(
            newDirection.equals(LEFT).and(this.direction.equals(RIGHT).not()),
            newDirection,
            this.direction
        );

        this.direction = Provable.if(
            newDirection.equals(RIGHT).and(this.direction.equals(LEFT).not()),
            newDirection,
            this.direction
        );
    }

    grow() {
        this.length = this.length.add(1);
    }

    checkGameOver() {
        let head = this.coordinates[0];

        const outOfBounds = head.x.greaterThanOrEqual(UInt32.from(GAME_WIDTH))
            .or(head.x.lessThanOrEqual(UInt32.zero))
            .or(head.y.greaterThanOrEqual(UInt32.from(GAME_HEIGHT)))
            .or(head.y.lessThanOrEqual(UInt32.zero));

        this.gameOver = outOfBounds.or(this.selfCollision());
    }

    selfCollision() {
        // check self collision

        return Bool(false);
    }
}