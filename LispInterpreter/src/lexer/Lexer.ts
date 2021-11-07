import {DataType} from "./DataTypes";
import {LexerToken} from "./LexerTokens";
import {SECDArray} from "../utility/SECD/SECDArray"
import { SECDValue } from "../utility/SECD/SECDValue";

export class Lexer{
    get isEvaluating(): boolean {
        return this._isEvaluating;
    }

    set isEvaluating(value: boolean) {
        this._isEvaluating = value;
    }

    inputBuffer: String;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;
    preprocessorStr: string;
    _isEvaluating: boolean;

    constructor(input: string) {
        this.inputBuffer = input;
        this.lastChar = null
        this.currVal = 0
        this.currIdentifier = ""
        this.preprocessorStr = "";
        this._isEvaluating = true;
    }

    resetPreprocessorStr(){
        this.preprocessorStr = this.getCurrString();
        if(this.lastChar)
            this.preprocessorStr += this.lastChar;
    }

    private getNextChar(): string | null{
        if(this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            if(!this._isEvaluating)
                this.preprocessorStr += result;
            return result;
        }
        return null;
    }

    private loadNonWhitespace(): string | null{
        let res = this.getNextChar();
        if(!res)
            return null;
        if(Lexer.getDataType(res) == DataType.WHITESPACE)
            return this.loadNonWhitespace();
        return res;
    }

    private loadFirstChar(): string | null{
        let dataType = Lexer.getDataType(this.lastChar);
        return (dataType == DataType.INVALID || dataType == DataType.WHITESPACE)
            ? this.loadNonWhitespace() : this.lastChar;
    }

    private static getDataType(char: string | null): DataType{
        if(!char)
            return DataType.INVALID;
        if(char.match(/[0-9]/i))
            return DataType.NUMBER;
        else if(char.match(/[a-z]|[A-Z]/i))
            return DataType.STRING;
        else if(!/\S/.test(char)){
            return DataType.WHITESPACE;
        }
        return DataType.SPEC
    }

    private loadNumber(result: number): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == DataType.NUMBER) {
            result = result * 10 + Number(currChar);
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.lastChar = currChar;
        this.currIdentifier = result.toString();
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
            case "car":
                return LexerToken.car;
            case "cdr":
                return LexerToken.cdr;
            case "consp":
                return LexerToken.consp;
            case "define":
                return LexerToken.define;
            case "def-macro":
                return LexerToken.defBasicMacro;
            default:
                return LexerToken.Iden;
        }
    }

    private loadIdentifier(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == DataType.NUMBER || currDataType == DataType.STRING || currChar == "-" || currChar == "_" ) {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.currIdentifier = result;
        this.lastChar = currChar;
        return Lexer.loadIdenToken(result);
    }

    /*private loadString(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType != DataType.QUOTES)
            result += currChar;
        this.lastChar = currChar;
        this.currIdentifier = result;
        return LexerToken.Str;
    }*/

    private loadSpecial(currChar: string | null): LexerToken{
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
                if(currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerToken.le;
                }
                this.lastChar = currChar;
                return LexerToken.lt;
            case "=":
                return LexerToken.eq;
            case ">":
                currChar = this.getNextChar();
                if(currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerToken.he;
                }
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
                this.currIdentifier += currChar;
                if(currChar == "t") {
                    this.currVal = 1;
                    return LexerToken.true;
                }
                else if(currChar == "f") {
                    this.currVal = 0;
                    return LexerToken.false;
                }
            default:
                return LexerToken.comma//LexerError
        }
    }

    private loadListAsSECDArray(): SECDArray{
        let res: SECDArray = new SECDArray();
        let currChar: string | null;
        while(true){
            currChar = this.loadFirstChar();
            if(!currChar)
                return new SECDArray(); //TODO Lexer Error
            switch(currChar){
                case "(":
                    res.push(this.loadListAsSECDArray());
                    break;
                case ")":
                    this.lastChar = null;
                    return res;
                default:
                    res.push(new SECDValue(this.loadQuotedElement(currChar)));
            }
        }
    }
/*
    public loadListAsString(): string{
        let res: string = "";
        let currChar: string;
        let arrCnt = 0;
        while(true){
            currChar = this.loadFirstChar();
            if(!currChar)
                return; //TODO Lexer Error
            res += currChar;
            switch(currChar){
                case "(":
                    arrCnt ++;
                    break;
                case ")":
                    if((-- arrCnt) == 0)
                        return res;
            }
        }
    }*/

    private loadQuotedElement(currChar: string | null): string{
        this.lastChar = currChar;
        this.getNextToken();
        switch (Lexer.getDataType(currChar)) {
            case DataType.NUMBER:
                return this.getCurrNumber().toString();
            case DataType.STRING:
            case DataType.SPEC:
                return this.getCurrString();
            case DataType.WHITESPACE:
            default:
                return ""//LexerError
        }
    }

    public loadQuotedValue(): SECDArray{
        let currChar = this.loadFirstChar();
        this.lastChar = null;
        if(currChar != "(") {
            let res: SECDArray = new SECDArray();
            res.push(new SECDValue(this.loadQuotedElement(currChar)));
            return res;
        }
        return this.loadListAsSECDArray();
    }

    public getNextToken(): LexerToken | null{
        let currChar = this.loadFirstChar();
        let currDataType: DataType;
        this.lastChar = null;
        if(!currChar)
            return null;
        this.currIdentifier = currChar;
        currDataType = Lexer.getDataType(currChar);
        switch(currDataType){
            case DataType.NUMBER:
                return this.loadNumber(Number(currChar));
            /*case DataType.QUOTES:
                return this.loadString("");*/
            case DataType.STRING:
                return this.loadIdentifier(currChar);
            case DataType.SPEC:
                return this.loadSpecial(currChar);
            default:
                return null
        }
    }

    public getCurrNumber(): number{
        return this.currVal;
    }

    public getCurrString(): string{
        return this.currIdentifier;
    }

    public getPreprocessorString(): string{
        let res = this.preprocessorStr;
        this.preprocessorStr = "";
        if(this.lastChar)
            res += this.lastChar;
        return res;
    }
}