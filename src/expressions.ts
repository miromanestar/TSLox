import { Token } from "./types"

abstract class Expr {

}

export class Binary extends Expr {
    private left: Expr
    private right: Expr
    private operator: Token

    constructor(left: Expr, right: Expr, operator: Token) {
        super()
        this.left = left
        this.right = right
        this.operator = operator
    }
}