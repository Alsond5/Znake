import { Bool, Field, Provable, Struct, UInt32, assert, provable, provablePure } from "o1js";

const GAME_WIDTH = 15;
const GAME_HEIGHT = 15;
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
    moveDirection: UInt32,
    length: UInt32,
    plane: Field,
    direction: Field,
    headCoordinate: Coordinate,
    gameOver: Bool
}) {
    static create() {
        return new Snake({
            moveDirection: UInt32.one,
            length: UInt32.from(BODY_PARTS),
            plane: Field.empty(),
            direction: Field.empty(),
            headCoordinate: Coordinate.from(1, 1),
            gameOver: Bool(false)
        });
    }

    checkInitialState() {
        this.moveDirection.assertEquals(UInt32.from(1));
        this.length.assertEquals(UInt32.from(BODY_PARTS));
        this.plane.assertEquals(0);
        this.direction.assertEquals(0);
        this.gameOver.assertEquals(false);
    }

    move() {
        // plane: 0 => x, 1 => y    direction 0 => -, 1 => +

        assert(this.gameOver.equals(false), "Game is over!");

        const planeBits = this.plane.toBits(MAX_SNAKE_SIZE).reverse();
        const directionBits = this.direction.toBits(MAX_SNAKE_SIZE).reverse();

        let newPlaneBit = this.moveDirection.equals(UP).or(this.moveDirection.equals(DOWN));
        let newDirectionBit = this.moveDirection.equals(UP).or(this.moveDirection.equals(LEFT));
        
        for (let index = 0; index < MAX_SNAKE_SIZE; index++) {
            const oldPlaneBit = new Bool(planeBits[index]);
            const oldDirectionBit = new Bool(directionBits[index]);

            planeBits[index] = newPlaneBit.and(UInt32.from(index).lessThan(this.length.sub(1)));
            directionBits[index] = newDirectionBit.and(UInt32.from(index).lessThan(this.length.sub(1)));

            newPlaneBit = oldPlaneBit; 
            newDirectionBit = oldDirectionBit;
        }

        this.plane = Field.fromBits(planeBits.reverse());
        this.direction = Field.fromBits(directionBits.reverse());

        let initialX = this.headCoordinate.x;
        let initialY = this.headCoordinate.y;

        const isDirectionUp = UInt32.from(this.moveDirection.equals(UP).toField());
        const isDirectionDown = UInt32.from(this.moveDirection.equals(DOWN).toField());
        const isDirectionLeft = UInt32.from(this.moveDirection.equals(LEFT).toField());
        const isDirectionRight = UInt32.from(this.moveDirection.equals(RIGHT).toField());

        const addedY = UInt32.MAXINT().mul(isDirectionUp).addMod32(isDirectionDown);
        const addedX = UInt32.MAXINT().mul(isDirectionLeft).addMod32(isDirectionRight);

        initialY = initialY.addMod32(addedY);
        initialX = initialX.addMod32(addedX);

        this.headCoordinate = new Coordinate({
            x: initialX,
            y: initialY
        });
        
        this.checkGameOver();
    }

    changeDirection(newDirection: UInt32) {
        this.moveDirection = Provable.if(
            newDirection.equals(UP).and(this.moveDirection.equals(DOWN).not()),
            newDirection,
            this.moveDirection
        );

        this.moveDirection = Provable.if(
            newDirection.equals(DOWN).and(this.moveDirection.equals(UP).not()),
            newDirection,
            this.moveDirection
        );

        this.moveDirection = Provable.if(
            newDirection.equals(LEFT).and(this.moveDirection.equals(RIGHT).not()),
            newDirection,
            this.moveDirection
        );

        this.moveDirection = Provable.if(
            newDirection.equals(RIGHT).and(this.moveDirection.equals(LEFT).not()),
            newDirection,
            this.moveDirection
        );
    }

    grow() {
        this.length = this.length.add(1);
    }

    checkGameOver() {
        let head = this.headCoordinate;

        const outOfBounds = head.x.greaterThan(UInt32.from(GAME_WIDTH))
            .or(head.y.greaterThan(UInt32.from(GAME_HEIGHT)))

        Provable.log(outOfBounds)

        this.gameOver = outOfBounds.or(this.selfCollision());

        assert(this.gameOver.equals(false), "Game is over!");
    }

    selfCollision() {
        // check self collision

        return Bool(false);
    }
}

export function getCoordinates(snake: Snake) {
    let oldCoordinate = new Coordinate({
        x: snake.headCoordinate.x,
        y: snake.headCoordinate.y
    });

    const coordinates: Coordinate[] = [oldCoordinate];

    const planeBits = snake.plane.toBits(MAX_SNAKE_SIZE).reverse();
    const directionBits = snake.direction.toBits(MAX_SNAKE_SIZE).reverse();

    for (let i = 0; UInt32.from(i).lessThan(snake.length.sub(1)).toBoolean(); i++) {
        let x = oldCoordinate.x;
        let y = oldCoordinate.y;

        if (planeBits[i].toBoolean()) {
            y = (directionBits[i].toBoolean()) ? y.add(1) : y.sub(1);
        } else {
            x = (directionBits[i].toBoolean()) ? x.add(1) : x.sub(1);
        }

        oldCoordinate = new Coordinate({
            x: x,
            y: y
        });

        coordinates.push(oldCoordinate);
    }

    return coordinates;
}