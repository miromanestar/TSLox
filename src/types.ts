class Token {
    type: TokenType
    literal: unknown
    lexeme: string
    line: number

    constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
        this.type = type
        this.literal = literal
        this.lexeme = lexeme
        this.line = line
    }

    toString = (): string => {
        return `${ this.type } ${ this.lexeme } ${ this.literal }`
    }
}

enum TokenType {
    //One character tokens
    LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,
    QUESTION, COLON,

    //One/two character tokens
    BANG, BANG_EQUAL,
    EQUAL, EQUAL_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,
    
    //Literals
    IDENTIFIER, STRING, NUMBER,

    //Keywords
    AND, BREAK, CASE, CLASS, CONTINUE, DEFAULT, ELSE, FALSE, FUN, FOR, IF, NIL,
    OR, EXIT, PRINT, RETURN, SUPER, SWITCH, THIS, TRUE, VAR, WHILE, EOF
}

export  {
    Token, TokenType
}