var game;

var gameOptions = {

    //гравитация
    playerGravity: 900,

    //скорость сползания игрока по стене
    playerGrip: 100,

    //скорость игрока
    playerSpeed: 250,

    //сила прыжка
    playerJump: 400,

    //сила второго воздушного прыжка
    playerDoubleJump: 300
}

//настройки игрового мира
window.onload = function() {
    var gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: 0x444444,
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 0 },
                //debug: false
            }
        },
       scene: [preloadGame, playGame]
    }
    game = new Phaser.Game(gameConfig);
}

var player;
var platforms;
var cursors;
var gameOver = false;
var map;

//предзагрузка всех игровых компонентов
class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        this.load.tilemapTiledJSON("level", "assets/level.json");
        this.load.image("tile", "assets/tile.png");
        this.load.image("hero", "assets/hero.png");
        this.load.image('sky', 'assets/sky.png');
    }
    create(){
        this.scene.start("PlayGame");
    }
}

//процесс игры
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }

    create(){
        //создание уровня из карты
        this.map = this.make.tilemap({
            key: "level"
        });
        
        //Задний план (изображение)
        this.add.image(400, 300, 'sky');

        //Добавление изображений самих тайлов к карте
        var tile = this.map.addTilesetImage("tileset01", "tile");

        //Установка коллизий для первого вида тайлов (земли и стен)
        this.map.setCollision(1);

        //Слой, который должен отображаться - "layer01"
        this.layer = this.map.createStaticLayer("layer01", tile);

        //Добавление спрайта персонажа и добавление ему физики
        /*player = */this.hero = this.physics.add.sprite(300, 376, "hero");
            
        //Установка скорости персонажа (заданной заранее)
        this.hero.body.velocity.x = gameOptions.playerSpeed;
        
        //Добавление персонажу возможность прыгать
        this.canJump = true;

        //Разрешаем персонажу совершать двойной прыжок в воздухе
        this.canDoubleJump = false;

        //Игрок не висит на стене
        this.onWall = false;

        //Ожидание нажатия клавиш игроком
        this.input.keyboard.on("keydown", this.handleJump, this);

        //Установка границ, чтобы камера следовала за игроком
        this.cameras.main.setBounds(0, 0, 1920, 1440);

        //Сказать камере следовать за игроком
        this.cameras.main.startFollow(this.hero);
    }

    //Настройки прыжка, реализация
    handleJump(){
        //Персонаж может прыгать, когда он на земле или на стене
        if((this.canJump && this.hero.body.blocked.down) || this.onWall){

            //Установка силы прыжка персонажа
            this.hero.body.velocity.y = -gameOptions.playerJump;

            //Если игрок на стене, то направление прыжка нужно изменить
            //в противоположную от стены сторону
            if(this.onWall){

                this.setPlayerXVelocity(true);
            }

            //После совершения прыжка игрок не должен прыгать
            this.canJump = false;

            //Игрок больше не на стене
            this.onWall = false;

            //Игрок может прыгнуть в воздухе
            this.canDoubleJump = true;
        }
        else{

            //Посмотреть, может ли игрок прыгнуть в воздухе
            if(this.canDoubleJump){

                //Игрок больше не должен прыгать в воздухе
                this.canDoubleJump = false;

                //Установить силу прыжка в воздухе
                this.hero.body.velocity.y = -gameOptions.playerDoubleJump;
            }
        }
    }

    update ()
    {
        //Установить стандартные настройки гравитации
        this.setDefaultValues();

        //Установка коллизий между персонажем и стенами (тайлами стен)
        this.physics.world.collide(this.hero, this.layer, function(hero, layer){

            //Временные переменные для коллизий, блокируется ли игрок снизу, слева или сверху
            var blockedDown = hero.body.blocked.down;
            var blockedLeft = hero.body.blocked.left
            var blockedRight = hero.body.blocked.right;

            //Если игрок дотронулся до чего либо, то нельзя прыгать второй раз в воздухе (игрок уже не в воздухе)
            this.canDoubleJump = false;

            //Герой на земле, следовательно он может прыгать
            if(blockedDown){

                this.canJump = true;
            }
            //Герой на земле и движется в левую сторону, значит нужно вернуть спрайт в стандартное положение и изменить его скорость
            if (blockedRight)
            {
                hero.flipX = true;
            }
            //Герой на земле и движется в правую сторону, значит нужно развернуть его спрайт и изменить его скорость
            if (blockedLeft)
            {
                hero.flipX = false;
            }
            //Игрок не дотрагивается до земли и дотрагивается до стены
            if((blockedRight || blockedLeft) && !blockedDown){

                //Повесить героя на стену
                hero.scene.onWall = true;

                //Отключить гравитацию
                hero.body.gravity.y = 0;

                //Установить новую скорость персонажа, чтобы он медленно сползал со стены
                hero.body.velocity.y = gameOptions.playerGrip;
            }

            
            //Изменение в соответствии с направлением его движения
            this.setPlayerXVelocity(!this.onWall || blockedDown);
            

        }, null, this)
    }

    //Стандартные значения, устанавливаемые в начале каждого цикла обновления, которые могут измениться в зависимости от функции коллизий
    setDefaultValues(){
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.onWall = false;
        this.setPlayerXVelocity(true);
    }

    
    //Установка скорости игрока, в соответствии с направлением его взгляда, пока не вызовется установка стандартного направления движения,
    //которое развернёт его, умножив скорость на -1
    setPlayerXVelocity(defaultDirection){
        this.hero.body.velocity.x = gameOptions.playerSpeed * (this.hero.flipX ? -1 : 1) * (defaultDirection ? 1 : -1);
    }
    
}