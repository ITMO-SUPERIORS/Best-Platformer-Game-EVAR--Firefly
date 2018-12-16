import Player from "./player.js";

//класс уровня платформера (игровая сцена)
export default class PlatformerScene extends Phaser.Scene {
  preload() {
    this.load.spritesheet(
      "player", "../assets/images/hero.png",
      {
        frameWidth: 32,
        frameHeight: 32,
        margin: 1,
        spacing: 2
      }
    );
    this.load.image("spike", "../assets/images/lava.png");
    this.load.image("tiles", "../assets/tilesets/0x72-industrial-tileset-32px-extruded.png");
    this.load.tilemapTiledJSON("map", "../assets/tilemaps/platformer.json");
    this.load.image("sky", "assets/images/sky.png");
    this.load.image("fruit", "assets/images/fruit.png");
    this.load.image("enemy", "assets/images/enemy.png");
  }

  create() {
    this.isPlayerDead = false;

    const score = 0;

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("0x72-industrial-tileset-32px-extruded", "tiles");
        
    //Задний план (изображение)
    this.add.image(400, 300, 'sky');

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
        if (spike.angle === 0) spike.body.setSize(32, 6).setOffset(0, 26);
        else if (spike.angle === -90) spike.body.setSize(6, 32).setOffset(26, 0);
        else if (spike.angle === 90) spike.body.setSize(6, 32).setOffset(0, 0);

        this.groundLayer.removeTileAt(tile.x, tile.y);
      }
    });

    this.enemy = this.physics.add.sprite(350, 490, "enemy");

    this.physics.world.addCollider(this.enemy, this.groundLayer);

    this.enemy.setVelocityX(200);

    /* //картинка фрукта, используемая, как тайл
    const fruitTiles = map.addTilesetImage('fruit');
    //добавляем фрукты, как тайлы
    fruitLayer = map.createDynamicLayer('Fruits', fruitTiles, 0, 0);
    //индекс фрукта - 7
    fruitLayer.setTileIndexCallback(7, collectFruit, this);
    //когда игрок дотрагивается до фрукта, тайла с индексом 7, будет вызвана функция "collectFruit"
    this.physics.add.overlap(player, fruitLayer); */

    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    //Текстовое поле с управлением персонажем
    this.add
      .text(16, 16, "Нажимай стрелочки или WASD для того,\nчтобы двигаться и прыгать", {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);

      //Текстовое поле для отображения количества набранных очков/собранных фруктов
      let text_score = this.add
      .text(16, 550, "0", {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 10, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);
  }

  update(time, delta) {
    
    if (this.isPlayerDead) return;

    //Управление персонажем и его перемещение/движение
    this.player.update();

    if (
      this.player.sprite.y > this.groundLayer.height ||
      this.physics.world.overlap(this.player.sprite, this.spikeGroup) ||
      this.physics.world.overlap(this.player.sprite, this.enemy)
    ) {

      this.isPlayerDead = true;

      const cam = this.cameras.main;
      cam.shake(100, 0.05);
      cam.fade(250, 0, 0, 0);

      //"Заморозить" персонажа, чтобы он остался на экране, пока экран темнеет
      this.player.freeze();      

      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });
    }

    //Противник касается стены справа
    if(this.enemy.body.blocked.right){
      //Разворот спрайта горизонтально
      //this.enemy.setFlipX(true);
      this.enemy.setVelocityX(-200);
    }

    //Противник касается стены слева
    if(this.enemy.body.blocked.left){
        //Отменить разворот спрайта горизонтально
        //this.enemy.setFlipX(false);
        this.enemy.setVelocityX(200);
    }
  }

  /* function collectFruit(sprite, tile) {
    //убираем тайл собранного фрукта с карты
    fruitLayer.removeTileAt(tile.x, tile.y);
    //увеличивает счётчик
    score ++;
    //меняем текст счёта
    text_score.setText(score);
    return false;
  } */
}
