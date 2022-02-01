//Performs a post-order tree traversal of the generated expressions and outputs in Reverse Polish Notation.
import * as Expr from "./expressions"

class RpnPrinter implements Expr.Visitor<string> {

    printExpr(expr: Expr.Expr): string {
        return expr.accept(this)
    }

    visitBinaryExpr(expr: Expr.Binary): string {
        return `${expr.left.accept(this)} ${expr.right.accept(this)} ${expr.operator.lexeme}`
    }

    visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize('', expr.expression)
    }

    visitLiteralExpr(expr: Expr.Literal): string {
        if (expr.value == null) 
            return "nil"
        return String(expr.value)
    }

    visitUnaryExpr(expr: Expr.Unary): string {
        switch (expr.operator.lexeme) {
            case "!": return `${expr.right.accept(this)} not`
            case "-": return `${expr.right.accept(this)} neg`
            default: return this.parenthesize(expr.operator.lexeme, expr.right)
        }
    }

    private parenthesize(name: string, ...exprs: Expr.Expr[]) {
        let output = ''
        for (const expr of exprs) {
            output += `${expr.accept(this)}`
        }
        output += `${name}`


        return output
    }
}

export default RpnPrinter