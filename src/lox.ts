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

let isAst = false
let isRpn = false
let printOutput = true


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

    interpreter.interpret(expression, printOutput)

    if (isAst)
        console.log(new AstPrinter().printExpr(expression))
    if (isRpn)
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
            if (res === 'exit')
                return
            
            run(res)

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
    printOutput = !args.includes('no-output')
    const askedHelp = args.includes('help')

    if (isAst) {
        const index = args.indexOf('ast')
        args.splice(index, 1)
    }

    if (isRpn) {
        const index = args.indexOf('rpn')
        args.splice(index, 1)
    }

    if (!printOutput) {
        const index = args.indexOf('no-output')
        args.splice(index, 1)
    }

    if (askedHelp || args.length > 1)
        help()
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