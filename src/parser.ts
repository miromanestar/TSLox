import { Expr, Binary, Unary, Literal, Grouping, Ternary, Variable, Assign, Logical } from './expressions'
import { Token, TokenType } from './types'
import { parseError } from './lox'
import { Stmt, Block, Print, Expression, Var, If, While, Exit, Break, Continue, Switch, Case } from './statements'

class Parser {
    private tokens: Token[] = []
    private current: number = 0
    private loopDepth: number = 0
    private prevStatement: Stmt | null = null
    private isRepl: boolean | undefined

    constructor(tokens: Token[], isRepl?: boolean) {
        this.tokens = tokens
        this.isRepl = isRepl
    }

    public parse = (): Stmt[] => {
        const statements: Stmt[] = []

        while (!this.isAtEnd()) {
            this.prevStatement = this.declaration()
            statements.push(this.prevStatement)
        }

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

        if (this.match([TokenType.BREAK]))
            return this.breakStatement()
        if (this.match([TokenType.CONTINUE]))
            return this.continueStatement()
        if (this.match([TokenType.EXIT]))
            return this.exitStatement()
        if (this.match([TokenType.FOR]))
            return this.forStatement()
        if (this.match([TokenType.IF]))
            return this.ifStatement()
        if (this.match([TokenType.PRINT]))
            return this.printStatement()
        if (this.match([TokenType.QUESTION]))
            return this.ternaryStatement()
        if (this.match([TokenType.SWITCH]))
            return this.switchStatement()
        if (this.match([TokenType.WHILE]))
            return this.whileStatement()
        if (this.match([TokenType.LEFT_BRACE]))
            return new Block(this.block())

        return this.expressionStatement()
    }

    private ifStatement = (): Stmt => {
        this.consume(TokenType.LEFT_PAREN, 'Expect \'(\' after \'if\'.')
        const condition: Expr = this.expression()
        this.consume(TokenType.RIGHT_PAREN, 'Expect \')\' after \'if\' condition.')

        const thenBranch: Stmt = this.statement()
        let elseBranch: Stmt = new Expression(new Literal(null))
        if (this.match([TokenType.ELSE]))
            elseBranch = this.statement()

        return new If(condition, thenBranch, elseBranch)
    }

    private ternaryStatement = (): Stmt => {
        if ( !(this.prevStatement instanceof Expression) )
            this.error(this.peek(), 'Ternary expects expression before \'?\'.')

        const condition: Expr = (this.prevStatement as Expression).expression
        const thenBranch: Stmt =this.statement()
        this.consume(TokenType.COLON, 'Expect \':\' after ternary then branch.')
        const elseBranch: Stmt = this.statement()

        return new If(condition, thenBranch, elseBranch)
    }

    private switchStatement = (): Stmt => {
        this.consume(TokenType.LEFT_PAREN, 'Expect \'(\' after \'switch\'.')
        const condition: Expr = this.expression()
        this.consume(TokenType.RIGHT_PAREN, 'Expect \')\' after \'switch\' condition.')

        this.consume(TokenType.LEFT_BRACE, 'Expect \'{\' after \'switch\' condition.')
        
        const cases: Case[] = []
        let def: Stmt = new Expression(new Literal(null))
        while (!this.check(TokenType.RIGHT_BRACE)) {
            if (this.match([TokenType.CASE])) {
                const expr: Expr = this.expression()
                this.consume(TokenType.COLON, 'Expect \':\' after case condition.')
                cases.push(new Case(expr, this.statement()))
            } else if (this.match([TokenType.DEFAULT])) {
                this.consume(TokenType.COLON, 'Expect \':\' after \'default\'.')
                def = this.statement()
            } else {
                this.error(this.peek(), 'Expect \'case\' or \'default\' after \'switch\' condition.')
            }
        }
        this.consume(TokenType.RIGHT_BRACE, 'Expect \'}\' after \'switch\' condition.')

        return new Switch(condition, cases, def)
    }

    private whileStatement = (): Stmt => {
        this.consume(TokenType.LEFT_PAREN, 'Expect \'(\' after \'while\'.')
        const condition: Expr = this.expression()
        this.consume(TokenType.RIGHT_PAREN, 'Expect \')\' after \'while\' condition.')
        
        try {
            this.loopDepth++
            const body: Stmt = this.statement()
            return new While(condition, body, false)
        } finally {
            this.loopDepth--
        }

    }

    private forStatement = (): Stmt => {
        this.consume(TokenType.LEFT_PAREN, 'Expect \'(\' after \'for\'.')
        
        let initializer: Stmt | null
        if (this.match([TokenType.SEMICOLON]))
            initializer = null
        else if (this.match([TokenType.VAR]))
            initializer = this.varDeclaration()
        else
            initializer = this.expressionStatement()

        let condition: Expr | null = null
        if (!this.check(TokenType.SEMICOLON))
            condition = this.expression()
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after loop condition.')

        let increment: Expr | null = null
        if (!this.check(TokenType.RIGHT_PAREN))
            increment = this.expression()
        this.consume(TokenType.RIGHT_PAREN, 'Expect \')\' after for clauses.')

        try {
            this.loopDepth++
            let body: Stmt = this.statement()

            if (increment) {
                body = new Block([body, new Expression(increment)])
            }
    
            if (!condition)
                condition = new Literal(true)
            
            body = new While(condition, body, true)
    
            if (initializer)
                body = new Block([initializer, body])
    
            return body
        } finally {
            this.loopDepth--
        }
    }

    private breakStatement = (): Stmt => {
        if (this.loopDepth === 0)
            parseError(this.peek(), 'Cannot \'break\' outside of a loop.')
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after \'break\'.')
        return new Break()
    }

    private continueStatement = (): Stmt => {
        if (this.loopDepth === 0)
            parseError(this.peek(), 'Cannot \'continue\' outside of a loop.')
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after \'continue\'.')
        return new Continue()
    }

    private exitStatement = (): Stmt => {
        this.consume(TokenType.SEMICOLON, 'Expect \';\' after \'exit\'.')
        return new Exit()
    }

    private block = (): Stmt[] => {
        let statements: Stmt[] = []

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd())
            statements.push(this.declaration())

        this.consume(TokenType.RIGHT_BRACE, 'Expect \'}\' after block.')
        return statements
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
        if (this.isRepl)
            return new Expression(expr)

        this.consume(TokenType.SEMICOLON, 'Expect \';\' after expression.')
        return new Expression(expr)
    }

    private assignment = (): Expr => {
        const expr: Expr = this.or()

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

    private or = (): Expr => {
        let expr: Expr = this.and()

        while(this.match([TokenType.OR])) {
            const operator: Token = this.previous()
            const right: Expr = this.and()
            expr = new Logical(expr, operator, right)
        }

        return expr
    }

    private and = (): Expr => {
        let expr: Expr = this.equality()

        while(this.match([TokenType.AND])) {
            const operator: Token = this.previous()
            const right: Expr = this.equality()
            expr = new Logical(expr, operator, right)
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
        //If there's a statement in repl mode and a statement, disallow not putting semicolons.
        if (type === TokenType.SEMICOLON)
            this.isRepl = false

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