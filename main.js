import "./style.css";
import * as Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "app",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("sky", "images/sky.png");
  this.load.image("ground", "images/platform.png");
  this.load.image("goalP1", "images/goalP1.png");
  this.load.image("goalP2", "images/goalP2.png");
  this.load.image("ball", "images/ball.png");
  this.load.image("bomb", "images/bomb.png");
  this.load.spritesheet("dude", "images/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

let platforms;
let goalP1;
let goalP2;
let ball;
let player1;
let player2;
let bombs;
let score = { player1: 0, player2: 0 };
let scoreText;

function create() {
  this.add.image(400, 300, "sky");

  platforms = this.physics.add.staticGroup();
  goalP1 = this.physics.add.staticGroup();
  goalP2 = this.physics.add.staticGroup();

  // Adjusted ball physics for lighter feel
  ball = this.physics.add
    .sprite(380, 200, "ball")
    .setScale(0.5)
    .setBounce(0.6)
    .setDrag(20, 20) // Reduced air resistance (was 50)
    .setAngularDrag(10) // Reduced rotational resistance (was 20)
    .setMaxVelocity(500, 500); // Increased max velocity for smoother movement

  ball.body.mass = 0.3; // Made ball lighter (was 0.5)
  ball.setFriction(0.2); // Reduced base friction (was 0.5)

  const ground = platforms.create(400, 568, "ground").setScale(2).refreshBody();

  // Reduced ground friction
  ground.friction = 0.3; // Was 0.8

  goalP1.create(30, 491, "goalP1").setScale(0.3).refreshBody();
  goalP2.create(770, 491, "goalP2").setScale(0.3).refreshBody();

  player1 = this.physics.add
    .sprite(100, 450, "dude")
    .setBounce(0.2)
    .setCollideWorldBounds(true)
    .setDrag(1000, 0);

  player2 = this.physics.add
    .sprite(700, 450, "dude")
    .setBounce(0.2)
    .setCollideWorldBounds(true)
    .setDrag(1000, 0);

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 5 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  this.physics.add.collider(player1, platforms);
  this.physics.add.collider(player2, platforms);
  this.physics.add.collider(ball, platforms, handleBallPlatformCollision);
  this.physics.add.collider(ball, player1, handleBallPlayerCollision);
  this.physics.add.collider(ball, player2, handleBallPlayerCollision);

  this.physics.add.overlap(
    ball,
    goalP1,
    () => handleGoal("player2"),
    null,
    this
  );
  this.physics.add.overlap(
    ball,
    goalP2,
    () => handleGoal("player1"),
    null,
    this
  );

  scoreText = this.add.text(16, 16, updateScoreText(), {
    fontSize: "32px",
    fill: "#000",
  });
}

function handleBallPlatformCollision(ball, platform) {
  // Reduced friction effect
  const friction = platform.friction || 0.3;
  const currentVelocity = ball.body.velocity.x;
  ball.body.setVelocityX(currentVelocity * (1 - friction * 0.5)); // Reduced friction impact

  // Smaller bounce variation
  ball.body.setVelocityY(ball.body.velocity.y * (0.98 + Math.random() * 0.04));
}

function handleBallPlayerCollision(ball, player) {
  const relativeVelocity = Math.abs(
    player.body.velocity.x - ball.body.velocity.x
  );
  const kickStrength = Math.min(relativeVelocity + 150, 400);

  const kickDirection = player.x < ball.x ? 1 : -1;

  ball.body.setVelocityX(kickStrength * kickDirection);
  ball.body.setVelocityY(-100 - Math.random() * 50); // Reduced upward force

  // Reduced spin effect
  ball.body.setAngularVelocity(kickStrength * kickDirection * 0.5); // Added 0.5 multiplier to reduce spin
}

function handleGoal(scorer) {
  score[scorer]++;
  scoreText.setText(updateScoreText());

  ball.setPosition(400, 200);
  ball.setVelocity(0, 0);
  ball.setAngularVelocity(0);
}

function updateScoreText() {
  return `Player 1: ${score.player1} - Player 2: ${score.player2}`;
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();

  if (cursors.left.isDown) {
    player1.setVelocityX(-160);
    player1.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player1.setVelocityX(160);
    player1.anims.play("right", true);
  } else {
    player1.setVelocityX(0);
    player1.anims.play("turn");
  }

  if (cursors.up.isDown && player1.body.touching.down) {
    player1.setVelocityY(-330);
  }

  // Check ball's movement and rotation
  if (ball.body.touching.down) {
    const rollFriction = 0.99;
    ball.body.setVelocityX(ball.body.velocity.x * rollFriction);

    // Stop rotation if the ball is moving very slowly
    const speed = Math.abs(ball.body.velocity.x);
    if (speed < 5) {
      // If speed is less than 5 pixels per frame
      ball.body.setVelocityX(0); // Stop completely
      ball.body.setAngularVelocity(0); // Stop rotation
    }
  }
}
