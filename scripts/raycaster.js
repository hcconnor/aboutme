var CIRCLE = Math.PI * 2;
var MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)

function Controls() {
    this.codes = { 37: 'left', 39: 'right', 38: 'forward', 40: 'backward', 32:'interact' };
    this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false, 'interact' : false};
    document.addEventListener('keydown', this.onKey.bind(this, true), { passive: false });
    document.addEventListener('keyup', this.onKey.bind(this, false), { passive: false });
    document.addEventListener('touchstart', this.onTouch.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onTouch.bind(this), { passive: false });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
}

Controls.prototype.onTouch = function (e) {
    var t = e.touches[0];

    this.onTouchEnd(e);
    e.preventDefault();
    e.stopPropagation();
    if (t.pageY < window.innerHeight * 0.7) this.onKey(true, { keyCode: 32 });
    else if (t.pageY < window.innerHeight * 0.8) this.onKey(true, { keyCode: 38 })
    else if (t.pageX < window.innerWidth * 0.5 && t.pageY < window.innerHeight * 0.9) this.onKey(true, { keyCode: 37 });
    else if (t.pageY > window.innerWidth * 0.5 && t.pageY < window.innerHeight * 0.9) this.onKey(true, { keyCode: 39 });
    else this.onKey(true, { keyCode: 40 });
};

Controls.prototype.onTouchEnd = function (e) {
    this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false };
    e.preventDefault();
    e.stopPropagation();
};

Controls.prototype.onKey = function (val, e) {
    var state = this.codes[e.keyCode];
    if (typeof state === 'undefined') return;
    this.states[state] = val;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
};

function Bitmap(src, width, height) {
    this.image = new Image();
    this.image.src = src;
    this.width = width;
    this.height = height;
}

function Player(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    //this.weapon = new Bitmap('./images/knife_hand.png', 319, 320);
    //this.paces = 0;
}

Player.prototype.rotate = function (angle) {
    this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
};

Player.prototype.walk = function (distance, map) {
    var dx = Math.cos(this.direction) * distance;
    var dy = Math.sin(this.direction) * distance;
    if (map.get(this.x + dx, this.y) <= 0) this.x += dx;
    if (map.get(this.x, this.y + dy) <= 0) this.y += dy;
    //this.paces += distance;
};

Player.prototype.update = function (controls, map, seconds) {
    if (controls.left) this.rotate(-Math.PI * seconds);
    if (controls.right) this.rotate(Math.PI * seconds);
    if (controls.forward) this.walk(3 * seconds, map);
    if (controls.backward) this.walk(-3 * seconds, map);
    //if (controls.interact) endDisplayHelp = true;
};

function Map(map) {
    //this.size = size;
    this.wallGrid = map
    
    //this.size = this.wallGrid.size;
    this.skybox = new Bitmap('./images/deathvalley_panorama.jpg', 2000, 750);
    this.wallTexture1 = new Bitmap('./images/wall_texture.jpg', 500, 1024);
    this.wallTexture2 = new Bitmap('./images/wall_texture2.jpg', 500, 1024);
    this.light = 0;
}

// Map.prototype.get = function (x, y) {
//     x = Math.floor(x);
//     y = Math.floor(y);
//     if (x < 0 || x > this.wallGrid[0].size - 1 || y < 0 || y > this.size - 1) return -1;
//     return this.wallGrid[y * this.size + x];
// };

Map.prototype.get = function (x, y) {
    var gameWidth = this.wallGrid[0].length;
    var gameHeight = this.wallGrid.length;
    var rx = Math.floor(x);
    var ry = Math.floor(y);
    if (rx < 0 || rx > gameWidth - 1 || ry < 0 || ry > gameHeight - 1) {
        return -1;
    }
    return this.wallGrid[ry][rx];
}

Map.prototype.randomize = function () {
    for (var i = 0; i < this.size * this.size; i++) {
        this.wallGrid[i] = Math.random() < 0.3 ? 1 : 0;
    }
};

Map.prototype.cast = function (point, angle, range) {
    var self = this;
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var noWall = { length2: Infinity };

    return ray({ x: point.x, y: point.y, height: 0, distance: 0 });

    function ray(origin) {
        var stepX = step(sin, cos, origin.x, origin.y);
        var stepY = step(cos, sin, origin.y, origin.x, true);
        var nextStep = stepX.length2 < stepY.length2
            ? inspect(stepX, 1, 0, origin.distance, stepX.y)
            : inspect(stepY, 0, 1, origin.distance, stepY.x);

        if (nextStep.distance > range) return [origin];
        return [origin].concat(ray(nextStep));
    }

    function step(rise, run, x, y, inverted) {
        if (run === 0) return noWall;
        var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
        var dy = dx * (rise / run);
        return {
            x: inverted ? y + dy : x + dx,
            y: inverted ? x + dx : y + dy,
            length2: dx * dx + dy * dy
        };
    }

    function inspect(step, shiftX, shiftY, distance, offset) {
        var dx = cos < 0 ? shiftX : 0;
        var dy = sin < 0 ? shiftY : 0;
        step.height = self.get(step.x - dx, step.y - dy);

        step.distance = distance + Math.sqrt(step.length2);
        if (shiftX) step.shading = cos < 0 ? 2 : 0;
        else step.shading = sin < 0 ? 2 : 1;
        step.offset = offset - Math.floor(offset);
        return step;
    }
};

Map.prototype.update = function (seconds) {
    //if (this.light > 0) 
    this.light = .5//Math.max(this.light - 10 * seconds, 0);
    
    //else if (Math.random() * 5 < seconds) this.light = 2;
};

function Camera(canvas, resolution, focalLength) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth * 0.5;
    this.height = canvas.height = window.innerHeight * 0.5;
    this.resolution = resolution;
    this.spacing = this.width / resolution;
    this.focalLength = focalLength || 0.8;
    this.range = MOBILE ? 14 : 14;
    this.lightRange = 10;
    this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.displayHelp = function (image)
{
    this.ctx.drawImage(image.image, this.canvas.width / 2 - image.image.width / 2, this.canvas.height / 2 - image.image.height / 2)
}
Camera.prototype.showMobileControls = function()
{
    console.log("showing Mobile Controls");
    
    this.ctx.drawImage(upButton.image, 0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * .1);
    // if (controls.forward) 
    //     {
    //         this.ctx.fillStyle(rgba(18, 82, 18, 0.26))
    //         this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * .1)
    //     }
    this.ctx.drawImage(leftButton.image, 0, this.canvas.height * 0.8, this.canvas.width *.5, this.canvas.height * .1);
    this.ctx.drawImage(rightButton.image, this.canvas.width * .5, this.canvas.height * 0.8, this.canvas.width * .5, this.canvas.height * .1);
    this.ctx.drawImage(downButton.image,0, this.canvas.height * 0.9, this.canvas.width, this.canvas.height * .1);
}

Camera.prototype.render = function (player, map) {
    this.drawSky(player.direction, map.skybox, map.light);
    this.drawColumns(player, map);
    //this.drawWeapon(player.weapon, player.paces);
};

Camera.prototype.drawSky = function (direction, sky, ambient) {
    var width = sky.width * (this.height / sky.height) * 2;
    var left = (direction / CIRCLE) * -width;

    this.ctx.save();
    this.ctx.drawImage(sky.image, left, 0, width, this.height);
    if (left < width - this.width) {
        this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
    }
    if (ambient > 0) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = ambient * 0.1;
        this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
    }
    this.ctx.restore();
};

Camera.prototype.drawColumns = function (player, map) {
    this.ctx.save();
    for (var column = 0; column < this.resolution; column++) {
        var x = column / this.resolution - 0.5;
        var angle = Math.atan2(x, this.focalLength);
        var ray = map.cast(player, player.direction + angle, this.range);
        this.drawColumn(column, ray, angle, map);
    }
    this.ctx.restore();
};

// Camera.prototype.drawWeapon = function (weapon, paces) {
//     var bobX = Math.cos(paces * 2) * this.scale * 6;
//     var bobY = Math.sin(paces * 4) * this.scale * 6;
//     var left = this.width * 0.66 + bobX;
//     var top = this.height * 0.6 + bobY;
//     this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
// };

Camera.prototype.drawColumn = function (column, ray, angle, map) {
    var ctx = this.ctx;
    var texture1 = map.wallTexture1;
    var texture2 = map.wallTexture2;
    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;

    while (++hit < ray.length && ray[hit].height <= 0);

    for (var s = ray.length - 1; s >= 0; s--) {
        var step = ray[s];
        // var rainDrops = Math.pow(Math.random(), 3) * s;
        // var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);

        if (s === hit) {
            var textureX = Math.floor(texture1.width * step.offset);
            var wall = this.project(step.height, angle, step.distance);

            ctx.globalAlpha = 1;
            
            if(wall.id == 1)
            {
                ctx.drawImage(texture1.image, textureX, 0, 1, texture1.height, left, wall.top, width, wall.height);
            }
            else if(wall.id == 2)
            {
                ctx.drawImage(texture2.image, textureX, 0, 1, texture2.height, left, wall.top, width, wall.height);
            }
            //console.log(s);
            if(column == this.resolution * 0.5 && wall.id == 2 && step.distance <= 1)
            {
                showInfo = true;
            }
            else if (column == this.resolution * 0.5 && (step.distance >= 1 || wall.id != 2))
            {
                showInfo = false;
            }
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
            ctx.fillRect(left, wall.top, width, wall.height);
        }

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.15;
        //while (--rainDrops > 0) ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
    }
};

Camera.prototype.project = function (id, angle, distance) {
    var z = distance * Math.cos(angle);
    var wallHeight = this.height * definedWallHeight / z;
    var id = id;
    var bottom = this.height / 2 * (1 + 1 / z);
    return {
        top: bottom - wallHeight,
        height: wallHeight,
        id: id
    };
};

function GameLoop() {
    this.frame = this.frame.bind(this);
    this.lastTime = 0;
    this.callback = function () { };
}

GameLoop.prototype.start = function (callback) {
    this.callback = callback;
    requestAnimationFrame(this.frame);
};

GameLoop.prototype.frame = function (time) {
    var seconds = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (seconds < 0.2) this.callback(seconds);
    requestAnimationFrame(this.frame);
};
document.getElementById('display').oncontextmenu = function (event) {
    event.preventDefault();
    event.stopPropagation(); // not necessary in my case, could leave in case stopImmediateProp isn't available? 
    event.stopImmediatePropagation();
    return false;
};
var startQuadrant = [6, 3];
var display = document.getElementById('display');
var welcomeImage = new Bitmap('./images/welcome placeholder.png', 100, 100);
var infoImage1 = new Bitmap('./images/welcome placeholder.png', 200, 200);
var upButton = new Bitmap('./images/Upbutton.png', 500, 100);
var leftButton = new Bitmap('./images/LeftButton.png', 100, 100);
var rightButton = new Bitmap('./images/RightButton.png', 100, 100);
var downButton = new Bitmap('./images/DownButton.png', 500, 100);
var player = new Player(startQuadrant[0] + 0.5, startQuadrant[1] + 0.5, Math.PI * 0.1);
var mapGrid1 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var map = new Map(mapGrid1);
var controls = new Controls();
var camera = new Camera(display, MOBILE ? 160 : 320, MOBILE ? 2 : .25);
var loop = new GameLoop();
var definedWallHeight = 1.25;
var endDisplayHelp = false;
var showInfo = false;

//map.randomize();


loop.start(function frame(seconds) {
    map.update(seconds);
    player.update(controls.states, map, seconds, camera);
    camera.render(player, map);
    //console.log(endDisplayHelp);
    //if (!endDisplayHelp) camera.displayHelp(welcomeImage);
    if (showInfo) camera.displayHelp(infoImage1);
    if (MOBILE) camera.showMobileControls();
});