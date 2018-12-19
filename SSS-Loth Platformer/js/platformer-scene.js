import Player from "./player.js";

//класс уровня платформера (игровая сцена)
export default class PlatformerScene extends Phaser.Scene {
  preload() {
    this.load.image("player", "../assets/images/hero.png");
    this.load.image("spike", "../assets/images/lava.png");
    this.load.image("tiles", "../assets/tilesets/0x72-industrial-tileset-32px-extruded.png");
    this.load.tilemapTiledJSON("map", "../assets/tilemaps/platformer.json");
    this.load.image("sky", "../assets/images/sky.png");
    this.load.image("enemy", "../assets/images/enemy.png");
    this.load.image("coin", "../assets/images/coin.png");
  }

  create() {
    this.isPlayerDead = false;

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("0x72-industrial-tileset-32px-extruded", "tiles");
        
    //Задний план (изображение)
    this.add.image(400, 300, 'sky');

    this.coin = this.physics.add.sprite(300, 300, 'coin');

    map.createDynamicLayer("Background", tiles);
    this.groundLayer = map.createDynamicLayer("Ground", tiles);
    map.createDynamicLayer("Foreground", tiles);

    //Поместить игрока в позицию объекта "Spawn Point", созданного в карте.
    //Персонаж сохранён не как переменная, а как часть сцены
    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    //Установка столкновения/взаимодействия игрока и слоя уровня ("groundLayer") - берём sprite,
    //а не самого игрока, так как класс Игрока не является сам по себе спрайтом, то есть
    //не взаимодействует со слоем уровня
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.physics.world.addCollider(this.player.sprite, this.groundLayer);
    this.physics.world.addCollider(this.coin, this.groundLayer);

    //На карте расставлены шипы. Шип - это только маленькая часть тайла, поэтому, если назначить физику
    //столкновения на шипы, то игрок будет взаимодействовать с ними, находясь над шипами. Поэтому просто
    //заменим тайлы шипов на спрайт шипов/лавы, благодаря чему изменим их размер на подходящий для взаимодействия
    this.spikeGroup = this.physics.add.staticGroup();
    this.groundLayer.forEachTile(tile => {
      if (tile.index === 77) {
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), "spike");

        //На тайл карте расставлены шипы, развёрнутые в разные стороны, поэтому повернём спрайт нужной стороной
        //при расстановке новых спрайтов шипов/лавы
        spike.rotation = tile.rotation;
        if (spike.angle === 0) spike.body.setSize(32, 6).setOffset(0, 12);
        else if (spike.angle === -90) spike.body.setSize(6, 32).setOffset(12, 0);
        else if (spike.angle === 90) spike.body.setSize(6, 32).setOffset(12, 0);

        this.groundLayer.removeTileAt(tile.x, tile.y);
      }
    });

    this.enemy = this.physics.add.sprite(350, 490, "enemy");

    this.enemy.setVelocityX(200);

    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    let style = {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 10, y: 10 },
      backgroundColor: "#ffffff"
    };

    //Текстовое поле с управлением персонажем
    this.add.text(16, 16, "Нажимай стрелочки или WASD для того,\nчтобы двигаться и прыгать", style).setScrollFactor(0);

    //Сохранение счёта фруктов в переменной, которая будет доступна во всех методах класса
    this.fruit_score = 0;
    this.scoreText = this.add.text(16, 550, 'Fruit Score: ' + this.fruit_score, style).setScrollFactor(0);
  }

  update(time, delta) {
    
    if (this.isPlayerDead) return;

    //Управление персонажем и его перемещение/движение
    this.player.update();

    //Если игрок пересекается с фруктом, то вызывается функция столкновения
    if (this.physics.overlap(this.player.sprite, this.coin)) {
      this.hit();
    }

    if (
      this.player.sprite.y > this.groundLayer.height ||
      this.physics.world.overlap(this.player.sprite, this.spikeGroup) ||
      this.physics.world.overlap(this.player.sprite, this.enemy)
    ) {

      this.isPlayerDead = true;
      
      //Создание твина для изменения размеров игрока при соприкосновении с фруктом
      this.tweens.add( {
        //Применительно к игроку
        targets: this.player.sprite,
        //На протяжении 300 миллисекунд
        duration: 300,
        //Изменить масштаб вертикально на 50 процентов
        scaleX: 0.5,
        //Изменить масштаб горизонтально на 50 процентов
        scaleY: 0.5,
        //Вернуть игрока к начальному оригинальному масштабу
        yoyo: true,
      });

      this.player.sprite.setTint(0xff0000);

      const cam = this.cameras.main;
      cam.shake(100, 0.05);

      //"Заморозить" персонажа, чтобы он остался на экране, пока экран темнеет
      this.player.freeze();

      this.enemy.setVelocityX(0);

      this.physics.world.addCollider(this.enemy, this.groundLayer);

      
        this.add.text(275, 221, 'Game Over!\nPress SPACE to continue.\nYour Fruit Score is: ' + this.fruit_score, 
        {
          font: "18px monospace",
          fill: "#000000",
          padding: { x: 20, y: 20 },
          align: "center",
          backgroundColor: "#ffffff"
        }).setScrollFactor(0);

        document.addEventListener('keydown', (event) => {
          if (event.key === ' ') {
              cam.fade(550, 0, 0, 0);
              cam.once("camerafadeoutcomplete", () => {
                this.player.destroy();
                this.scene.restart();
              });
          }
        });
    }

    this.physics.world.collide(this.enemy, this.groundLayer, function(player, groundLayer) {
      //Противник касается стены справа
      if(this.enemy.body.blocked.right){
        //Разворот спрайта горизонтально
        this.enemy.setFlipX(true);
        this.enemy.setVelocityX(-200);
      }

      //Противник касается стены слева
      if(this.enemy.body.blocked.left){
          //Отменить разворот спрайта горизонтально
          this.enemy.setFlipX(false);
          this.enemy.setVelocityX(200);
      }
    }, null, this);
  }

  hit() {
    //Смена положения монетки по координатам 'x' и 'y' случайным образом
    this.coin.x = (this.player.sprite.x < 400) ? Phaser.Math.Between(300, 700) : Phaser.Math.Between(100, 500);
    this.coin.y = Phaser.Math.Between(100, 400);

    //Увеличить счётчик количества фруктов на 10
    this.fruit_score += 10;

    //Отобразить обновлённый счётчик количества фруктов на экране
    this.scoreText.setText('Fruit Score: ' + this.fruit_score);

    //Создание твина для изменения размеров игрока при соприкосновении с фруктом
    this.tweens.add( {
      //Применительно к игроку
      targets: this.player.sprite,
      //На протяжении 200 миллисекунд
      duration: 200,
      //Изменить масштаб вертикально на 20 процентов
      scaleX: 1.2,
      //Изменить масштаб горизонтально на 20 процентов
      scaleY: 1.2,
      //Вернуть игрока к начальному оригинальному масштабу
      yoyo: true,
    });
  }
}
