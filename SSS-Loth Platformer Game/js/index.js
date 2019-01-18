
import Player from "./player.js";

var MainMenu = new Phaser.Class ({
  Extends: Phaser.Scene,

  initialize:

  function MainMenu () {
    Phaser.Scene.call(this, { key: 'MainMenu'});
  },
  
  preload: function() {
    this.load.image("Menu", "./assets/images/MainMenu.png");
  },

  create: function() {
    this.add.sprite(400, 300, 'Menu');
    
    let style = {
      font: "18px monospace",
      fill: "#000000",
      align: "center",
      padding: { x: 10, y: 10 },
      backgroundColor: "#ffffff"
    };

    //Текстовое поле с управлением персонажем
    // this.add.text(121, 181, "ГЛАВНОЕ МЕНЮ\nУПРАВЛЕНИЕ СТРЕЛКАМИ И/ИЛИ КНОПКАМИ WASD НА КЛАВИАТУРЕ\nЧТОБЫ НАЧАТЬ ИГРУ, НАЖМИТЕ КЛАВИШУ S-START", style).setScrollFactor(0);

    this.input.keyboard.on('keydown_S', function (event) {
      console.log('From MainMenu to PlatformerScene');
      this.scene.start('PlatformerScene');
    }, this);
  }
});

//класс уровня платформера (игровая сцена)
var PlatformerScene = new Phaser.Class ({
  Extends: Phaser.Scene,

  initialize:

  function PlatformerScene () {
    Phaser.Scene.call(this, { key: 'PlatformerScene'});
  },

  preload: function() {
    this.load.image("coin", "./assets/images/fruit.png");
    this.load.image("player", "./assets/images/sprite.png");
    this.load.image("spike", "./assets/images/pike.png");
    this.load.image("wave", "./assets/images/wave.png");
    this.load.image("wave1", "./assets/images/wave1.png");
    this.load.image("tiles", "./assets/tilesets/TileSet-01.png");
    this.load.tilemapTiledJSON("map", "./assets/tilemaps/Platformer_2.json");
    this.load.image("sky", "./assets/images/Background.png");
    this.load.image("enemy", "./assets/images/enemy.png");
    this.load.spritesheet("run_anim", "./assets/images/sloth_run_2.png", {frameWidth: 99, frameHeight: 105, spacing: 2});
    this.load.spritesheet("idle_anim", "./assets/images/sloth_idle_2.png", {frameWidth: 99, frameHeight: 105, spacing: 2});
    this.load.image("jump", "./assets/images/sloth_jump.png");
    this.load.text("leaderboard", "./assets/leaderboard");
  },

  create: function() {
    this.isPlayerDead = false;

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("TileSet-01", "tiles");
    this.paralax = this.add.image(1000, 500, 'sky');
    //Задний план (изображение)
    // this.add.image(1000, 500, 'sky');
    // bg.height = this.height;
    // bg.width = this.width;
    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

    map.createDynamicLayer("Back", tiles);
    map.createDynamicLayer("Front", tiles);

    this.coin = this.physics.add.sprite(
      Phaser.Math.Between(spawnPoint.x - 450, spawnPoint.x + 450), 
      Phaser.Math.Between(spawnPoint.y - 256, spawnPoint.y + 256), 'coin'
    );

    this.groundLayer = map.createDynamicLayer("Solid", tiles);
    //this.obstacleLayer = map.createDynamicLayer("Obstacles", tiles);
    
    
    


    //Поместить игрока в позицию объекта "Spawn Point", созданного в карте.
    //Персонаж сохранён не как переменная, а как часть сцены
    
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);
    // this.player = new Player(this, 200, 400);

    
    
    //Установка столкновения/взаимодействия игрока и слоя уровня ("groundLayer") - берём sprite,
    //а не самого игрока, так как класс Игрока не является сам по себе спрайтом, то есть
    //не взаимодействует со слоем уровня
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.physics.world.addCollider(this.player.sprite, this.groundLayer);
    this.physics.world.addCollider(this.coin, this.groundLayer);
    

    //this.obstacleLayer.setCollisionByProperty({ collides: true });
    //this.physics.world.addCollider(this.player.sprite, this.obstacleLayer);

    //this.spikes = this.physics.add.staticGroup();
    
    /* this.obstacleLayer.forEachTile(tile => {
      if (tile.index === 377 || tile.index === 247 || tile.index === 248){
        this.spikes.create(tile);
      }
    }) */
    
    //На карте расставлены шипы. Шип - это только маленькая часть тайла, поэтому, если назначить физику
    //столкновения на шипы, то игрок будет взаимодействовать с ними, находясь над шипами. Поэтому просто
    //заменим тайлы шипов на спрайт шипов/лавы, благодаря чему изменим их размер на подходящий для взаимодействия
    // var spikeTiles = []
    this.spikeGroup = this.physics.add.staticGroup();
      this.groundLayer.forEachTile(tile => {
      if (tile.index === 378) {
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), "spike");

         //На тайл карте расставлены шипы, развёрнутые в разные стороны, поэтому повернём спрайт нужной стороной
         //при расстановке новых спрайтов шипов/лавы
         spike.rotation = tile.rotation;
         if (spike.angle === 0) spike.body.setSize(32, 6).setOffset(0, 12);
         else if (spike.angle === -90) spike.body.setSize(6, 32).setOffset(12, 0);
         else if (spike.angle === 90) spike.body.setSize(6, 32).setOffset(12, 0);

         this.groundLayer.removeTileAt(tile.x, tile.y);
      }

      if (tile.index === 248) {
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), "wave");
         this.groundLayer.removeTileAt(tile.x, tile.y);
      }

      if (tile.index === 249) {
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), "wave1");
         this.groundLayer.removeTileAt(tile.x, tile.y);
      }
    });

    this.enemy = this.physics.add.sprite(500, 490, "enemy");

    this.enemy.setVelocityX(200);

    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.zoom = 0.8;

    // this.arr = this.cache.getText("leaderboard");

    


    let style = {
      font: "24px monospace",
      fill: "#000000",
      padding: { x: 10, y: 10 },
      backgroundColor: "#ffffff"
    };
    
    //Текстовое поле с управлением персонажем
    //this.add.text(16, 16, "Нажимай стрелочки или WASD для того,\nчтобы двигаться и прыгать", style).setScrollFactor(0);

    //Сохранение счёта фруктов в переменной, которая будет доступна во всех методах класса
    this.fruit_score = 0;
    this.scoreText = this.add.text(16, 550, 'Fruit Score: ' + this.fruit_score, style).setScrollFactor(0);
  },

  update: function(time, delta) {
    
    if (this.isPlayerDead) return;

    //Управление персонажем и его перемещение/движение
    this.player.update();

    //Если игрок пересекается с фруктом, то вызывается функция столкновения
    if (this.physics.overlap(this.player.sprite, this.coin)) {
      this.hit();
    }

    // Если фрукт падает на шипы, то он уничтожается и появляется новый
    if (this.physics.overlap(this.coin, this.spikeGroup ) || this.coin.y > this.groundLayer.height) {
      this.matchCoin();
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

      
        this.add.text(275, 221, 'Fruit Score: ' + this.fruit_score, 
        {
          font: "24px monospace",
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
  },

  
  matchCoin: function() {
    //Смена положения монетки по координатам 'x' и 'y' случайным образом
    this.playerPosX = this.player.sprite.x;
    var itemsX = Array(Phaser.Math.Between(this.playerPosX + 200, this.playerPosX + 450), Phaser.Math.Between(this.playerPosX - 200, this.playerPosX - 450));
    this.coin.x = itemsX[Math.floor(Math.random()*itemsX.length)];
    
    this.playerPosY = this.player.sprite.y;
    var itemsY = Array(Phaser.Math.Between(this.playerPosY + 128, this.playerPosY + 256), Phaser.Math.Between(this.playerPosY - 128, this.playerPosY - 256));
    this.coin.y = itemsY[Math.floor(Math.random()*itemsY.length)];

    this.coin.setVelocityY(0);

    // this.playerPosY = this.player.sprite.y;
    // this.coin.x = Phaser.Math.Between(this.playerPosX + 64, this.playerPosX + 250) || Phaser.Math.Between(this.playerPosX - 64, this.playerPosX - 250);
    // this.coin.y = Phaser.Math.Between(100, 400);
  },

  hit: function() {
    
    this.matchCoin();

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
});


const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  
  //pixelArt: false,
  backgroundColor: "#1d212d",
  scene: [ MainMenu, PlatformerScene ],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 }
    }
  }
};

const game = new Phaser.Game(config);
