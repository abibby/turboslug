// tslint:disable: no-var-requires
// tslint:disable: no-console

import * as fs from 'fs'
import { publish as ghPublish } from 'gh-pages'
import { resolve } from 'path'
import { downloadCards } from './cards'

const fbtools = require('firebase-tools')
const webpack = require('webpack')
const config = require('../webpack.config')

function pack(): Promise<void> {
    return new Promise((resolve, reject) => {
        webpack(config({}, { mode: 'production' }), async (err: Error, stats: any) => {
            if (err || stats.hasErrors()) {
                reject(err || new Error('build failed'))
                return
            }
            resolve()
        })
    })
}

function publish(basePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ghPublish(basePath, err => {
            if (err !== undefined) {
                reject(err)
                return
            }
            resolve()
        })
    })
}

function deleteFolderRecursive(path: string): void {
    if (fs.existsSync(path)) {
        for (const file of fs.readdirSync(path)) {
            const curPath = path + '/' + file
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath)
            } else {
                fs.unlinkSync(curPath)
            }
        }
        fs.rmdirSync(path)
    }
}

(async () => {
    deleteFolderRecursive('dist')
    await pack()
    await downloadCards()
    await fbtools.deploy({
        cwd: resolve(__dirname, '../'),
    })
    console.log('uploaded successfully')
})()
