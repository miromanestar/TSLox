import { RuntimeError } from "./interpreter"
import { Token } from "./types"

class Environment {
    private values: Map<string, any> = new Map<string, any>()
    readonly enclosing?: Environment

    constructor(enclosing?: Environment) {
        this.enclosing = enclosing
    }

    public define(name: string, value: any): void {
        this.values.set(name, value)
    }

    public ancestor(distance: number): Environment | undefined {
        let environment: Environment | undefined = this
        for (let i = 0; i < distance; i++) {
            environment = environment?.enclosing
        }

        return environment
    }

    public getAt(distance: number, name: string): any {
        return this.ancestor(distance)?.values.get(name)
    }

    public assignAt(distance: number, name: Token, value: any): void {
        this.ancestor(distance)?.values.set(name.lexeme, value)
    }

    public get(name: Token): any {
        if (this.values.has(name.lexeme))
            return this.values.get(name.lexeme)

        if (this.enclosing)
            return this.enclosing.get(name)

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }

    public assign(name: Token, value: any): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value)
            return
        }

        if (this.enclosing) {
            this.enclosing.assign(name, value)
            return
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }
}

export default Environment