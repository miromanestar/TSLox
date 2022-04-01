import * as Expr from './expressions'
import * as Stmt from './statements'
import { Token } from './types'
import Interpreter from './interpreter'
import { parseError } from './lox'

class Resolver implements Expr.Visitor<any>, Stmt.Visitor<any> {
    private readonly interpreter: Interpreter
    private readonly scopes: Map<string, boolean>[] = []
    private currentFunction: FunctionType = FunctionType.NONE

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter
    }

    public visitBlockStmt(stmt: Stmt.Block) {
        this.beginScope()
        this.resolve(stmt.statements)
        this.endScope()
    }

    public visitBreakStmt(stmt: Stmt.Break) {
        return null
    }

    public visitCaseStmt(stmt: Stmt.Case) {
        this.resolve(stmt.condition)
        this.resolve(stmt.statement)
    }

    public visitContinueStmt(stmt: Stmt.Continue) {
        return null
    }

    public visitExitStmt(stmt: Stmt.Exit) {
        return null
    }

    public visitExpressionStmt(stmt: Stmt.Expression) {
        this.resolve(stmt.expression)
    }

    public visitSwitchStmt(stmt: Stmt.Switch) {
        this.resolve(stmt.condition)

        for (const caseStmt of stmt.cases) {
            this.resolve(caseStmt)
        }
    }

    public visitVarStmt(stmt: Stmt.Var) {
        this.declare(stmt.name)
        
        if (stmt.initializer) {
            this.resolve(stmt.initializer)
        
        }

        this.define(stmt.name)
    }

    public visitWhileStmt(stmt: Stmt.While) {
        this.resolve(stmt.condition)
        this.resolve(stmt.body)
    }

    public visitFunctionStmt(stmt: Stmt.Function) {
        this.declare(stmt.name)
        this.define(stmt.name)

        this.resolveFunction(stmt, FunctionType.FUNCTION)
    }

    public visitIfStmt(stmt: Stmt.If) {
        this.resolve(stmt.condition)
        this.resolve(stmt.thenBranch)
        if (stmt.elseBranch)
            this.resolve(stmt.elseBranch)
    }

    public visitPrintStmt(stmt: Stmt.Print) {
        this.resolve(stmt.expression)
    }

    public visitReturnStmt(stmt: Stmt.Return) {
        if (this.currentFunction === FunctionType.NONE)
            parseError(stmt.keyword, 'Can\'t return from top-level code.')

        if (stmt.value)
            this.resolve(stmt.value)
    }

    public visitAssignExpr(expr: Expr.Assign) {
        this.resolve(expr.value)
        this.resolveLocal(expr, expr.name)
    }

    public visitBinaryExpr(expr: Expr.Binary) {
        this.resolve(expr.left)
        this.resolve(expr.right)
    }

    public visitCallExpr(expr: Expr.Call) {
        this.resolve(expr.callee)

        for (const arg of expr.args) {
            this.resolve(arg)
        }
    }

    public visitGroupingExpr(expr: Expr.Grouping) {
        this.resolve(expr.expression)
    }

    public visitLiteralExpr(expr: Expr.Literal) {
        return null
    }

    public visitLogicalExpr(expr: Expr.Logical) {
        this.resolve(expr.left)
        this.resolve(expr.right)
    }

    public visitUnaryExpr(expr: Expr.Unary) {
        this.resolve(expr.right)
    }

    public visitTernaryExpr(expr: Expr.Ternary) {
        this.resolve(expr.condition) 
        this.resolve(expr.ifTrue)

        if (expr.ifFalse)
            this.resolve(expr.ifFalse)
    }

    public visitVariableExpr(expr: Expr.Variable) {
        if (!this.scopesEmpty() && this.peekScopes().get(expr.name.lexeme) === false) {
            parseError(expr.name, 'Can\'t read local variable in its own initializer.')
        }

        this.resolveLocal(expr, expr.name)
    }

    private beginScope() {
        const map: Map<string, boolean> = new Map()
        this.scopes.push(map)
    }

    private endScope() {
        this.scopes.pop()
    }

    private declare(token: Token) {
        if (this.scopesEmpty())
            return

        if (this.peekScopes().has(token.lexeme))
            parseError(token, 'Already a variable with this name in this scope.')

        this.peekScopes().set(token.lexeme, false)
    }

    private define(token: Token) {
        if (this.scopesEmpty())
            return

        this.peekScopes().set(token.lexeme, true)
    }

    public resolve(res: Stmt.Stmt[] | Stmt.Stmt | Expr.Expr) {

        if (res instanceof Array)
            res.forEach(stmt => stmt.accept(this))
        else
            res.accept(this)
    }

    private resolveFunction(stmt: Stmt.Function, type: FunctionType) {
        const enclosingFunction = this.currentFunction
        this.currentFunction = type

        this.beginScope()
        for (const param of stmt.parameters) {
            this.declare(param)
            this.define(param)
        }

        this.resolve(stmt.body)
        this.endScope()

        this.currentFunction = enclosingFunction
    }

    private resolveLocal(expr: Expr.Expr, name: Token) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i)
                return
            }
        }
    }

    private scopesEmpty() {
        return this.scopes.length === 0
    }

    private peekScopes() {
        return this.scopes[this.scopes.length - 1]
    }
}

enum FunctionType {
    NONE, FUNCTION
}

export default Resolver