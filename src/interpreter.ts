import * as Expr from './expressions'
import * as Stmt from './statements'
import { runtimeError } from './lox'
import { Callable, Clock, LFunction, Token, TokenType } from './types'
import Environment from './environment'

class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<any> {
    globals: Environment = new Environment()
    private env: Environment = this.globals
    private locals: Map<Expr.Expr, number> = new Map()

    constructor() {
        this.globals.define('clock', new Clock())
    }

    interpret(statements: Stmt.Stmt[], isRepl: boolean | undefined): void {
        try {
            if (isRepl && statements[0] instanceof Stmt.Expression && statements.length === 1) {
                console.log(this.stringify(this.evaluate(statements[0].expression)))
                return
            }

            for (const stmt of statements)
                this.execute(stmt)
        } catch (e) {
            runtimeError(e)
        }
    }

    visitLiteralExpr(expr: Expr.Literal) {
        return expr.value
    }

    visitLogicalExpr(expr: Expr.Logical) {
        const left = this.evaluate(expr.left)

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left))
                return left
        } else {
            if (!this.isTruthy(left))
                return left
        }

        return this.evaluate(expr.right)
    }

    visitGroupingExpr(expr: Expr.Grouping) {
        return this.evaluate(expr.expression)
    }

    visitUnaryExpr(expr: Expr.Unary) {
        const right = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right)
                return -right
            case TokenType.BANG: 
                return !this.isTruthy(right)
            default: throw new Error(`Unknown unary operator ${expr.operator.lexeme}`)
        }
    }

    visitTernaryExpr(expr: Expr.Ternary) {
        const condition = this.evaluate(expr.condition)

        if (this.isTruthy(condition))
            return this.evaluate(expr.ifTrue)
        else
            return this.evaluate(expr.ifFalse)
    }

    visitBinaryExpr(expr: Expr.Binary) {
        const left = this.evaluate(expr.left)
        const right = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case TokenType.MINUS: 
                this.checkNumberOperand(expr.operator, right)
                return left - right
            case TokenType.PLUS: 
                if (typeof left === 'string' && typeof right === 'string')
                    return left + right
                if (typeof left === 'number' && typeof right === 'number')
                    return left + right
                throw new RuntimeError(expr.operator, `Operands must be two numbers or two strings. ${expr.operator.lexeme} ${left} ${right}`)
            case TokenType.SLASH: 
                this.checkNumberOperands(expr.operator, left, right)
                return left / right
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right)
                return left * right
            case TokenType.GREATER: 
                this.stringOrNumber(expr.operator, left, right)
                return left > right
            case TokenType.GREATER_EQUAL:
                this.stringOrNumber(expr.operator, left, right)
                return left >= right
            case TokenType.LESS: 
                this.stringOrNumber(expr.operator, left, right)
                return left < right
            case TokenType.LESS_EQUAL: 
                this.stringOrNumber(expr.operator, left, right)
                return left <= right
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right)
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right)
            default: throw new Error(`Unknown binary operator ${expr.operator.lexeme}`)
        }
    }

    visitCallExpr(expr: Expr.Call) {
        const callee = this.evaluate(expr.callee)

        if ( !(callee instanceof Callable) ) {
            throw new RuntimeError(
                expr.paren, `Can only call functions and classes. ${expr.paren.lexeme} ${callee}
            `)
        }
        
        const args = expr.args.map(arg => this.evaluate(arg))
        const funct: Callable = callee

        if (funct.arity() !== args.length)
            throw new RuntimeError(expr.paren, 
                `Expected ${funct.arity()} arguments but got ${args.length}. ${expr.paren.lexeme} ${callee}
            `)

        return funct.call(this, args)
    }

    private isTruthy(object: any): boolean {
        if (object === null) 
            return false
        if (typeof object === 'boolean')
            return object

        return true
    }

    private isEqual(a: any, b: any): boolean {
        if (a === null && b === null)
            return true
        if (a === null)
            return false
        return a === b
    }

    private stringify(value: any): string {
        if (value === null)
            return 'nil'

        if (typeof value === 'number') {
            const text = value.toString()
            if (text.endsWith('.0'))
                return text.slice(0, -2)
            return text
        }

        return value.toString()
    }

    private checkNumberOperand(operator: Token, operand: any): void {
        if (typeof operand === 'number')
            return
        
        throw new RuntimeError(operator, `Operand must be a number. ${operator.lexeme} ${operand}`)
    }

    private checkNumberOperands(operator: Token, left: any, right: any): void {
        if (typeof left === 'number' && typeof right === 'number')
            return
        
        throw new RuntimeError(operator, `Operands must be numbers. ${operator.lexeme} ${left} ${right}`)
    }

    private stringOrNumber(operator: Token, left: any, right: any): void {
        if (typeof left === 'string' && typeof right === 'string')
            return

        if (typeof left === 'number' && typeof right === 'number')
            return
        
        throw new RuntimeError(operator, `Operands must be both strings or numbers. ${operator.lexeme} ${left} ${right}`)
    }

    private evaluate(expr: Expr.Expr): any {
        return expr.accept(this)
    }

    private execute(stmt: Stmt.Stmt): void {
        stmt.accept(this)
    }

    public resolve(expr: Expr.Expr, depth: number): void {
        this.locals.set(expr, depth)
    }

    public executeBlock(statements: Stmt.Stmt[], env: Environment): void {
        const previous = this.env
        
        try {
            this.env = env
            for (const stmt of statements)
                this.execute(stmt)
        } finally {
            this.env = previous
        }
    }

    public visitBlockStmt(stmt: Stmt.Block) {
        this.executeBlock(stmt.statements, new Environment(this.env))
        return null 
    }

    public visitCaseStmt(stmt: Stmt.Case) {
        this.execute(stmt)
    }

    public visitExpressionStmt(stmt: Stmt.Expression) {
        this.evaluate(stmt.expression)
        return null
    }

    public visitFunctionStmt(stmt: Stmt.Function) {
        const funct: LFunction = new LFunction(stmt, this.env)
        this.env.define(stmt.name.lexeme, funct)
        return null
    }

    public visitIfStmt(stmt: Stmt.If) {
        if (this.isTruthy(this.evaluate(stmt.condition)))
            this.execute(stmt.thenBranch)
        else if (stmt.elseBranch)
            this.execute(stmt.elseBranch)
        return null
    }

    public visitPrintStmt(stmt: Stmt.Print) {
        const value = this.stringify(this.evaluate(stmt.expression))
        console.log(value)
    }

    public visitReturnStmt(stmt: Stmt.Return) {
        const value = stmt.value ? this.evaluate(stmt.value) : null
        throw new ReturnException(value)
    }

    public visitSwitchStmt(stmt: Stmt.Switch) {
        for (const c of stmt.cases) {
            const caseCond = this.evaluate(c.condition)
            const switchCond = this.evaluate(stmt.condition)
            if (this.isEqual(caseCond, switchCond)) {
                this.execute(c.statement)
                return
            }
        }

        this.execute(stmt.defaultCase)
        return null
    }

    public visitVarStmt(stmt: Stmt.Var) {
        let value: any = null;
        if (stmt.initializer !== null)
            value = this.evaluate(stmt.initializer)

        this.env.define(stmt.name.lexeme, value)
        return null
    }

    public visitWhileStmt(stmt: Stmt.While) {

        try {
            while (this.isTruthy(this.evaluate(stmt.condition)))
                this.execute(stmt.body)
        } catch (e) { 
            if (e instanceof ContinueException) {

                //If a for loop, execute the incrementor
                if (stmt.isFor) {
                    const block = stmt.body as Stmt.Block
                    const expr = block.statements[1] as Stmt.Expression
                    this.execute(expr)
                }

                this.execute(stmt)
            }
        }

        return null
    }

    public visitBreakStmt(stmt: Stmt.Break) {
        throw new BreakException()
    }

    public visitContinueStmt(stmt: Stmt.Continue) {
        throw new ContinueException()
    }

    public visitExitStmt() {
        process.exit(0)
    }

    public visitAssignExpr(expr: Expr.Assign) {
        const value = this.evaluate(expr.value)
        
        const distance: number | undefined = this.locals.get(expr)
        if (distance)
            this.env.assignAt(distance, expr.name, value)
        else
            this.globals.assign(expr.name, value)

        return value
    }

    public visitVariableExpr(expr: Expr.Variable) {
        return this.lookupVariable(expr.name, expr)
    }

    private lookupVariable(name: Token, expr: Expr.Expr): any {
        const distance = this.locals.get(expr)

        if (distance)
            return this.env.getAt(distance, name.lexeme)

        return this.globals.get(name)
    }
}

class RuntimeError extends Error {
    readonly token: Token

    constructor(token: Token, message: string) {
        super(message)
        this.token = token
    }
}

class BreakException extends Error { 
    constructor() {
        super('break')
        Object.setPrototypeOf(this, BreakException.prototype)
    }
}

class ContinueException extends Error {
    constructor() {
        super('continue')
        Object.setPrototypeOf(this, ContinueException.prototype)
    }
 }

class ReturnException extends Error {
    readonly value: any

    constructor(value: any) {
        super('return')
        Object.setPrototypeOf(this, ReturnException.prototype)
        this.value = value
    }
}

export default Interpreter
export {
    RuntimeError,
    ReturnException
}