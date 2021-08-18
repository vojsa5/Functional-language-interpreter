import {DataType} from "./DataTypes";
import {LexerToken} from "./LexerTokens";

export class Lexer{
    inputBuffer: String;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;

    constructor(input: string) {
        this.inputBuffer = input;
    }

    private getNextChar(): string | null{
        if(this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            return result;
        }
        return null;
    }

    private loadFirstChar(): string | null{
        return this.lastChar == null ? this.getNextChar() : this.lastChar;
    }

    private static getDataType(char: string): DataType{
        if(char.match(/[0-9]/i))
            return DataType.NUMBER;
        else if(char.match(/[a-z]|[A-Z]/i))
            return DataType.STRING;
        else if(!/\S/.test(char)){
            return DataType.WHITESPACE;
        }
        return DataType.SPEC
    }

    private loadNumber(result: number, validDataType: (dataType: DataType) => boolean): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (validDataType(currDataType)) {
            result = result * 10 + Number(currChar);
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.lastChar = currChar;
        this.currVal = result;
        return LexerToken.Num;
    }

    private static loadIdenToken(str: string): LexerToken{
        switch (str) {
            case "if":
                return LexerToken.if;
            case "let":
                return LexerToken.let;
            case "letrec":
                return LexerToken.letrec;
            case "lambda":
                return LexerToken.lambda;
            case "begin":
                return LexerToken.begin;
            default:
                return LexerToken.Iden;
        }
    }

    private loadIdentifier(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == ( DataType.NUMBER | DataType.STRING )) {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.lastChar = currChar;
        this.currIdentifier = result;
        return Lexer.loadIdenToken(result);
    }

    private loadString(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType != DataType.QUOTES)
            result += currChar;
        this.lastChar = currChar;
        this.currIdentifier = result;
        return LexerToken.Str;
    }

    private loadSpecial(currChar: string): LexerToken{
        switch (currChar){
            case "+":
                return LexerToken.plus;
            case "-":
                return LexerToken.minus;
            case "*":
                return LexerToken.times;
            case "/":
                return LexerToken.division;
            case "<":
                currChar = this.getNextChar();
                if(currChar == "=")
                    return LexerToken.le;
                this.lastChar = currChar;
                return LexerToken.lt;
            case "=":
                return LexerToken.eq;
            case ">":
                currChar = this.getNextChar();
                if(currChar == "=")
                    return LexerToken.he;
                this.lastChar = currChar;
                return LexerToken.ht;
            case "(":
                return LexerToken.leftBracket;
            case ")":
                return LexerToken.rightBracket;
            case "'":
                return LexerToken.quote;
            case "`":
                return LexerToken.backQuote;
            case ".":
                return LexerToken.dot;
            case ",":
                return LexerToken.comma;
            case "#":
                currChar = this.getNextChar();
                if(currChar == "t") {
                    this.currVal = 1;
                    return LexerToken.true;
                }
                else if(currChar == "f") {
                    this.currVal = 0;
                    return LexerToken.false;
                }
                //LexerError
        }
    }

    public getNextToken(): LexerToken | null{
        let currChar = this.loadFirstChar();
        let currDataType: DataType;
        this.lastChar = null;
        if(!currChar)
            return null;
        currDataType = Lexer.getDataType(currChar);
        switch(currDataType){
            case DataType.NUMBER:
                return this.loadNumber(Number(currChar), (dataType => dataType == DataType.NUMBER));
            case DataType.QUOTES:
                return this.loadString("");
            case DataType.STRING:
                return this.loadIdentifier(currChar);
            case DataType.SPEC:
                return this.loadSpecial(currChar);
            case DataType.WHITESPACE:
                return this.getNextToken();
        }
    }

    public getCurrNumber(): number{
        return this.currVal;
    }

    public getCurrString(): string{
        return this.currIdentifier;
    }

}