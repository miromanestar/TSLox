import { argv } from 'process'
import { readFileSync } from 'fs'
import * as readline from 'readline'

import Colors from './colors'
import { Token, TokenType } from './types'
import Scanner from './scanner'
import Parser from './parser'
import Interpreter from './interpreter'
import { Expression, Stmt } from './statements'

let hadError: boolean = false
let hadRuntimeError: boolean = false
const interpreter = new Interpreter()

let isAst = false
let isRpn = false
let testMode = false


const logReport = (line: number, where: string, msg: string): void => {
    console.log(`${ Colors.RED }[line ${ line }] Error ${ where }: ${ msg }${ Colors.RESET }`)
    hadError = true
}

const error = (line: number, msg: string): void => {
    logReport(line, "", msg)
}

const parseError = (token: Token, message: string): void => {
    if (token.type === TokenType.EOF)
        logReport(token.line, `at end`, message)
    else
        logReport(token.line, `at '${ token.lexeme }'`, message)
}

const runtimeError = (err: any): void => {
    console.log(`${ Colors.RED }[Runtime][line ${ err.token?.line }] ${ err.message }${ Colors.RESET }`)
    hadRuntimeError = true
}

const run = (src: string, isRepl?: boolean): void => {
    const scanner = new Scanner(src)
    const tokens: Token[] = scanner.scanTokens()

    const parser = new Parser(tokens, isRepl)
    const statements: Stmt[] = parser.parse()

    if (hadError)
        return

    interpreter.interpret(statements)
    
    if (statements[0] instanceof Expression && statements.length === 1)
        console.log(statements[0].expression.accept(interpreter))

    if (!isRepl && !testMode)
        return
    
    if (!hadError && !hadRuntimeError && !isRepl)
        console.log(`${ Colors.GREEN }No errors.${ Colors.RESET }`)
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
    !testMode && console.log('Starting TSLox REPL')
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    })

    rl.on('close', () => {
        !testMode && console.log('\rExiting TSLox REPL')
        rl.close()
    })

    const replLoop = () => {
        rl.question(`${!testMode && '> '}`, res => {
            if (res === 'exit')
                return
            
            run(res, true)

            hadError = false
            replLoop()
        })
    }

    replLoop()
}

const help = (): void => {
    console.log('Usage: lox [path] [ast?] [rpn?] [no-output?]')
    console.log('\nOptions:')
    console.log('\tast\t\tPrints the AST')
    console.log('\trpn\t\tPrints the RPN')
    console.log('\tno-output\tDoes not print the output')
}

const main = (): void => {
    const args = argv.slice(2)

    isAst = args.includes('ast')
    isRpn = args.includes('rpn')
    testMode = args.includes('test')
    const askedHelp = args.includes('help')

    if (isAst) {
        const index = args.indexOf('ast')
        args.splice(index, 1)
    }

    if (isRpn) {
        const index = args.indexOf('rpn')
        args.splice(index, 1)
    }

    if (testMode) {
        const index = args.indexOf('test')
        args.splice(index, 1)
    }

    if (askedHelp || args.length > 1)
        help()
    else if (args.length === 1 && !args[0].includes('rpn'))
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