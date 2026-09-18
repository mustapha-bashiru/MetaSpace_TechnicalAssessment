import * as Phaser from 'phaser'
import { BTN_GREY, CONNECT_SCENE, UPHEAVAL } from "../utils/keys"

export class StartScene extends Phaser.Scene {
    button?: Phaser.GameObjects.RenderTexture
    text?: Phaser.GameObjects.BitmapText
    statusText?: Phaser.GameObjects.BitmapText
    container?: Phaser.GameObjects.Container

    constructor() {
        super({
            key: 'start-scene'
        })
    }

    preload() {
        this.load.bitmapFont(UPHEAVAL, '/fonts/upheaval.png', '/fonts/upheaval.xml')
        this.load.image(BTN_GREY, '/ui/btn-grey.png')
    }

    create() {
        console.log('[Scene] StartScene created')

        // Remove DOM loading overlay
        const loading = document.getElementById('loading')
        if (loading) loading.style.display = 'none'

        this.cameras.main.setBackgroundColor('0x171717')
        const { width, height } = this.scale

        const button = (this.add as any).nineslice(0, 0, 100, 18, BTN_GREY, 3, 3, 3, 3)
            .setOrigin(0.5, 0.5)
            .setScale(3, 3)
            .setInteractive()
            
        if (!button) {
            throw new Error('Failed to create game button')
        }
        this.button = button

        this.text = this.add.bitmapText(0, 0, UPHEAVAL, 'click to play', 32)
            .setOrigin(0.5, 0.5)

        this.statusText = this.add.bitmapText(0, 80, UPHEAVAL, 'bypassing wallet check...', 16)
            .setOrigin(0.5, 0.5)
            .setTint(0x44fff9)

        this.container = this.add.container(width * 0.5, height * 0.5, [this.button, this.text, this.statusText])

        this.scale.on('resize', () => this.resize())

        // Click handler to bypass Web3 and jump directly into the game
        this.button.on('pointerdown', () => {
            this.launchLocalGame()
        })

        // Global canvas pointerdown fallback
        this.input.once('pointerdown', () => {
            this.launchLocalGame()
        })

        console.log('[Scene] StartScene ready')
    }

    launchLocalGame() {
        console.log('[Auth] Bypassing Web3 wallet check for local testing...')
        
        // Mock credentials expected by CONNECT_SCENE
        const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        const mockSig = "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

        this.scene.start(CONNECT_SCENE, { sig: mockSig, address: mockAddress })
    }

    resize() {
        const { width, height } = this.scale
        this.container?.setPosition(width * 0.5, height * 0.5)
    }
}