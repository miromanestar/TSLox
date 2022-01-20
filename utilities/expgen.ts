import { writeFileSync } from 'fs'

const expTypes = [
    "Binary   : left: Expr, operator: Token, right: Expr",
    "Grouping : Expr expression",
    "Literal  : Object value",
    "Unary    : Token operator, Expr right"
]

const defineType = (baseName: string, className: string, fields: string): string => {
    let output: string = ''

    //class className extends baseClass
    output.concat(`class ${ className } extends ${ baseName } {\n`)

    /*
        private variableName: type
    */
    const fieldArr: string[] = fields.split(',')
    fieldArr.forEach(field => {
        const type = field.split(' ')[0].substring(0, field[0].length - 1)
        const name = field.split(' ')[1]
        output.concat(`    private ${ name }: ${ type }\n`)
    })

    output.concat('\n')
    output.concat(`    constructor()`)

    return output
}

const defineAst = (dir: string, baseName: string, types: string[]) => {
    let output: string = ''
    for (const type of expTypes) {
        const className = type.split(':')[0].trim()
        const fields = type.substring(type.indexOf(':') + 1).trim()
        output.concat(defineType(baseName, className, fields))
    }
}