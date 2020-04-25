import "phaser";
import foodimg from "../assets/images/food.png";
import bodyimg from "../assets/images/body.png";

var config = {
  type: Phaser.CANVAS,
  width: 640,
  height: 480,
  backgroundColor: "#03fcf0",
  parent: "",
  scene: []
};

const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

class Snake extends Phaser.Scene {
  constructor() {
    super("game-scene");
    this.snake = undefined;
    this.food = undefined;
    this.cursors = undefined;
  }

  // var audioctx = new AudioContext();

  //  Direction consts

  preload() {
    this.load.image("food", new URL(foodimg, window.location.href).href);
    this.load.image("body", new URL(bodyimg, window.location.href).href);
  }

  create() {
    console.log("Creating Game");
    var Food = new Phaser.Class({
      Extends: Phaser.GameObjects.Image,

      initialize: function Food(scene, x, y) {
        Phaser.GameObjects.Image.call(this, scene);

        this.setTexture("food");
        this.setPosition(x * 16, y * 16);
        this.setOrigin(0);

        this.total = 0;

        this.eatEffect = {
          frequency: 523.25,
          attack: 0.05,
          decay: 0.2,
          type: "sine",
          volume: 3,
          pan: 0.8,
          pitchBend: 600,
          reverse: true,
          random: 100
        };

        scene.children.add(this);
      },

      eat: function() {
        this.total++;

        // new Phaser.Sound.Dynamic.FX(audioctx, this.eatEffect);
      }
    });

    var Snake = new Phaser.Class({
      initialize: function Snake(scene, x, y) {
        console.log("Initializing Game");
        this.headPosition = new Phaser.Geom.Point(x, y);

        this.body = scene.add.group();

        this.head = this.body.create(x * 16, y * 16, "body");
        this.head.setOrigin(0);

        this.alive = true;

        this.speed = 100;

        this.moveTime = 0;

        this.tail = new Phaser.Geom.Point(x, y);

        this.heading = RIGHT;
        this.direction = RIGHT;

        this.deathEffect = {
          frequency: 16,
          decay: 1,
          type: "sawtooth",
          dissonance: 50
        };
      },

      update: function(time) {
        if (time >= this.moveTime) {
          return this.move(time);
        }
      },

      faceLeft: function() {
        if (this.direction === UP || this.direction === DOWN) {
          this.heading = LEFT;
        }
      },

      faceRight: function() {
        if (this.direction === UP || this.direction === DOWN) {
          this.heading = RIGHT;
        }
      },

      faceUp: function() {
        if (this.direction === LEFT || this.direction === RIGHT) {
          this.heading = UP;
        }
      },

      faceDown: function() {
        if (this.direction === LEFT || this.direction === RIGHT) {
          this.heading = DOWN;
        }
      },

      move: function(time) {
        /**
         * Based on the heading property (which is the direction the pgroup pressed)
         * we update the headPosition value accordingly.
         *
         * The Math.wrap call allow the snake to wrap around the screen, so when
         * it goes off any of the sides it re-appears on the other.
         */
        switch (this.heading) {
          case LEFT:
            this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
            break;

          case RIGHT:
            this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
            break;

          case UP:
            this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
            break;

          case DOWN:
            this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
            break;
        }

        this.direction = this.heading;

        //  Update the body segments and place the last coordinate into this.tail
        Phaser.Actions.ShiftPosition(
          this.body.getChildren(),
          this.headPosition.x * 16,
          this.headPosition.y * 16,
          1,
          this.tail
        );

        //  Check to see if any of the body pieces have the same x/y as the head
        //  If they do, the head ran into the body

        var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);

        if (hitBody) {
          console.log("dead");

          //  Game Over
          // new Phaser.Sound.Dynamic.FX(audioctx, this.deathEffect);

          this.alive = false;

          return false;
        } else {
          //  Update the timer ready for the next movement
          this.moveTime = time + this.speed;

          return true;
        }
      },

      grow: function() {
        var newPart = this.body.create(this.tail.x, this.tail.y, "body");

        newPart.setOrigin(0);
      },

      collideWithFood: function(food) {
        if (this.head.x === food.x && this.head.y === food.y) {
          this.grow();

          food.eat();

          //  For every 5 items of food eaten we'll increase the snake speed a little
          if (this.speed > 20 && food.total % 5 === 0) {
            this.speed -= 5;
          }

          return true;
        } else {
          return false;
        }
      },

      updateGrid: function(grid) {
        //  Remove all body pieces from valid positions list
        this.body.children.each(function(segment) {
          var bx = segment.x / 16;
          var by = segment.y / 16;

          grid[by][bx] = false;
        });

        return grid;
      }
    });

    this.food = new Food(this, 3, 4);

    this.snake = new Snake(this, 8, 8);

    //  Create our keyboard controls
    //  TODO: Only listen to cursor keys when focused
    this.cursors = this.input.keyboard.createCursorKeys();
    parent = this.scene.systems.game.canvas.parentNode;
    document.getElementById(parent.id).childNodes[0].id = `game-canvas-${parent.id}`;
    document
      .getElementById(`canvas-display-${parent.id}`)
      .setAttribute("material", `src: #game-canvas-${parent.id}; shader: flat;`);
  }

  update(time, delta) {
    if (!this.snake.alive) {
      return;
    }

    /**
     * Check which key is pressed, and then change the direction the snake
     * is heading based on that. The checks ensure you don't double-back
     * on yourself, for example if you're moving to the right and you press
     * the LEFT cursor, it ignores it, because the only valid directions you
     * can move in at that time is up and down.
     */
    if (this.cursors.left.isDown) {
      this.snake.faceLeft();
    } else if (this.cursors.right.isDown) {
      this.snake.faceRight();
    } else if (this.cursors.up.isDown) {
      this.snake.faceUp();
    } else if (this.cursors.down.isDown) {
      this.snake.faceDown();
    }

    if (this.snake.update(time)) {
      //  If the snake updated, we need to check for collision against food

      if (this.snake.collideWithFood(this.food)) {
        this.repositionFood();
      }
    }
  }

  /**
   * We can place the food anywhere in our 40x30 grid
   * *except* on-top of the snake, so we need
   * to filter those out of the possible food locations.
   * If there aren't any locations left, they've won!
   *
   * @method repositionFood
   * @return {boolean} true if the food was placed, otherwise false
   */
  repositionFood() {
    //  First create an array that assumes all positions
    //  are valid for the new piece of food

    //  A Grid we'll use to reposition the food each time it's eaten
    var testGrid = [];

    for (var y = 0; y < 30; y++) {
      testGrid[y] = [];

      for (var x = 0; x < 40; x++) {
        testGrid[y][x] = true;
      }
    }

    this.snake.updateGrid(testGrid);

    //  Purge out false positions
    var validLocations = [];

    for (var y = 0; y < 30; y++) {
      for (var x = 0; x < 40; x++) {
        if (testGrid[y][x] === true) {
          //  Is this position valid for food? If so, add it here ...
          validLocations.push({ x: x, y: y });
        }
      }
    }

    if (validLocations.length > 0) {
      //  Use the RNG to pick a random food position
      var pos = Phaser.Math.RND.pick(validLocations);

      //  And place it
      this.food.setPosition(pos.x * 16, pos.y * 16);

      return true;
    } else {
      return false;
    }
  }
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

AFRAME.registerComponent("start-game", {
  multiple: true,
  init() {
    this.gameId = uuidv4();
    this.gameArea = document.createElement("div");
    this.gameArea.id = `gameArea-${this.gameId}`;

    // TODO: Create this plane or use the model's "screen" so different type of models will work
    this.plane = document.createElement("a-plane");
    this.plane.id = `canvas-display-${this.gameArea.id}`;
    this.plane.setAttribute("width", "1.8");
    this.plane.setAttribute("height", "1.2");
    this.plane.setAttribute("position", "0 2.8 -0.220");

    this.el.appendChild(this.gameArea);
    this.el.appendChild(this.plane);

    this.gameConfig = config;
    this.gameConfig.parent = this.gameArea.id;
    this.gameConfig.scene = [Snake];
    console.log("Game Inited");
    this.game = new Phaser.Game(this.gameConfig);
    // TODO:  Restart game
    this.onClick = () => {
      if (!this.game) {
      } else {
        console.log("Game Already Started .... Restarting");
        this.game.scene.scenes[0].restart();
      }
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  },
  tick() {
    for (const child of this.el.getChildren()) {
      if (child.id.includes("canvas-display")) {
        var material;
        material = child.getObject3D("mesh");
        if (material) {
          if (!material.material.map) {
            return;
          }
          material.material.map.needsUpdate = true;
        }
      }
    }
  }
});
