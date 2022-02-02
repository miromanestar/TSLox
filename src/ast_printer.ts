import * as Expr from "./expressions"

class AstPrinter implements Expr.Visitor<string> {

    printExpr(expr: Expr.Expr): string {
        return expr.accept(this)
    }

    visitBinaryExpr(expr: Expr.Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    visitLiteralExpr(expr: Expr.Literal): string {
        if (expr.value == null) 
            return "nil"
        return String(expr.value)
    }

    visitUnaryExpr(expr: Expr.Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right)
    }

    visitTernaryExpr(expr: Expr.Ternary): string {
        return this.parenthesize("?", expr.condition, expr.ifTrue, expr.ifFalse)
    }

    private parenthesize(name: string, ...exprs: Expr.Expr[]) {
        let output = `(${name}`
        for (const expr of exprs) {
            output += ` ${expr.accept(this)}`
        }
        output += ")"


        return output
    }
}

export default AstPrinter