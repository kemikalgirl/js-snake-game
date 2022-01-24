const Game = {}

Game.Config = function() {
    this.shouldDrawGrid = false

    this.gridColor = 'rgb(0, 0, 0)'
    this.appleColor = 'rgb(255,165,0)'
    this.snakeColor = 'rgb(0, 0, 0)'

    this.boardSize = 440

    this.tileCount = 11

    this.initialSnakeLength = 3

    this.updateInterval = 100
}

Game.State = function() {
    this.record = 0
}

Game.State.prototype.setDefault = function() {
    this.isGameOver = false
    this.isGamePaused = true
    
    this.canChangeDirection = true
    
    this.xVelocity = 0
    this.yVelocity = 1

    this.score = 0
}

Game.Point = function(x, y) {
    this.x = x
    this.y = y
}

Game.Point.prototype.collidesWith = function(array) {
    for (const point of array) {
        if (this.x === point.x && this.y === point.y) {
            return true
        }
    }
    return false
}

Game.Engine = function() {
    this.config = new Game.Config()
    this.state = new Game.State()

    this.wnd = window
    this.doc = document
    this.cvs = this.doc.getElementById('board')
    this.ctx = this.cvs.getContext('2d')

    this.restartButton = this.doc.getElementById('restart-button')
    this.score = this.doc.getElementById('score')
    this.record = this.doc.getElementById('record')

    this.cvs.width = this.config.boardSize
    this.cvs.height = this.config.boardSize

    this.tileSize = this.config.boardSize / this.config.tileCount

    this.doc.addEventListener('keydown', this.onKeyDown.bind(this))
    this.restartButton.addEventListener('click', this.restartGame.bind(this))

    this.initBorders()
    this.initGame()
}

Game.Engine.prototype.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Game.Engine.prototype.onKeyDown = function(event) {
    if (event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD') {
        this.state.isGamePaused = false
    }

    if (event.code === 'KeyR') {
        this.restartGame()
    }

    if (!this.state.canChangeDirection) {
        return;
    }

    switch (event.code) {
        case 'KeyW':
            if (this.state.yVelocity === 1) {
                return
            }
            this.state.yVelocity = -1
            this.state.xVelocity = 0
            this.state.canChangeDirection = false
            break
        case 'KeyS':
            if (this.state.yVelocity === -1) {
                return
            }
            this.state.yVelocity = 1
            this.state.xVelocity = 0
            this.state.canChangeDirection = false
            break
        case 'KeyA':
            if (this.state.xVelocity === 1) {
                return
            }
            this.state.yVelocity = 0
            this.state.xVelocity = -1
            this.state.canChangeDirection = false
            break
        case 'KeyD':
            if (this.state.xVelocity === -1) {
                return
            }
            this.state.yVelocity = 0
            this.state.xVelocity = 1
            this.state.canChangeDirection = false
            break
    }
}

Game.Engine.prototype.restartGame = function() {
    this.wnd.clearTimeout(this.state.updateTimeoutID)
    this.state.record = this.state.score > this.state.record ? this.state.score : this.state.record
    this.initGame()
}

Game.Engine.prototype.updateStatusBar = function() {
    this.score.innerText = this.state.score
    this.record.innerText = this.state.record
}

Game.Engine.prototype.drawGrid = function() {
    if (!this.config.shouldDrawGrid) {
        return
    }

    this.ctx.fillStyle = this.config.gridColor

    this.ctx.beginPath()

    for (let x = this.tileSize; x < this.cvs.width; x += this.tileSize) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.cvs.height);
    }

    for (let y = this.tileSize; y < this.cvs.height; y += this.tileSize) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.cvs.width, y);
    }

    this.ctx.stroke()
}

Game.Engine.prototype.drawApple = function() {
    this.ctx.fillStyle = this.config.appleColor
    this.ctx.fillRect(this.apple.x * this.tileSize + 2, this.apple.y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4)
}

Game.Engine.prototype.drawSnake = function() {
    this.ctx.fillStyle = this.config.snakeColor
    this.ctx.fillRect(this.snakeHead.x * this.tileSize + 2, this.snakeHead.y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4)
    for (let i = 0; i < this.snakeTail.length; i++) {
        this.ctx.fillRect(this.snakeTail[i].x * this.tileSize + 2, this.snakeTail[i].y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4)
    }
}

Game.Engine.prototype.drawFrame = function() {
    this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)

    this.drawGrid()
    this.drawApple()
    this.drawSnake()
}

Game.Engine.prototype.shiftSnake = function() {
    let lastLastSegmentPosition = new Game.Point(this.snakeTail[this.snakeTail.length - 1].x,  this.snakeTail[this.snakeTail.length - 1].y)

    for (let i = this.snakeTail.length - 1; i > 0; i--) {
        this.snakeTail[i].x = this.snakeTail[i - 1].x
        this.snakeTail[i].y = this.snakeTail[i - 1].y
    }

    this.snakeTail[0].x = this.snakeHead.x
    this.snakeTail[0].y = this.snakeHead.y

    this.snakeHead.x += this.state.xVelocity
    this.snakeHead.y += this.state.yVelocity

    this.state.occupiedCells = [...new Array(this.snakeHead), ...this.snakeTail, ...new Array(lastLastSegmentPosition)]

    if (this.snakeHead.collidesWith(this.snakeTail) || this.snakeHead.collidesWith(this.borders)) {
        this.state.isGameOver = true
    } 

    if (this.snakeHead.collidesWith(new Array(this.apple))) {
        this.state.score += 1;
        this.snakeTail.push(lastLastSegmentPosition)
        this.placeApple()
    } 

    this.state.canChangeDirection = true
}

Game.Engine.prototype.placeApple = function() {
    let pos = new Game.Point(this.getRandomInt(0, this.config.tileCount - 1), this.getRandomInt(0, this.config.tileCount - 1))
    
    if (pos.collidesWith(this.state.occupiedCells)) {
        return this.placeApple()
    }

    this.apple = pos
}

Game.Engine.prototype.update = function() {
    if (!this.state.isGamePaused) {
        this.shiftSnake()   
    }

    if (this.state.isGameOver) {
        return
    }

    this.updateStatusBar()
    this.drawFrame()

    this.state.updateTimeoutID = this.wnd.setTimeout(this.update.bind(this), this.config.updateInterval)
}

Game.Engine.prototype.initBorders = function() {
    let x, y

    this.borders = []

    x = -1
    for (y = 0; y <= this.config.tileCount; y++) {
        this.borders.push(new Game.Point(x, y))
    }
    y = -1
    for (x = 0; x <= this.config.tileCount; x++) {
        this.borders.push(new Game.Point(x, y))
    }
    x = this.config.tileCount
    for (y = 0; y <= this.config.tileCount; y++) {
        this.borders.push(new Game.Point(x, y))
    }
    y = this.config.tileCount
    for (x = 0; x <= this.config.tileCount; x++) {
        this.borders.push(new Game.Point(x, y))
    }
}

Game.Engine.prototype.initSnake = function() {
    this.snakeHead = new Game.Point(Math.ceil(this.config.tileCount / 2) - 1, 2)
    this.snakeTail = [new Game.Point(this.snakeHead.x, this.snakeHead.y - 1)]

    for (let i = 1; i < this.config.initialSnakeLength - 1; i++) {
        this.snakeTail.push(new Game.Point(this.snakeTail[i - 1].x, this.snakeTail[i - 1].y - 1))
    }

    this.state.occupiedCells = [...new Array(this.snakeHead), ...this.snakeTail]
}

Game.Engine.prototype.initGame = function() {
    this.state.setDefault()

    this.initSnake()
    this.placeApple()
    this.update()
}

const engine = new Game.Engine()