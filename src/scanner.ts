import { Token, TokenType } from './types'
import { error } from './lox'

const keywords: Map<string, TokenType> = new Map([
    ['and', TokenType.AND],
    ['class', TokenType.CLASS],
    ['else', TokenType.ELSE],
    ['false', TokenType.FALSE],
    ['for', TokenType.FOR],
    ['fun', TokenType.FUN],
    ['if', TokenType.IF],
    ['nil', TokenType.NIL],
    ['or', TokenType.OR],
    ['print', TokenType.PRINT],
    ['return', TokenType.RETURN],
    ['super', TokenType.SUPER],
    ['this', TokenType.THIS],
    ['true', TokenType.TRUE],
    ['var', TokenType.VAR],
    ['while', TokenType.WHILE],
])

class Scanner {
    private src: string
    private tokens: Token[] = []
    private start: number = 0
    private current: number = 0
    private line: number = 1

    constructor(src: string) {
        this.src = src
    }

    scanTokens = (): Token[] => {
        while (!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line))
        return this.tokens
    }

    private scanToken = (): void => {
        const c = this.advance()

        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '?': this.addToken(TokenType.QUESTION); break;
            case ':': this.addToken(TokenType.COLON); break;
            case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG); break;
            case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;
            case '<': this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS); break;
            case '>': this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER); break;
            case '/': this.match('/') ? () => {
                while (this.peek() != '\n' && !this.isAtEnd())
                    this.advance()
            } : this.addToken(TokenType.SLASH); break;
            case ' ': break;
            case '\r': break;
            case '\t': break;
            case'\n': this.line++; break;
            case '"': this.string(); break;
            case 'o': this.match('r') && this.addToken(TokenType.OR); break;
            default:
                if (this.isDigit(c))
                    this.number()
                else if (this.isAlpha(c))
                    this.identifier()
                else
                    error(this.line, 'Unexpected character.')
        }
    }

    private addToken = (type: TokenType, literal?: unknown): void => {
        if (literal === undefined) {
            this.addToken(type, null)
            return
        }

        const text: string = this.src.substring(this.start, this.current)
        this.tokens.push(new Token(type, text, literal, this.line))
    }

    private isAtEnd = (): boolean => {
        return this.current >= this.src.length
    }

    private advance = (): string => {
        return this.src.charAt(this.current++)
    }

    private peek = (dist: number = 0) => {
        if (this.isAtEnd() || this.current + dist >= this.src.length)
            return '\0'
        return this.src.charAt(this.current + dist)
    }

    private match = (expected: string): boolean => {
        if (this.isAtEnd() || this.src.charAt(this.current) !== expected)
            return false
        
        this.current++
        return true
    }

    private string = (): void => {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n')
                this.line++
            this.advance()
        }

        if (this.isAtEnd()) {
            error(this.line, 'Unterminated string.')
            return
        }

        //Get the closing string character '"'
        this.advance()

        //Trim the surrounding quotes
        const value: string = this.src.substring(this.start + 1, this.current - 1)
        this.addToken(TokenType.STRING, value)
    }

    private isDigit = (c: string): boolean => {
        return c >= '0' && c <= '9'
    }

    private isAlpha = (c: string): boolean => {
        return (c >= 'a'.toLowerCase() && c <= 'z'.toLowerCase()) || c === '_'
    }

    private isAlphaNumeric = (c: string): boolean => {
        return this.isAlpha(c) || this.isDigit(c)
    }

    private number = (): void => {
        while (this.isDigit(this.peek()))
            this.advance()

        if (this.peek() === '.' && this.isDigit(this.peek(1))) {
            this.advance()

            while (this.isDigit(this.peek()))
                this.advance()
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.src.substring(this.start, this.current)))
    }

    private identifier = (): void => {
        while (this.isAlphaNumeric(this.peek()))
            this.advance()

        const text: string = this.src.substring(this.start, this.current)
        const type: any = keywords.get(text)
        this.addToken(keywords.has(text) ? type : TokenType.IDENTIFIER)
    }
}

export default Scanner