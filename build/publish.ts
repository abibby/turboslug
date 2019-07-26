// tslint:disable: no-var-requires
// tslint:disable: no-console

import * as fs from 'fs'
import { publish as ghPublish } from 'gh-pages'
import { downloadCards } from './cards'

const webpack = require('webpack')
const config = require('../webpack.config')

function pack() {
    return new Promise((resolve, reject) => {
        webpack(config({}, { mode: 'production' }), async (err: Error, stats: any) => { // Stats Object
            if (err || stats.hasErrors()) {
                reject(err || new Error('build failed'))
                return
            }
            resolve()
        })
    })
}

function publish(basePath: string) {
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

function deleteFolderRecursive(path: string) {
    if (fs.existsSync(path)) {
        for (const file of fs.readdirSync(path)) {
            const curPath = path + '/' + file
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath)
            } else { // delete file
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
    await publish('dist')
    console.log('uploaded successfully')
})()
