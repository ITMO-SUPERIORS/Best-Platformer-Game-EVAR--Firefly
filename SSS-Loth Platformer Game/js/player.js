//Класс для реализации логики движения персонажа. Создание, анимация и движение спрайта в соответствии
//с нажатыми клавишами: стрелками на клавиатуре или кнопками WASD. Вызов метода update игрока из метода update
//самой игровой сцены/уровня, и вызов метода destroy при завершении игры
export default class Player {
  constructor(scene, x, y) {
    // this.run_anim = scene.physics.add.sprite(x, y, "run_anim");
    
    this.scene = scene;
    const anims = scene.anims;

    anims.create({
      key: "run",
      frames: anims.generateFrameNumbers("run_anim", {start: 0, end: 29}),
      frameRate: 30,
      repeat: -1
    });
    anims.create({
      key: "idle",
      frames: anims.generateFrameNumbers("idle_anim", {start: 0, end: 29}),
      frameRate: 30,
      repeat: -1
    });

    //Создание спрайта с физикой, который будет двигаться и перемещаться в игре по сцене
    this.sprite = scene.physics.add
      .sprite(x, y, "player")
      .setDrag(1000, 0)
      .setMaxVelocity(300, 400)
      // .setSize(18, 24)
      // .setOffset(7, 9);
    //Отслеживание нажатия клавиш для управления игроком
    const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      w: W,
      a: A,
      d: D
    });
  }

  create() {
    this.doubleJump = false;
    this.onWall = false;
    this.canJump = true;
    this.canDoubleJump = false;
  }

  freeze() {
    this.sprite.body.moves = false;
  }

  update() {
    const { keys, sprite } = this;
    const onGround = sprite.body.blocked.down;
    const acceleration = onGround ? 600 : 200;

    //Применить горизонтальное увеличение скорости, при нажатии клавиш движения влево или вправо
    if (keys.left.isDown || keys.a.isDown) {
      sprite.setAccelerationX(-acceleration);

      //Не нужно рисовать разные спрайты для разного направления движений - можно просто развернуть спрайты
      //в левую или правцю стороны
      sprite.setFlipX(true);
      
    } else if (keys.right.isDown || keys.d.isDown) {
      sprite.setAccelerationX(acceleration);
      sprite.setFlipX(false);
      // run_anim.setFlipX(false);
    } else {
      sprite.setAccelerationX(0);
      // run_anim.setAccelerationX(0);

    }

    if (onGround) {
      if (sprite.body.velocity.x != 0) sprite.anims.play("run", true);
      else sprite.anims.play("idle", true);
      this.canJump = true;
    }
    else {
      sprite.anims.stop();
      if (sprite.body.velocity.y <= 0)
        sprite.setTexture("jump");
      else
        sprite.setTexture("run_anim", 26);
    }
    //Если игрок может прыгнуть в воздухе (совершить двойной прыжок) и кнопка прыжка 
    //не нажата (была отпущена), то игроку можно прыгнуть в воздухе
    if (this.doubleJump && keys.up.isUp) {
      this.canDoubleJump = true;
    }

    //Игрок может прыгать только если он стоит на земле
    if (onGround && this.canJump && (keys.up.isDown || keys.w.isDown)) {
      sprite.setVelocityY(-700);
      this.canJump = false;
      this.doubleJump = true;
    }
    else if (this.onWall && (keys.up.isDown || keys.w.isDown)) {
      sprite.setVelocityY(-700);
      if (sprite.body.blocked.left) {
        // sprite.setFlipX(false);
        sprite.setVelocityX(200);
      }
      else if (sprite.body.blocked.right) {
        // sprite.setFlipX(true);
        sprite.setVelocityX(-200);
      }
      this.doubleJump = true;
      this.onWall = false;
    }
    //Игрок может прыгать в воздухе только если он не стоит на земле и не висит на стене
    else if (this.doubleJump && this.canDoubleJump && (keys.up.isDown || keys.w.isDown)) {
      sprite.setVelocityY(-700);
      this.doubleJump = false;
      this.canDoubleJump = false;
    }
    //Если игрок касается стен, но не касается пола, значит он зацепился за стену
    if ((sprite.body.blocked.left || sprite.body.blocked.right) && !onGround && (sprite.body.velocity.y >= 0)) {
      sprite.body.gravity.y = 0;
      sprite.setVelocityY(100);
      this.onWall = true;
    }
    else {
      this.onWall = false;
      sprite.body.gravity.y = 10;
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
