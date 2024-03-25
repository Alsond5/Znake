import { Bool, Field, Provable, Struct, UInt32, assert, provable, provablePure } from "o1js";

export const GAME_WIDTH = 15;
export const GAME_HEIGHT = 15;
export const SPEED = 50;
export const MAX_SNAKE_SIZE = GAME_WIDTH * GAME_HEIGHT;
export const BODY_PARTS = 3;

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
            headCoordinate: Coordinate.from(2, 2),
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

    move(food: Food) {
        // plane: 0 => x, 1 => y    direction 0 => -, 1 => +

        assert(this.gameOver.equals(false), "Game is over!");

        const planeBits = this.plane.toBits(MAX_SNAKE_SIZE).reverse();
        const directionBits = this.direction.toBits(MAX_SNAKE_SIZE).reverse();

        let newPlaneBit = this.moveDirection.equals(UP).or(this.moveDirection.equals(DOWN));
        let newDirectionBit = this.moveDirection.equals(UP).or(this.moveDirection.equals(LEFT));

        const didSnakeEatFood = food.checkSnakeCollision(this).toField().rangeCheckHelper(32);
        this.length = this.length.add(UInt32.from(didSnakeEatFood));
        
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

        const outOfBounds = head.x.greaterThanOrEqual(UInt32.from(GAME_WIDTH))
            .or(head.y.greaterThanOrEqual(UInt32.from(GAME_HEIGHT)))

        this.gameOver = outOfBounds.or(this.selfCollision());

        return this.gameOver;
    }

    selfCollision() {
        // check self collision,

        const planeBits = this.plane.toBits(MAX_SNAKE_SIZE).reverse();
        const directionBits = this.direction.toBits(MAX_SNAKE_SIZE).reverse();

        const head = this.headCoordinate;

        let oldCoordinate = new Coordinate({
            x: this.headCoordinate.x,
            y: this.headCoordinate.y
        });
    
        let collision = Bool(false);

        for (let i = 0; i < MAX_SNAKE_SIZE; i++) {
            let x = oldCoordinate.x;
            let y = oldCoordinate.y;

            x = Provable.if(
                UInt32.from(i).lessThan(this.length.sub(1)),
                UInt32.from(planeBits[i].not().toField().rangeCheckHelper(32)).mul(UInt32.from(directionBits[i].toField().rangeCheckHelper(32)).mul(2).addMod32(UInt32.MAXINT())).addMod32(x),
                x
            );

            y = Provable.if(
                UInt32.from(i).lessThan(this.length.sub(1)),
                UInt32.from(planeBits[i].toField().rangeCheckHelper(32)).mul(UInt32.from(directionBits[i].toField().rangeCheckHelper(32)).mul(2).addMod32(UInt32.MAXINT())).addMod32(y),
                y
            );
    
            oldCoordinate = new Coordinate({
                x: x,
                y: y
            });

            collision = collision.or(oldCoordinate.equals(head));
        }

        return collision;
    }
}

export class Food extends Struct({
    coordinate: Coordinate,
    eaten: Bool
}) {
    static create() {
        let x = UInt32.from(Field.random().rangeCheckHelper(32));
        let y = UInt32.from(Field.random().rangeCheckHelper(32));

        return new Food({
            coordinate: new Coordinate({
                x: x.mod(GAME_WIDTH),
                y: y.mod(GAME_HEIGHT)
            }),
            eaten: Bool(false)
        });
    }

    checkInitialState() {
        this.eaten.assertEquals(false);
    }
    
    checkSnakeCollision(snake: Snake) {
        this.eaten = new Bool(snake.headCoordinate.equals(this.coordinate));

        return this.eaten;
    }

    respawn() {
        let x = UInt32.from(Field.random().rangeCheckHelper(32));
        let y = UInt32.from(Field.random().rangeCheckHelper(32));

        this.coordinate = new Coordinate({
            x: x.mod(GAME_WIDTH),
            y: y.mod(GAME_HEIGHT)
        });

        this.eaten = Bool(false);
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