//@ts-check

import { fileURLToPath, URL } from 'node:url'
import babel from 'vite-plugin-babel'
import preact from '@preact/preset-vite'

const babelConfig = {
    babelrc: false,
    configFile: false,
    plugins: [
        [
            "@babel/plugin-proposal-decorators",
            { version: "legacy", },
        ],
        '@babel/plugin-transform-class-properties',
    ],
}

/**
 * @type {import('vite').UserConfig}
 */
const config = {
    plugins: [
        preact({ babel: babelConfig }),
        babel({ babelConfig: babelConfig }),
        // decorators(),
        // tsc({ 'abortOnError': false })
    ],

    resolve: {
        alias: {
            'js': fileURLToPath(new URL('./src/js', import.meta.url)),
            'css': fileURLToPath(new URL('./src/css', import.meta.url)),
            'res': fileURLToPath(new URL('./src/res', import.meta.url)),
            'data': fileURLToPath(new URL('./src/data', import.meta.url)),
        }
    },
    server: {
        // host: true,
        port: 6973,
        // open: "/",
    },

}

export default config
