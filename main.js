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
const GAME_DURATION = 30; // seconds

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
let timerText;
let timeLeft;
let gameTimer;
let isGameActive = true;
let restartButton;

function create() {
  this.add.image(400, 300, "sky");

  platforms = this.physics.add.staticGroup();
  goalP1 = this.physics.add.staticGroup();
  goalP2 = this.physics.add.staticGroup();

  ball = this.physics.add
    .sprite(380, 200, "ball")
    .setScale(0.5)
    .setBounce(0.6)
    .setDrag(20, 20)
    .setAngularDrag(10)
    .setMaxVelocity(500, 500);

  ball.body.mass = 0.3;
  ball.setFriction(0.2);

  const ground = platforms.create(400, 568, "ground").setScale(2).refreshBody();

  ground.friction = 0.3;

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

  // Animations
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

  // Colliders
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

  // Score and Timer Text
  scoreText = this.add.text(16, 16, updateScoreText(), {
    fontSize: "32px",
    fill: "#000",
  });

  timerText = this.add.text(600, 16, formatTime(GAME_DURATION), {
    fontSize: "32px",
    fill: "#000",
  });

  // Create Restart Button (hidden initially)
  restartButton = this.add
    .text(250, 300, "Restart Game", {
      fontSize: "32px",
      fill: "#fff",
      backgroundColor: "#000",
      padding: { x: 20, y: 10 },
    })
    .setInteractive()
    .on("pointerdown", () => restartGame.call(this))
    .setVisible(false);

  // Initialize timer
  startGame.call(this);
}

function startGame() {
  isGameActive = true;
  timeLeft = GAME_DURATION;
  score.player1 = 0;
  score.player2 = 0;
  scoreText.setText(updateScoreText());
  restartButton.setVisible(false);

  // Clear existing timer if it exists
  if (gameTimer) {
    gameTimer.destroy();
  }

  // Create new timer
  gameTimer = this.time.addEvent({
    delay: 1000,
    callback: updateTimer,
    callbackScope: this,
    loop: true,
  });

  // Reset positions
  resetPositions();
}

function resetPositions() {
  ball.setPosition(400, 200);
  ball.setVelocity(0, 0);
  ball.setAngularVelocity(0);
  player1.setPosition(100, 450);
  player2.setPosition(700, 450);
}

function restartGame() {
  startGame.call(this);
}

function updateTimer() {
  if (!isGameActive) return;

  timeLeft--;
  timerText.setText(formatTime(timeLeft));

  if (timeLeft <= 0) {
    endGame.call(this);
  }
}

function formatTime(seconds) {
  return `Time: ${seconds}s`;
}

function endGame() {
  isGameActive = false;
  gameTimer.destroy();
  restartButton.setVisible(true);

  // Show winner
  const winnerText =
    score.player1 > score.player2
      ? "Player 1 Wins!"
      : score.player2 > score.player1
      ? "Player 2 Wins!"
      : "It's a Draw!";

  this.add.text(220, 200, winnerText, {
    fontSize: "48px",
    fill: "#000",
  });
}

function handleBallPlatformCollision(ball, platform) {
  const friction = platform.friction || 0.3;
  const currentVelocity = ball.body.velocity.x;
  ball.body.setVelocityX(currentVelocity * (1 - friction * 0.5));
  ball.body.setVelocityY(ball.body.velocity.y * (0.98 + Math.random() * 0.04));
}

function handleBallPlayerCollision(ball, player) {
  const relativeVelocity = Math.abs(
    player.body.velocity.x - ball.body.velocity.x
  );
  const kickStrength = Math.min(relativeVelocity + 150, 400);
  const kickDirection = player.x < ball.x ? 1 : -1;

  ball.body.setVelocityX(kickStrength * kickDirection);
  ball.body.setVelocityY(-100 - Math.random() * 50);
  ball.body.setAngularVelocity(kickStrength * kickDirection * 0.5);
}

function handleGoal(scorer) {
  if (!isGameActive) return;

  score[scorer]++;
  scoreText.setText(updateScoreText());
  resetPositions();
}

function updateScoreText() {
  return `Player 1: ${score.player1} - Player 2: ${score.player2}`;
}

function updateAI() {
  if (!isGameActive) {
    player2.setVelocityX(0);
    player2.anims.play("turn");
    return;
  }

  // Basic AI behavior
  const distanceToBall = Math.abs(player2.x - ball.x);
  const ballIsOnAISide = ball.x > 400;
  const aiSpeed = 160;

  // AI Movement logic
  if (ballIsOnAISide) {
    // When ball is on AI's side
    if (distanceToBall > 50) {
      // Move towards ball
      if (player2.x > ball.x) {
        player2.setVelocityX(-aiSpeed);
        player2.anims.play("left", true);
      } else {
        player2.setVelocityX(aiSpeed);
        player2.anims.play("right", true);
      }
    } else {
      // Close to ball, try to kick it
      player2.setVelocityX(ball.x > player2.x ? aiSpeed : -aiSpeed);
    }
  } else {
    // When ball is on player's side, return to defensive position
    const defaultX = 600;
    if (Math.abs(player2.x - defaultX) > 50) {
      player2.setVelocityX(player2.x < defaultX ? aiSpeed : -aiSpeed);
      player2.anims.play(player2.x < defaultX ? "right" : "left", true);
    } else {
      player2.setVelocityX(0);
      player2.anims.play("turn");
    }
  }

  // Simple jump logic
  if (
    player2.body.touching.down &&
    ball.y < player2.y - 50 &&
    distanceToBall < 100
  ) {
    player2.setVelocityY(-330);
  }
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();

  // Player 1 controls (only if game is active)
  if (isGameActive) {
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
  } else {
    // Stop player movement when game is over
    player1.setVelocityX(0);
    player1.anims.play("turn");
  }

  // Update AI
  updateAI();

  // Ball physics
  if (ball.body.touching.down) {
    const rollFriction = 0.99;
    ball.body.setVelocityX(ball.body.velocity.x * rollFriction);

    const speed = Math.abs(ball.body.velocity.x);
    if (speed < 5) {
      ball.body.setVelocityX(0);
      ball.body.setAngularVelocity(0);
    }
  }
}
