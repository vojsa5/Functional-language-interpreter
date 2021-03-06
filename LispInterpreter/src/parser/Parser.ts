import {LexerToken} from "../lexer/LexerTokens"
import {Lexer} from "../lexer/Lexer"
import {Instruction} from "../utility/instructions/Instruction"
import {SymbTable} from "./SymbTable"
import {SECDArray} from "../utility/SECD/SECDArray"
import { SECDValue } from "../utility/SECD/SECDValue"
import { InstructionShortcut } from "../utility/instructions/InstructionShortcut"

export class Parser{
    symbTable: SymbTable
    lexer!: Lexer
    currTok!: LexerToken | null

    constructor() {
        this.symbTable = new SymbTable([])
    }

    protected compare(tok: LexerToken){
        if(this.currTok == tok)
            this.currTok = this.lexer.getNextToken()
        //else ParserError
    }
    
    protected push(arr: SECDArray, val: string | number | boolean | SECDArray): number{
        if(val == null)
            return -2
        if(val instanceof SECDArray)
            return arr.push(val)
        return arr.push(new SECDValue(val as string | number | Instruction))
    }
    
    protected isEvaluating(): boolean{
        return this.lexer.isEvaluating
    }

    parse(input: string): SECDArray{
        this.lexer = new Lexer(input)
        return this.loadInstructions()
    }

    protected loadInstructions(): SECDArray {
        this.currTok = this.lexer.getNextToken()
        let res: SECDArray = new SECDArray()
        while(true) {
            switch (this.currTok) {
                case LexerToken.quote:
                case LexerToken.null:
                case LexerToken.Iden:
                case LexerToken.Str:
                case LexerToken.Bool:
                case LexerToken.Num:
                case LexerToken.leftBracket:
                    res = res.concat(this.topLevel())
                    break
                case null:
                    return res
            }
        }
    }

    protected topLevel(): SECDArray {
        let res: SECDArray = new SECDArray()
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                res = this.definition()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.quote:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Str:
            case LexerToken.Bool:
            case LexerToken.Num:
                res = this.val()
                break
        }
        return res
    }

    protected definition(): SECDArray{
        let res: SECDArray = new SECDArray()
        let args: string[]
        switch (this.currTok){
            case LexerToken.define:
                this.compare(LexerToken.define)
                this.symbTable.addFront(this.lexer.getCurrString())
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                this.compare(LexerToken.rightBracket)
                res = this.lambda(args)
                this.push(res, InstructionShortcut[InstructionShortcut.DEFUN])
                break
            case LexerToken.defBasicMacro://TODO
                this.compare(LexerToken.defBasicMacro)
                this.symbTable.add(this.lexer.getCurrString())
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                this.compare(LexerToken.rightBracket)
                res = this.lambda(args)
                break
            case LexerToken.defHygMacro://TODO
                this.compare(LexerToken.defHygMacro)
                this.iden()
                this.compare(LexerToken.leftBracket)
                this.args()
                this.compare(LexerToken.rightBracket)
                this.expr()
                break
            case LexerToken.struct://TODO
                this.compare(LexerToken.struct)
                this.compare(LexerToken.leftBracket)
                this.iden()
                this.args()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.Iden:
            case LexerToken.let:
            case LexerToken.letrec:
            case LexerToken.lambda:
            case LexerToken.if:
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.consp:
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.le:
            case LexerToken.lt:
            case LexerToken.eq:
            case LexerToken.ne:
            case LexerToken.he:
            case LexerToken.ht:
            case LexerToken.and:
            case LexerToken.or:
            case LexerToken.backQuote:
            case LexerToken.comma:
                res = this.expr_body()
                break
        }
        return res
    }

    protected expr(): SECDArray {
        let res: SECDArray = new SECDArray()
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                res = this.expr_body()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.backQuote:
                res = this.compileBackQuote()
                break
            case LexerToken.comma:
                res = this.compileComma()
                break
            case LexerToken.Str:
            case LexerToken.Num:
            case LexerToken.Bool:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.quote:
                res = this.val()
        }
        return res
    }

    protected expr_body(): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray
        let args: string[]
        let innerRes: [string[], SECDArray]
        switch (this.currTok) {
            case LexerToken.let:
                this.compare(LexerToken.let)
                this.compare(LexerToken.leftBracket)
                innerRes = this.letBody()
                res = res.concat(innerRes[1])
                this.push(res, InstructionShortcut[InstructionShortcut.CONS])
                this.compare(LexerToken.rightBracket)
                res = res.concat(this.lambda(innerRes[0]))
                this.push(res, InstructionShortcut[InstructionShortcut.AP])
                break
            case LexerToken.letrec:
                this.compare(LexerToken.letrec)
                this.compare(LexerToken.leftBracket)
                this.push(res, InstructionShortcut[InstructionShortcut.DUM])
                innerRes = this.letBody()
                res = res.concat(innerRes[1])
                this.push(res, InstructionShortcut[InstructionShortcut.CONS])
                this.compare(LexerToken.rightBracket)
                res = res.concat(this.lambda(innerRes[0]))
                this.push(res, InstructionShortcut[InstructionShortcut.RAP])
                break
            case LexerToken.lambda:
                this.compare(LexerToken.lambda)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                this.compare(LexerToken.rightBracket)
                res = (this.lambda(args))
                break
            case LexerToken.if:
                this.compare(LexerToken.if)
                res = this.expr()
                this.push(res, InstructionShortcut[InstructionShortcut.SEL])
                innerArr = this.expr()
                this.push(innerArr, InstructionShortcut[InstructionShortcut.JOIN])
                this.push(res, innerArr)
                innerArr = this.expr()
                this.push(innerArr, InstructionShortcut[InstructionShortcut.JOIN])
                this.push(res, innerArr)
                break
            case LexerToken.begin:
                this.compare(LexerToken.begin)
                res = this.beginBody()
                break
            case LexerToken.printf://TODO
                this.compare(LexerToken.printf)
                this.compare(LexerToken.Str)
                this.args()
                break
            case LexerToken.plus:
                this.compare(LexerToken.plus)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.ADD])
                break
            case LexerToken.minus:
                this.compare(LexerToken.minus)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.SUB])
                break
            case LexerToken.times:
                this.compare(LexerToken.times)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.MUL])
                break
            case LexerToken.division:
                this.compare(LexerToken.division)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.DIV])
                break
            case LexerToken.lt:
                this.compare(LexerToken.lt)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.LT])
                break
            case LexerToken.le:
                this.compare(LexerToken.le)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.LE])
                break
            case LexerToken.eq:
                this.compare(LexerToken.eq)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.EQ])
                break
            case LexerToken.he:
                this.compare(LexerToken.he)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.HE])
                break
            case LexerToken.ht:
                this.compare(LexerToken.ht)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.HT])
                break
            case LexerToken.or:
                this.compare(LexerToken.or)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.OR])
                break
            case LexerToken.and:
                this.compare(LexerToken.and)
                res = this.compileBinaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.AND])
                break
            case LexerToken.car:
                this.compare(LexerToken.car)
                res = this.compileUnaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.CAR])
                break
            case LexerToken.cdr:
                this.compare(LexerToken.cdr)
                res = this.compileUnaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.CDR])
                break
            case LexerToken.consp:
                this.compare(LexerToken.consp)
                res = this.compileUnaryOperator()
                this.push(res, InstructionShortcut[InstructionShortcut.CONSP])
                break
            case LexerToken.Iden:
            case LexerToken.leftBracket:
                res = this.functionCall()
                innerArr = new SECDArray()
                this.push(innerArr, InstructionShortcut[InstructionShortcut.AP])
                res = res.concat(innerArr)
                break
        }
        return res
    }

    protected val(): SECDArray {
        let res: SECDArray = new SECDArray()
        switch (this.currTok) {
            case LexerToken.Str://TODO
                this.compare(LexerToken.Str)
                break
            case LexerToken.Bool:
                res = this.num()
                this.compare(LexerToken.Bool)
                break
            case LexerToken.Num:
                res = this.num()
                this.compare(LexerToken.Num)
                break
            case LexerToken.Iden:
                res = this.iden()
                this.compare(LexerToken.Iden)
                break
            case LexerToken.null:
                this.compare(LexerToken.null)
                this.push(res, InstructionShortcut[InstructionShortcut.NIL])
                break
            case LexerToken.quote:
                res = this.compileQuote()
                break
        }
        return res
    }

    protected iden(): SECDArray {
        let res: SECDArray = new SECDArray()
        this.push(res, InstructionShortcut[InstructionShortcut.LD])
        this.push(res, this.symbTable.getPos(this.lexer.getCurrString()))
        return res
    }

    protected args(): string[]{
        let res: string[] = []
        switch (this.currTok) {
            case LexerToken.rightBracket:
                break
            case LexerToken.dot:
                this.compare(LexerToken.dot)
                this.iden()//TODO jako dole
                this.args()
                break
            case LexerToken.Iden:
                res = [this.lexer.getCurrString()]
                this.compare(LexerToken.Iden)
                res =  res.concat(this.args())
                break
        }
        return res
    }

    protected letBody(): [string[], SECDArray] {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray = new SECDArray()
        let args: Array<string> = []
        let arg: string
        let innerRes: [string[], SECDArray]
        switch (this.currTok){
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                arg = this.lexer.getCurrString()
                this.symbTable = this.symbTable.push(
                    new SymbTable([arg]))
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.rightBracket)
                this.compare(LexerToken.leftBracket)
                res = this.functionCall()
                this.compare(LexerToken.rightBracket)
                this.symbTable = this.symbTable.pop()
                innerRes = this.letBody()
                args = innerRes[0]
                innerArr = innerRes[1]
                args.push(arg)
                if(!innerArr.empty())
                    this.push(res, innerArr)
                break
            case LexerToken.rightBracket:
                break
        }
        return [args, res]
    }

    protected beginBody(): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray = new SECDArray()
        switch (this.currTok){
            case LexerToken.leftBracket:
                res = this.expr()
                innerArr = this.beginBody()
                if(innerArr != null) {
                    res = res.concat(innerArr)
                    this.push(res, InstructionShortcut[InstructionShortcut.POP])
                }
                break
            case LexerToken.rightBracket:
                break
        }
        return res
    }

    protected functionCall(): SECDArray{
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray
        this.push(res, InstructionShortcut[InstructionShortcut.NIL])
        innerArr = this.expr()
        res = res.concat(this.functionArgs())
        return res.concat(innerArr)
    }

    protected functionArgs(): SECDArray {
        let res: SECDArray = new SECDArray()
        switch (this.currTok){
            case LexerToken.leftBracket:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Str:
            case LexerToken.Bool:
            case LexerToken.Num:
            case LexerToken.quote:
                res = this.expr()
                this.push(res, InstructionShortcut[InstructionShortcut.CONS])
                res = this.functionArgs().concat(res)
                break
            case LexerToken.rightBracket:
                break
        }
        return res
    }

    protected num(): SECDArray {
        let res: SECDArray = new SECDArray()
        this.push(res, InstructionShortcut[InstructionShortcut.LDC])
        this.push(res, this.lexer.getCurrNumber())
        return res
    }

    protected lambda(args: string[]): SECDArray{
        let res: SECDArray = new SECDArray()
        let innerArray: SECDArray
        this.symbTable = this.symbTable.push(new SymbTable(args))
        this.push(res, InstructionShortcut[InstructionShortcut.LDF])
        innerArray = this.expr()
        this.push(innerArray, InstructionShortcut[InstructionShortcut.RTN])
        this.push(res, innerArray)
        this.symbTable = this.symbTable.pop()
        return res
    }

    protected compileQuote(){
        let res: SECDArray = new SECDArray()
        this.push(res, InstructionShortcut[InstructionShortcut.LDC])
        this.push(res, this.lexer.loadQuotedValue())
        this.currTok = this.lexer.getNextToken()
        return res
    }

    protected compileUnaryOperator(): SECDArray{
        return this.expr()
    }

    protected compileBinaryOperator(): SECDArray{
        let res = this.expr()
        let innerArr = this.expr()
        return innerArr.concat(res)
    }

    protected compileBackQuote(): SECDArray{
        this.compare(LexerToken.backQuote)
        return this.compileQuote()
    }

    protected compileComma(): SECDArray{
        //TODO ParserError
        return new SECDArray()
    }

}