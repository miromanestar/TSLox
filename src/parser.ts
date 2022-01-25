import { match } from 'assert'
import { Expr, Binary, Unary, Literal, Grouping } from './expressions'
import { Token, TokenType } from './types'

class Parser {
    private tokens: Token[] = []
    private current: number = 0

    constructor(tokens: Token[]) {
        this.tokens = tokens
    }

    private expression = (): Expr => {
        return this.equality()
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
        
        if (this.match([TokenType.LEFT_PAREN])) {
            const expr: Expr = this.expression()
            this.consume(TokenType.RIGHT_PAREN, `Expect ')' after expression.`)

            return new Grouping(expr)
        }

        //Just to make the compiler happy about always returning something
        return new Literal(null)
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
}

export default Parser