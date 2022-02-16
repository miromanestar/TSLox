import { Expr, Binary, Unary, Literal, Grouping, Ternary, Variable, Assign } from './expressions'
import { Token, TokenType } from './types'
import { parseError } from './lox'
import { Stmt, Print, Expression, Var } from './statements'

class Parser {
    private tokens: Token[] = []
    private current: number = 0

    constructor(tokens: Token[]) {
        this.tokens = tokens
    }

    public parse = (): Stmt[] => {
        const statements: Stmt[] = []

        while (!this.isAtEnd())
            statements.push(this.declaration())

        return statements
    }

    private expression = (): Expr => {
        return this.assignment()
    }

    private declaration = (): Stmt => {
        try {
            if (this.match([TokenType.VAR]))
                return this.varDeclaration()
            
            return this.statement()
        } catch (e) {
            this.synchronize()
            return new Expression(new Literal(null))
        }
    }

    private statement = (): Stmt => {

        if (this.match([TokenType.PRINT]))
            return this.printStatement()

        return this.expressionStatement()
    }

    private printStatement = (): Stmt => {
        const value: Expr = this.expression()
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after value.')
        return new Print(value)
    }

    private varDeclaration = (): Stmt => {
        const name: Token = this.consume(TokenType.IDENTIFIER, 'Expect variable name.')

        let initializer: Expr = new Literal(null)
        if (this.match([TokenType.EQUAL]))
            initializer = this.expression()
        
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after variable declaration.')
        return new Var(name, initializer)
    }

    private expressionStatement = (): Stmt => {
        const expr: Expr = this.expression()
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after expression.')
        return new Expression(expr)
    }

    private assignment = (): Expr => {
        const expr: Expr = this.ternary()

        if (this.match([TokenType.EQUAL])) {
            const equals: Token = this.previous()
            const value: Expr = this.assignment()
            
            if (expr instanceof Variable) {
                const name: Token = expr.name
                return new Assign(name, value)
            }

            throw parseError(equals, 'Invalid assignment target.')
        }

        return expr
    }

    private equality = (): Expr => {
        let expr: Expr = this.comparison()

        while (this.match([TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL])) {
            const operator: Token = this.previous()
            const right: Expr = this.comparison()

            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private comparison = (): Expr => {
        let expr: Expr = this.term()

        while (this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL])) {
            const operator: Token = this.previous()
            const right: Expr = this.term()

            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private term = (): Expr => {
        let expr: Expr = this.factor()

        while (this.match([TokenType.MINUS, TokenType.PLUS])) {
            const operator: Token = this.previous()
            const right: Expr = this.factor()

            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private factor = (): Expr => {
        let expr: Expr = this.unary()

        while(this.match([TokenType.SLASH, TokenType.STAR])) {
            const operator: Token = this.previous()
            const right: Expr = this.unary()

            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    private unary = (): Expr => {
        if (this.match([TokenType.BANG, TokenType.MINUS])) {
            const operator: Token = this.previous()
            const right: Expr = this.unary()

            return new Unary(operator, right)
        }

        return this.primary()
    }

    private primary = (): Expr => {
        if (this.match([TokenType.FALSE]))
            return new Literal(false)
        if (this.match([TokenType.TRUE]))
            return new Literal(true)
        if (this.match([TokenType.NIL]))
            return new Literal(null)
        if (this.match([TokenType.NUMBER, TokenType.STRING]))
            return new Literal(this.previous().literal)
        if (this.match([TokenType.IDENTIFIER]))
            return new Variable(this.previous())

        if (this.match([TokenType.LEFT_PAREN])) {
            const expr: Expr = this.expression()
            this.consume(TokenType.RIGHT_PAREN, `Expect ')' after expression.`)

            return new Grouping(expr)
        }

        throw this.error(this.peek(), 'Expect expression.')
    }

    private ternary = (): Expr => {
        const expr: Expr = this.equality()

        if (this.match([TokenType.QUESTION])) {
            const isTrue: Expr = this.ternary()

            if (this.match([TokenType.COLON])) {
                const isFalse: Expr = this.ternary()
                return new Ternary(expr, isTrue, isFalse)
            } else {
                this.error(this.peek(), "Expect '?' to have matching ':'.");
            }
        }

        return expr
    }

    private match = (types: TokenType[]): boolean => {
        for (const type of types) {
            if (this.check(type)) {
                this.advance()
                return true
            }
        }

        return false
    }

    private consume = (type: TokenType, message: string): Token => {
        if (this.check(type))
            return this.advance()

        throw this.error(this.peek(), message)
    }

    private check = (type: TokenType): boolean => {
        if (this.isAtEnd())
            return false
        
        return this.peek().type === type
    }

    private advance = (): Token => {
        if (!this.isAtEnd())
            this.current++
        
        return this.previous()
    }

    private previous = (): Token => {
        return this.tokens[this.current - 1]
    }

    private peek = (): Token => {
        return this.tokens[this.current]
    }

    private isAtEnd = (): boolean => {
        return this.peek().type === TokenType.EOF
    }

    private error = (token: Token, message: string): ParseError => {
        parseError(token, message)
        return new ParseError()
    }

    private synchronize = (): void => {
        this.advance()

        while(!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON)
                return

            switch(this.peek().type) {
                case TokenType.CLASS: break;
                case TokenType.FUN: break;
                case TokenType.VAR: break;
                case TokenType.FOR: break;
                case TokenType.IF: break;
                case TokenType.WHILE: break;
                case TokenType.PRINT: break;
                case TokenType.RETURN: return;
            }

            this.advance()
        }
    }
}

class ParseError extends Error { }

export default Parser