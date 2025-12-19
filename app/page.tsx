"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = {}

export default function RacingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [lapCount, setLapCount] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const gameStateRef = useRef<GameState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const game = new Game(ctx, canvas.width, canvas.height)
    gameStateRef.current = game

    let animationId: number
    let lastTime = 0

    const gameLoop = (timestamp: number) => {
      if (lastTime === 0) lastTime = timestamp
      const deltaTime = (timestamp - lastTime) / 1000
      lastTime = timestamp

      if (isPlaying) {
        game.update(deltaTime)
        setCurrentTime(game.elapsedTime)
        setLapCount(game.lapCount)

        if (game.lapCount >= 5 && !isGameOver) {
          setIsGameOver(true)
          setIsPlaying(false)
          if (game.elapsedTime > 0 && (!bestTime || game.elapsedTime < bestTime)) {
            setBestTime(game.elapsedTime)
          }
        }
      }

      game.render()
      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    const handleKeyDown = (e: KeyboardEvent) => {
      game.handleKeyDown(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      game.handleKeyUp(e.key)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isPlaying, isGameOver, bestTime])

  const startGame = () => {
    if (gameStateRef.current) {
      gameStateRef.current.reset()
    }
    setCurrentTime(0)
    setLapCount(0)
    setIsGameOver(false)
    setIsPlaying(true)
  }

  const stopGame = () => {
    setIsPlaying(false)
    if (currentTime > 0 && (!bestTime || currentTime < bestTime)) {
      setBestTime(currentTime)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center space-y-2">
        <h1
          className="text-4xl md:text-6xl font-bold text-primary tracking-wider"
          style={{ fontFamily: "monospace", textShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}
        >
          TURBO RACER
        </h1>
        <p className="text-muted-foreground text-sm md:text-base font-mono">
          빠른 속도로 코너를 돌며 최고 기록을 경신하세요!
        </p>
      </div>

      <Card className="p-6 space-y-4 bg-card border-4 border-primary">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-foreground rounded-none bg-black max-w-full h-auto"
          style={{ imageRendering: "pixelated" }}
        />

        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center space-y-4 p-8 bg-primary border-4 border-accent-2">
              <h2
                className="text-5xl font-bold text-background font-mono"
                style={{ textShadow: "3px 3px 0px rgba(0,0,0,0.3)" }}
              >
                GAME CLEAR!
              </h2>
              <p className="text-2xl text-background font-mono">완주 시간: {currentTime.toFixed(2)}s</p>
              {bestTime && bestTime === currentTime && (
                <p className="text-xl text-accent-1 font-mono animate-pulse">NEW RECORD!</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1 border-2 border-primary p-2 bg-muted">
            <p className="text-xs text-foreground uppercase tracking-wide font-mono font-bold">시간</p>
            <p className="text-2xl font-bold text-accent-1 font-mono">{currentTime.toFixed(2)}s</p>
          </div>
          <div className="space-y-1 border-2 border-accent-2 p-2 bg-muted">
            <p className="text-xs text-foreground uppercase tracking-wide font-mono font-bold">랩</p>
            <p className="text-2xl font-bold text-accent-2 font-mono">{lapCount}/5</p>
          </div>
          <div className="space-y-1 border-2 border-primary p-2 bg-muted">
            <p className="text-xs text-foreground uppercase tracking-wide font-mono font-bold">최고</p>
            <p className="text-2xl font-bold text-accent-1 font-mono">{bestTime ? `${bestTime.toFixed(2)}s` : "--"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isPlaying ? (
            <Button
              onClick={startGame}
              className="flex-1 border-4 border-foreground rounded-none font-mono text-lg font-bold"
              size="lg"
              style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}
            >
              {isGameOver ? "다시 시작" : "시작하기"}
            </Button>
          ) : (
            <Button
              onClick={stopGame}
              variant="destructive"
              className="flex-1 border-4 border-foreground rounded-none font-mono text-lg font-bold"
              size="lg"
              style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}
            >
              정지
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 border-2 border-primary p-3 bg-muted/50">
          <p className="font-bold font-mono">조작 방법:</p>
          <p className="font-mono">방향키 또는 WASD로 차량 조작</p>
          <p className="font-mono">위/W: 가속 | 아래/S: 감속</p>
          <p className="font-mono">좌우/A/D: 회전</p>
        </div>
      </Card>
    </div>
  )
}

interface Vector2D {
  x: number
  y: number
}

class Car {
  position: Vector2D
  velocity: Vector2D
  angle: number
  speed: number
  maxSpeed: number
  acceleration: number
  friction: number
  turnSpeed: number
  width: number
  height: number
  color: string
  targetCheckpoint: number
  lapCount: number

  constructor(x: number, y: number, color: string) {
    this.position = { x, y }
    this.velocity = { x: 0, y: 0 }
    this.angle = 0
    this.speed = 0
    this.maxSpeed = 700
    this.acceleration = 400
    this.friction = 0.97
    this.turnSpeed = 4
    this.width = 20
    this.height = 30
    this.color = color
    this.targetCheckpoint = 0
    this.lapCount = 0
  }

  update(deltaTime: number, input: GameInput) {
    if (input.up) {
      this.speed += this.acceleration * deltaTime
    }
    if (input.down) {
      this.speed -= this.acceleration * deltaTime * 0.5
    }

    this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.speed))

    if (Math.abs(this.speed) > 10) {
      if (input.left) {
        this.angle -= this.turnSpeed * deltaTime
      }
      if (input.right) {
        this.angle += this.turnSpeed * deltaTime
      }
    }

    this.speed *= Math.pow(this.friction, deltaTime * 60)

    if (Math.abs(this.speed) < 1) {
      this.speed = 0
    }

    this.velocity.x = Math.sin(this.angle) * this.speed
    this.velocity.y = -Math.cos(this.angle) * this.speed

    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.angle)

    ctx.fillStyle = this.color
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width - 4, 6)

    ctx.fillStyle = "#1e293b"
    ctx.fillRect(-this.width / 2 + 2, this.height / 2 - 8, this.width - 4, 6)

    ctx.restore()
  }

  checkBoundaryCollision(width: number, height: number, trackSegments: TrackSegment[]) {
    for (const segment of trackSegments) {
      if (this.isCollidingWithSegment(segment)) {
        this.pushOutOfSegment(segment)
      }
    }
  }

  isCollidingWithSegment(segment: TrackSegment): boolean {
    return (
      this.position.x + this.width / 2 > segment.x &&
      this.position.x - this.width / 2 < segment.x + segment.width &&
      this.position.y + this.height / 2 > segment.y &&
      this.position.y - this.height / 2 < segment.y + segment.height
    )
  }

  pushOutOfSegment(segment: TrackSegment) {
    const carLeft = this.position.x - this.width / 2
    const carRight = this.position.x + this.width / 2
    const carTop = this.position.y - this.height / 2
    const carBottom = this.position.y + this.height / 2

    const segLeft = segment.x
    const segRight = segment.x + segment.width
    const segTop = segment.y
    const segBottom = segment.y + segment.height

    const overlapLeft = carRight - segLeft
    const overlapRight = segRight - carLeft
    const overlapTop = carBottom - segTop
    const overlapBottom = segBottom - carTop

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

    if (minOverlap === overlapLeft) this.position.x -= overlapLeft
    else if (minOverlap === overlapRight) this.position.x += overlapRight
    else if (minOverlap === overlapTop) this.position.y -= overlapTop
    else if (minOverlap === overlapBottom) this.position.y += overlapBottom
  }
}

interface GameInput {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

interface TrackSegment {
  x: number
  y: number
  width: number
  height: number
  type: "wall" | "checkpoint"
}

class Game {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  car: Car
  input: GameInput
  trackSegments: TrackSegment[]
  checkpoints: TrackSegment[]
  elapsedTime: number
  lapCount: number
  checkpointsPassed: Set<number>

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.elapsedTime = 0
    this.lapCount = 0
    this.checkpointsPassed = new Set()

    this.trackSegments = this.createTrackSegments()
    this.checkpoints = this.createCheckpoints()

    this.car = new Car(100, 300, "#ff0000")

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    }
  }

  createTrackSegments(): TrackSegment[] {
    const segments: TrackSegment[] = []
    const margin = 20

    segments.push({ x: margin, y: margin, width: this.width - margin * 2, height: 20, type: "wall" })
    segments.push({ x: margin, y: this.height - margin - 20, width: this.width - margin * 2, height: 20, type: "wall" })
    segments.push({ x: margin, y: margin, width: 20, height: this.height - margin * 2, type: "wall" })
    segments.push({ x: this.width - margin - 20, y: margin, width: 20, height: this.height - margin * 2, type: "wall" })

    segments.push({ x: 150, y: 50, width: 200, height: 100, type: "wall" })
    segments.push({ x: 450, y: 200, width: 200, height: 150, type: "wall" })
    segments.push({ x: 150, y: 450, width: 250, height: 100, type: "wall" })
    segments.push({ x: 250, y: 280, width: 80, height: 80, type: "wall" })

    return segments
  }

  createCheckpoints(): TrackSegment[] {
    return [
      { x: 80, y: 250, width: 40, height: 100, type: "checkpoint" },
      { x: 400, y: 150, width: 40, height: 80, type: "checkpoint" },
      { x: 600, y: 400, width: 80, height: 40, type: "checkpoint" },
      { x: 80, y: 200, width: 40, height: 40, type: "checkpoint" },
    ]
  }

  handleKeyDown(key: string) {
    switch (key.toLowerCase()) {
      case "arrowup":
      case "w":
        this.input.up = true
        break
      case "arrowdown":
      case "s":
        this.input.down = true
        break
      case "arrowleft":
      case "a":
        this.input.left = true
        break
      case "arrowright":
      case "d":
        this.input.right = true
        break
    }
  }

  handleKeyUp(key: string) {
    switch (key.toLowerCase()) {
      case "arrowup":
      case "w":
        this.input.up = false
        break
      case "arrowdown":
      case "s":
        this.input.down = false
        break
      case "arrowleft":
      case "a":
        this.input.left = false
        break
      case "arrowright":
      case "d":
        this.input.right = false
        break
    }
  }

  update(deltaTime: number) {
    this.car.update(deltaTime, this.input)
    this.car.checkBoundaryCollision(this.width, this.height, this.trackSegments)

    this.elapsedTime += deltaTime

    const targetCP = this.checkpoints[this.car.targetCheckpoint]
    if (this.car.isCollidingWithSegment(targetCP)) {
      if (!this.checkpointsPassed.has(this.car.targetCheckpoint)) {
        this.checkpointsPassed.add(this.car.targetCheckpoint)
        this.car.targetCheckpoint++

        if (this.car.targetCheckpoint >= this.checkpoints.length) {
          this.lapCount++
          this.car.lapCount++
          this.car.targetCheckpoint = 0
          this.checkpointsPassed.clear()
        }
      }
    }
  }

  render() {
    const ctx = this.ctx

    ctx.fillStyle = "#2d5016"
    ctx.fillRect(0, 0, this.width, this.height)

    this.renderTrack(ctx)

    this.car.render(ctx)

    this.renderSpeedometer(ctx)
  }

  renderTrack(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#6b7280"
    ctx.fillRect(40, 40, this.width - 80, this.height - 80)

    ctx.strokeStyle = "#fbbf24"
    ctx.lineWidth = 3
    ctx.setLineDash([20, 20])
    ctx.beginPath()
    ctx.moveTo(this.width / 2, 40)
    ctx.lineTo(this.width / 2, this.height - 40)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 4
    ctx.setLineDash([])
    ctx.strokeRect(50, 50, this.width - 100, this.height - 100)

    this.trackSegments.forEach((segment) => {
      ctx.fillStyle = "#78350f"
      ctx.fillRect(segment.x, segment.y, segment.width, segment.height)

      ctx.strokeStyle = "#451a03"
      ctx.lineWidth = 2

      for (let i = 0; i < segment.height; i += 15) {
        ctx.beginPath()
        ctx.moveTo(segment.x, segment.y + i)
        ctx.lineTo(segment.x + segment.width, segment.y + i)
        ctx.stroke()
      }

      for (let i = 0; i < segment.width; i += 30) {
        for (let j = 0; j < segment.height; j += 30) {
          ctx.beginPath()
          ctx.moveTo(segment.x + i, segment.y + j)
          ctx.lineTo(segment.x + i, segment.y + j + 15)
          ctx.stroke()
        }
      }
    })

    this.checkpoints.forEach((checkpoint, index) => {
      const isPassed = this.checkpointsPassed.has(index)
      const isTarget = this.car.targetCheckpoint === index

      if (isTarget) {
        ctx.fillStyle = "#fb923c"
      } else if (isPassed) {
        ctx.fillStyle = "#22c55e"
      } else {
        ctx.fillStyle = "#9ca3af"
      }

      ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height)

      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 3
      ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height)

      ctx.fillStyle = "#000000"
      ctx.font = "bold 20px monospace"
      ctx.fillText(`${index + 1}`, checkpoint.x + checkpoint.width / 2 - 7, checkpoint.y + checkpoint.height / 2 + 7)
    })

    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(60, 250 + i * 10, 10, 10)
      }
    }
    ctx.fillStyle = "#000000"
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 1) {
        ctx.fillRect(60, 250 + i * 10, 10, 10)
      }
    }
  }

  renderSpeedometer(ctx: CanvasRenderingContext2D) {
    const speedPercent = Math.abs(this.car.speed) / this.car.maxSpeed
    const barWidth = 200
    const barHeight = 25

    ctx.fillStyle = "#000000"
    ctx.fillRect(this.width - barWidth - 25, 15, barWidth + 10, barHeight + 10)

    ctx.fillStyle = "#1e293b"
    ctx.fillRect(this.width - barWidth - 20, 20, barWidth, barHeight)

    ctx.fillStyle = speedPercent > 0.8 ? "#ef4444" : "#3b82f6"
    ctx.fillRect(this.width - barWidth - 20, 20, barWidth * speedPercent, barHeight)

    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 3
    ctx.strokeRect(this.width - barWidth - 20, 20, barWidth, barHeight)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 14px monospace"
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3
    ctx.strokeText(`SPEED: ${Math.round(Math.abs(this.car.speed))}`, this.width - barWidth - 15, 12)
    ctx.fillText(`SPEED: ${Math.round(Math.abs(this.car.speed))}`, this.width - barWidth - 15, 12)
  }

  reset() {
    this.car = new Car(100, 300, "#ff0000")
    this.car.targetCheckpoint = 0
    this.car.lapCount = 0

    this.elapsedTime = 0
    this.lapCount = 0
    this.checkpointsPassed.clear()
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    }
  }
}
