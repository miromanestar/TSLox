import Environment from './environment'
import Interpreter, { ReturnException } from './interpreter'
import * as Stmt from './statements'

type LObject = Callable | number | string | boolean | null

abstract class Callable {
    abstract arity(): number
    abstract call(interpreter: Interpreter, args: any[]): LObject
    abstract toString(): string
}

class LFunction extends Callable {
    private readonly declaration: Stmt.Function
    private readonly closure: Environment
    
    constructor(declaration: Stmt.Function, closure: Environment) {
        super()
        this.closure = closure
        this.declaration = declaration
    }

    arity = (): number => this.declaration.parameters.length

    call = (interpreter: Interpreter, args: any[]): LObject => {
        const environment = new Environment(this.closure)
        for (let i = 0; i < this.declaration.parameters.length; i++) {
            environment.define(this.declaration.parameters[i].lexeme, args[i])
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment)
        } catch (e) {
            if (e instanceof ReturnException)
                return e.value
        }

        return null
    }

    toString = (): string => `<fn ${this.declaration.name.lexeme}>`
}

class Clock extends Callable {
    arity = (): number => 0
    call = (intrepeter: Interpreter, args: any[]): LObject => Date.now() / 1000
    toString = (): string => '<native fn \'clock\'>'
}

class Token {
    type: TokenType
    literal: unknown
    lexeme: string
    line: number

    constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
        this.type = type
        this.literal = literal
        this.lexeme = lexeme
        this.line = line
    }

    toString = (): string => {
        return `${ this.type } ${ this.lexeme } ${ this.literal }`
    }
}

enum TokenType {
    //One character tokens
    LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,
    QUESTION, COLON,

    //One/two character tokens
    BANG, BANG_EQUAL,
    EQUAL, EQUAL_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,
    
    //Literals
    IDENTIFIER, STRING, NUMBER,

    //Keywords
    AND, BREAK, CASE, CLASS, CONTINUE, DEFAULT, ELSE, FALSE, FUN, FOR, IF, NIL,
    OR, EXIT, PRINT, RETURN, SUPER, SWITCH, THIS, TRUE, VAR, WHILE, EOF
}

export  {
    Token, TokenType, Callable, Clock, LFunction, LObject
}