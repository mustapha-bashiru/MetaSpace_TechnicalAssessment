import "@geckos.io/phaser-on-nodejs"
import Phaser from 'phaser'
import geckos from '@geckos.io/server'
import config from './game/config.js'
import DungeonScene from './game/scenes/dungeonScene.js'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { ethers } from "ethers"
import generateTypedAuth from '../commons/auth.mjs'
import dotenv from 'dotenv'
import { iceServers } from "@geckos.io/server"

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.text())

const authRequest = new Map()
const sessions = new Map()

// generate signer
const wallet = process.env.NODE_ENV === 'production' ? ethers.Wallet.createRandom() : new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
let signerAddress
wallet.getAddress().then(address => {
    console.log("trusted address: ", address)
    signerAddress = address
})

// GET signer address
app.get("/signer", (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send(signerAddress ? signerAddress : 'generating..')
})

// request authentication secret
app.post("/challenge", (req, res) => {
    const address = req.body
    authRequest.delete(address)
    const secret = ethers.utils.keccak256(ethers.utils.randomBytes(8))
    authRequest.set(address, secret)
    res.setHeader('Content-Type', 'text/plain')
    res.send(secret)
})

const io = geckos({
    authorization: async (auth, req, res) => {
        if (!auth) return false
        
        const token = auth.split(' ')
        const address = token[0]
        const sig = token[1]

        // 1. Dev testing bypass for local mock address
        if (address === "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") {
            console.log('[Auth Bypass] Local development login allowed for:', address)
            return { address }
        }

        // 2. Prevent duplicate session handling
        if (sessions.has(address)) {
            console.log("session in progress")
            authRequest.delete(address)
            return false
        }

        // 3. EIP-712 verification for real wallets
        const secret = authRequest.get(address)
        if (!secret) {
            console.log('[Auth Failed] No secret found for address:', address)
            return false
        }

        try {
            const { domain, types, value } = generateTypedAuth(secret)
            const recoveredAddress = ethers.utils.verifyTypedData(domain, types, value, sig)

            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                authRequest.delete(address)
                return { address }
            }
        } catch (err) {
            console.error('[Auth Error] EIP-712 verification failed:', err.message)
        }

        authRequest.delete(address)
        return false
    },
    cors: { allowAuthorization: true },
    iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
})

io.addServer(server)

const PORT = Number(process.env.PORT || 9208)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Game server listening on http://localhost:${PORT}`)
})

io.onConnection(channel => {
    console.log(channel.userData.address, 'joined')

    try {
        // create new game instance
        const game = new Phaser.Game(config)

        // set scene for game
        game.scene.add('dungeon', DungeonScene, true, { channel, wallet })

        // add game to sessions map
        sessions.set(channel.userData.address, game)

        // delete sessions from sessions map after dc
        channel.onDisconnect(() => {
            sessions.delete(channel.userData.address)
            console.log(channel.userData.address, 'disconnected')
        })
    } catch (err) {
        console.error('[Phaser Server Error]:', err)
    }
})