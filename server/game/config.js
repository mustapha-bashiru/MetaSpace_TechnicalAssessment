import '@geckos.io/phaser-on-nodejs'
import Phaser from 'phaser'

const config = {
  type: Phaser.HEADLESS, // Must be HEADLESS for Node.js
  parent: 'phaser-game',
  width: 800,
  height: 600,
  banner: false,
  audio: {
    noAudio: true // Disable WebAudio on headless server
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }
    }
  }
}

export default config