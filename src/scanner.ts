import { Token, TokenType } from './types'
import { error } from './main'

class Scanner {
    src: string //Contains the source code of the file being run
    
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
            default: error(this.line, 'Unexpected character.'); break;
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

    private peek = () => {
        if (this.isAtEnd())
            return '\0'
        return this.src.charAt(this.current)
    }

    private match = (expected: string): boolean => {
        if (this.isAtEnd() || this.src.charAt(this.current) !== expected)
            return false
        
        this.current++
        return true
    }
}

export default Scanner