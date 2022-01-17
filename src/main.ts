import { argv } from 'process'
import { readFileSync } from 'fs'
import * as readline from 'readline'

import { Token } from './types'
import Scanner from './scanner'

let hadError: Boolean = false


const logReport = (line: number, where: string, msg: string): void => {
    console.error(`[Line ${ line }] Error ${ where }: ${ msg }`)
    hadError = true
}

const error = (line: number, msg: string): void => {
    logReport(line, "", msg)
}

const run = (src: string): void => {
    const scanner = new Scanner(src)
    let tokens: Token[] = scanner.scanTokens()

    for (const token of tokens) {
        console.log(token)
    }
}

const runFile = (path: string): void => {
    const src = readFileSync(path, {
        encoding: 'utf8', flag: 'r'
    })

    run(src)

    if (hadError)
        process.exit(65)
}

const repl = async (): Promise<void> => {
    console.log('Starting TSLox REPL')
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    })

    rl.on('close', () => {
        console.log('\rExiting TSLox REPL')
        rl.close()
    })

    const replLoop = () => {
        rl.question('FUCK> ', res => {
            if (!res)
                process.exit(1)

            run(res)

            if (hadError)
                process.exit(65)

            replLoop()
        })
    }

    replLoop()
}

const main = (): void => {
    const args = argv.slice(2)

    if (args.length > 1)
        console.log('Usage: main.ts [path]')
    else if (args.length === 1)
        runFile(args[0])
    else
        repl()
}

main()

export {
    error
}