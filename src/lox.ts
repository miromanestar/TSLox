import { argv } from 'process'
import { readFileSync } from 'fs'
import * as readline from 'readline'

import Colors from './colors'
import { Token, TokenType } from './types'
import { Expr } from './expressions'
import Scanner from './scanner'
import Parser from './parser'
import Interpreter from './interpreter'
import AstPrinter from './ast_printer'
import RpnPrinter from './rpn_printer'

let hadError: boolean = false
let hadRuntimeError: boolean = false
const interpreter = new Interpreter()


const logReport = (line: number, where: string, msg: string): void => {
    console.log(`${ Colors.RED }[Line ${ line }] Error ${ where }: ${ msg }${ Colors.RESET }`)
    hadError = true
}

const error = (line: number, msg: string): void => {
    logReport(line, "", msg)
}

const parseError = (token: Token, message: string): void => {
    if (token.type === TokenType.EOF)
        logReport(token.line, ` at end '${ token.lexeme }'`, message)
    else
        logReport(token.line, ` at '${ token.lexeme }'`, message)
}

const runtimeError = (err: any): void => {
    console.log(`${ Colors.RED }[Runtime] ${ err.message }${ Colors.RESET }
        \n${ Colors.RED }[Line ${ err.token.line }]${ Colors.RESET }`)
    hadRuntimeError = true
}

const run = (src: string): void => {
    const scanner = new Scanner(src)
    const tokens: Token[] = scanner.scanTokens()

    const parser = new Parser(tokens)
    const expression: Expr = parser.parse()

    if (hadError)
        return

    interpreter.interpret(expression)

    console.log(new RpnPrinter().printExpr(expression))
}

const runFile = (path: string): void => {
    const src = readFileSync(path, {
        encoding: 'utf8', flag: 'r'
    })

    run(src)

    if (hadError)
        process.exit(65)

    if (hadRuntimeError)
        process.exit(70)
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
        rl.question('> ', res => {
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
    error,
    parseError,
    runtimeError
}