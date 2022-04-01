import { Token } from "./types"
import { Expr } from "./expressions"

export interface Visitor<R> {
    visitBlockStmt(stmt: Block): R
    visitBreakStmt(stmt: Break): R
    visitCaseStmt(stmt: Case): R
    visitContinueStmt(stmt: Continue): R
    visitExitStmt(stmt: Exit): R
    visitExpressionStmt(stmt: Expression): R
    visitFunctionStmt(stmt: Function): R
    visitIfStmt(stmt: If): R
    visitPrintStmt(stmt: Print): R
    visitReturnStmt(stmt: Return): R
    visitSwitchStmt(stmt: Switch): R
    visitVarStmt(stmt: Var): R
    visitWhileStmt(stmt: While): R
}

export abstract class Stmt {
    abstract accept<R>(visitor: Visitor<R>): R
}

export class Block extends Stmt {
    readonly statements: Stmt[]

    constructor(statements: Stmt[]) {
        super()
        this.statements = statements
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitBlockStmt(this)
    }
}

export class Break extends Stmt {

    constructor() {
        super()
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitBreakStmt(this)
    }
}

export class Case extends Stmt {
    readonly condition: Expr
    readonly statement: Stmt

    constructor(condition: Expr, statement: Stmt) {
        super()
        this.condition = condition
        this.statement = statement
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitCaseStmt(this)
    }
}

export class Continue extends Stmt {

    constructor() {
        super()
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitContinueStmt(this)
    }
}

export class Exit extends Stmt {

    constructor() {
        super()
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitExitStmt(this)
    }
}

export class Expression extends Stmt {
    readonly expression: Expr

    constructor(expression: Expr) {
        super()
        this.expression = expression
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitExpressionStmt(this)
    }
}

export class Function extends Stmt {
    readonly name: Token
    readonly parameters: Token[]
    readonly body: Stmt[]

    constructor(name: Token, parameters: Token[], body: Stmt[]) {
        super()
        this.name = name
        this.parameters = parameters
        this.body = body
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitFunctionStmt(this)
    }
}

export class If extends Stmt {
    readonly condition: Expr
    readonly thenBranch: Stmt
    readonly elseBranch: Stmt

    constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
        super()
        this.condition = condition
        this.thenBranch = thenBranch
        this.elseBranch = elseBranch
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitIfStmt(this)
    }
}

export class Print extends Stmt {
    readonly expression: Expr

    constructor(expression: Expr) {
        super()
        this.expression = expression
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitPrintStmt(this)
    }
}

export class Return extends Stmt {
    readonly keyword: Token
    readonly value: Expr

    constructor(keyword:Token, value: Expr) {
        super()
        this.keyword = keyword
        this.value = value
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitReturnStmt(this)
    }
}

export class Switch extends Stmt {
    readonly condition: Expr
    readonly cases: Case[]
    readonly defaultCase: Stmt

    constructor(condition: Expr, cases: Case[], defaultCase: Stmt) {
        super()
        this.condition = condition
        this.cases = cases
        this.defaultCase = defaultCase
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitSwitchStmt(this)
    }
}

export class Var extends Stmt {
    readonly name: Token
    readonly initializer: Expr

    constructor(name: Token, initializer: Expr) {
        super()
        this.name = name
        this.initializer = initializer
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitVarStmt(this)
    }
}

export class While extends Stmt {
    readonly condition: Expr
    readonly body: Stmt
    readonly isFor: boolean

    constructor(condition: Expr, body: Stmt, isFor: boolean) {
        super()
        this.condition = condition
        this.body = body
        this.isFor = isFor
    }

    accept = <R>(visitor: Visitor<R>): R => {
        return visitor.visitWhileStmt(this)
    }
}