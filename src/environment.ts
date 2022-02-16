import { RuntimeError } from "./interpreter"
import { Token } from "./types"

class Environment {
    private values: Map<string, any> = new Map<string, any>()

    public define(name: string, value: any): void {
        this.values.set(name, value)
    }

    public get(name: Token): any {
        if (this.values.has(name.lexeme))
            return this.values.get(name.lexeme)

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }
}

export default Environment