import * as Expr from './expressions'
import * as Stmt from './statements'
import { runtimeError } from './lox'
import { Token, TokenType } from './types'
import Environment from './environment'

class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<any> {
    private env: Environment = new Environment()

    interpret(statements: Stmt.Stmt[]): void {
        try {
            for (const stmt of statements)
                this.execute(stmt)
        } catch (e) {
            runtimeError(e)
        }
    }

    visitLiteralExpr(expr: Expr.Literal) {
        return expr.value
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

    public visitExpressionStmt(stmt: Stmt.Expression) {
        this.evaluate(stmt.expression)
        return null
    }

    public visitPrintStmt(stmt: Stmt.Print) {
        const value = this.evaluate(stmt.expression)
        console.log(value)
        return null
    }

    public visitVarStmt(stmt: Stmt.Var) {
        let value: any = null;
        if (stmt.initializer !== null)
            value = this.evaluate(stmt.initializer)

        this.env.define(stmt.name.lexeme, value)
        return null
    }

    public visitAssignExpr(expr: Expr.Assign) {
        const value = this.evaluate(expr.value)
        this.env.assign(expr.name, value)
        return value
    }

    public visitVariableExpr(expr: Expr.Variable) {
        return this.env.get(expr.name)
    }
}

class RuntimeError extends Error {
    readonly token: Token

    constructor(token: Token, message: string) {
        super(message)
        this.token = token
    }
}

export default Interpreter
export {
    RuntimeError
}