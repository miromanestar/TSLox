import * as Expr from './expressions'
import { runtimeError } from './lox'
import { Token, TokenType } from './types'

class Interpreter implements Expr.Visitor<any> {

    interpret(expression: Expr.Expr): void {
        try {
            const value = this.evaluate(expression)
            console.log(value)
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
            case TokenType.MINUS: return -right
            case TokenType.BANG: return !this.isTruthy(right)
            default: throw new Error(`Unknown unary operator ${expr.operator.type}`)
        }
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
                throw new RuntimeError(expr.operator, `Operands must be two numbers or two strings. ${expr.operator.type} ${left} ${right}`)
            case TokenType.SLASH: 
                this.checkNumberOperands(expr.operator, left, right)
                return left / right
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right)
                return left * right
            case TokenType.GREATER: 
                this.checkNumberOperands(expr.operator, left, right)
                return left > right
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right)
                return left >= right
            case TokenType.LESS: 
                this.checkNumberOperands(expr.operator, left, right)
                return left < right
            case TokenType.LESS_EQUAL: 
                this.checkNumberOperands(expr.operator, left, right)
                return left <= right
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right)
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right)
            default: throw new Error(`Unknown binary operator ${expr.operator.type}`)
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
        
        throw new RuntimeError(operator, `Operand must be a number. ${operator.type} ${operand}`)
    }

    private checkNumberOperands(operator: Token, left: any, right: any): void {
        if (typeof left === 'number' && typeof right === 'number')
            return
        
        throw new RuntimeError(operator, `Operands must be numbers. ${operator.type} ${left} ${right}`)
    }

    private evaluate(expr: Expr.Expr): any {
        return expr.accept(this)
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