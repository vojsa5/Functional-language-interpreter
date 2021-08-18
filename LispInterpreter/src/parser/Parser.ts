import {LexerToken} from "../lexer/LexerTokens";
import {Lexer} from "../lexer/Lexer";
import {Instruction} from "../instructions/Instructions";
import {SymbTable} from "./SymbTable";
import {SECDArray} from "./SECDArray";


export class Parser{
    lexer: Lexer;
    currTok: LexerToken;
    instructions:  SECDArray;
    symbTable: SymbTable;

    constructor() {
        this.instructions = new SECDArray();
        this.symbTable = new SymbTable([]);
    }

    parse(input: string): SECDArray{
        this.lexer = new Lexer(input);
        return this.loadInstructions();
    }

    compare(tok: LexerToken){
        if(this.currTok == tok)
            this.currTok = this.lexer.getNextToken();
        //else ParserError
    }

    loadInstructions(): SECDArray {
        this.currTok = this.lexer.getNextToken();
        this.compare(LexerToken.leftBracket);
        this.instructions = this.topLevel();
        this.compare(LexerToken.rightBracket);
        //this.instructions.map(instruction => console.log(instruction));
        return this.instructions;
    }

    private topLevel(): SECDArray {
        let res: SECDArray = new SECDArray();
        switch (this.currTok){
            case LexerToken.define:
                this.compare(LexerToken.define)
                this.compare(LexerToken.leftBracket);
                this.iden();
                this.args();
                this.compare(LexerToken.rightBracket);
                this.expr();
                break;
            case LexerToken.defBasicMacro:
                this.compare(LexerToken.defBasicMacro);
                this.compare(LexerToken.leftBracket);
                this.iden();
                this.args();
                this.compare(LexerToken.rightBracket);
                this.expr();
                break;
            case LexerToken.defHygMacro:
                this.compare(LexerToken.defHygMacro);
                this.compare(LexerToken.leftBracket);
                this.iden();
                this.args();
                this.compare(LexerToken.rightBracket);
                this.expr();
                break;
            case LexerToken.struct:
                this.compare(LexerToken.struct);
                this.compare(LexerToken.leftBracket);
                this.iden();
                this.args();
                this.compare(LexerToken.rightBracket);
                break;
            case LexerToken.let:
            case LexerToken.letrec:
            case LexerToken.lambda:
            case LexerToken.if:
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.he:
            case LexerToken.ht:
            case LexerToken.eq:
            case LexerToken.ne:
            case LexerToken.lt:
            case LexerToken.le:
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.consp:
            case LexerToken.begin:
            case LexerToken.printf:
            case LexerToken.backQuote:
            case LexerToken.comma:
            case LexerToken.quote:
            case LexerToken.Iden:
                res = this.expr_body();
                break;
        }
        return res;
    }

    private expr(): SECDArray {
        let res: SECDArray = new SECDArray();
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket);
                res = this.expr_body();
                this.compare(LexerToken.rightBracket);
                break;
            case LexerToken.Str:
            case LexerToken.Num:
            case LexerToken.Bool:
            case LexerToken.null:
            case LexerToken.Iden:
                res = this.val();
        }
        return res;
    }

    private expr_body(): SECDArray {
        let res: SECDArray = new SECDArray();
        let innerArr: SECDArray;
        let args: string[];
        let innerRes: [string[], SECDArray];
        switch (this.currTok) {
            case LexerToken.let:
                this.compare(LexerToken.let);
                this.compare(LexerToken.leftBracket);
                innerRes = this.letBody();
                res = res.concat(innerRes[1]);
                res.push(Instruction[Instruction.CONS]);
                this.compare(LexerToken.rightBracket);
                res.push(this.lambda(innerRes[0]));
                res.push(Instruction[Instruction.AP]);
                break;
            case LexerToken.letrec:
                this.compare(LexerToken.letrec);
                this.compare(LexerToken.leftBracket);
                res.push(Instruction[Instruction.DUM]);
                innerRes = this.letBody();
                res = res.concat(innerRes[1]);
                res.push(Instruction[Instruction.CONS]);
                this.compare(LexerToken.rightBracket);
                res.push(this.lambda(innerRes[0]));
                res.push(Instruction[Instruction.RAP]);
                break;
            case LexerToken.lambda:
                this.compare(LexerToken.lambda);
                this.compare(LexerToken.leftBracket);
                args = this.args();
                this.compare(LexerToken.rightBracket);
                res = (this.lambda(args));
                break;
            case LexerToken.if:
                this.compare(LexerToken.if);
                res = this.expr();
                res.push(Instruction[Instruction.SEL]);
                innerArr = this.expr();
                innerArr.push(Instruction[Instruction.JOIN]);
                res.push(innerArr);
                innerArr = this.expr();
                innerArr.push(Instruction[Instruction.JOIN]);
                res.push(innerArr);
                break;
            case LexerToken.begin:
                this.compare(LexerToken.begin);
                res = this.beginBody();
                break;
            case LexerToken.printf:
                this.compare(LexerToken.printf);
                this.compare(LexerToken.Str);
                this.args();
                break;
            case LexerToken.plus:
                this.compare(LexerToken.plus);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.ADD]);
                break;
            case LexerToken.minus:
                this.compare(LexerToken.minus);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.SUB]);
                break;
            case LexerToken.times:
                this.compare(LexerToken.times);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.MUL]);
                break;
            case LexerToken.division:
                this.compare(LexerToken.division);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.DIV]);
                break;
            case LexerToken.lt:
                this.compare(LexerToken.lt);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.LT]);
                break;
            case LexerToken.le:
                this.compare(LexerToken.le);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.LE]);
                break;
            case LexerToken.eq:
                this.compare(LexerToken.eq);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.EQ]);
                break;
            case LexerToken.he:
                this.compare(LexerToken.he);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.HE]);
                break;
            case LexerToken.ht:
                this.compare(LexerToken.ht);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.HT]);
                break;
            case LexerToken.or:
                this.compare(LexerToken.or);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.OR]);
                break;
            case LexerToken.and:
                this.compare(LexerToken.and);
                res = this.expr();
                res = this.expr().concat(res);
                res.push(Instruction[Instruction.AND]);
                break;
            case LexerToken.car:
                this.compare(LexerToken.car);
                res = this.expr();
                res.push(Instruction[Instruction.CAR]);
                break;
            case LexerToken.cdr:
                this.compare(LexerToken.cdr);
                res = this.expr();
                res.push(Instruction[Instruction.CDR]);
                break;
            case LexerToken.consp:
                this.compare(LexerToken.consp);
                res = this.expr();
                res.push(Instruction[Instruction.CONSP]);
                break;
            case LexerToken.backQuote:
                this.compare(LexerToken.backQuote);
                this.expr();
                break;
            case LexerToken.comma:
                this.compare(LexerToken.comma);
                this.expr();
                break;
            case LexerToken.quote://TODO
                this.compare(LexerToken.quote);
                this.compare(LexerToken.leftBracket);
                this.vals();
                this.compare(LexerToken.rightBracket);
                break;
            case LexerToken.Iden:
            case LexerToken.leftBracket:
                res = this.functionArgs().concat(Instruction[Instruction.AP]);
                break;
        }
        return res;
    }

    private val(): SECDArray {
        let res: SECDArray = new SECDArray();
        switch (this.currTok) {
            case LexerToken.Str:
                this.compare(LexerToken.Str);
                break;
            case LexerToken.Bool:
                res = this.num();
                this.compare(LexerToken.Bool);
                break;
            case LexerToken.Num:
                res = this.num();
                this.compare(LexerToken.Num);
                break;
            case LexerToken.Iden:
                res = this.iden();
                this.compare(LexerToken.Iden);
                break;
            case LexerToken.null:
                this.compare(LexerToken.null);
                res.push(Instruction[Instruction.NIL]);
                break;
            case LexerToken.quote:
                this.compare(LexerToken.quote);
                this.compare(LexerToken.leftBracket);
                this.vals();
                this.compare(LexerToken.rightBracket);
                break;
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket);
                this.val();
                this.compare(LexerToken.rightBracket);
        }
        return res;
    }

    private iden(): SECDArray {
        let res: SECDArray = new SECDArray();
        res.push(Instruction[Instruction.LD]);
        res.push(this.symbTable.getPos(this.lexer.getCurrString()));
        return res;
    }

    private args(): string[]{
        let res: string[];
        res = [];
        let arg: string;
        switch (this.currTok) {
            case LexerToken.rightBracket:
                break;
            case LexerToken.dot:
                this.compare(LexerToken.dot);
                this.iden();//TODO jako dole
                this.args();
                break;
            case LexerToken.Iden:
                arg = this.lexer.getCurrString();
                res = [arg];
                this.compare(LexerToken.Iden);
                res = res.concat(this.args());
                break;
        }
        return res;
    }

    private letBody(): [string[], SECDArray] {
        let res: SECDArray = null;
        let innerArr: SECDArray = new SECDArray();
        let args: Array<string> = [];
        let arg: string;
        let innerRes: [string[], SECDArray];
        switch (this.currTok){
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket);
                arg = this.lexer.getCurrString();
                this.symbTable = this.symbTable.push(
                    new SymbTable([arg]));
                this.compare(LexerToken.Iden);
                this.compare(LexerToken.rightBracket);
                this.compare(LexerToken.leftBracket);
                res = this.functionArgs();
                this.compare(LexerToken.rightBracket);
                this.symbTable = this.symbTable.pop();
                innerRes = this.letBody();
                args = innerRes[0];
                innerArr = innerRes[1];
                args.push(arg);
                if(innerArr != null)
                    res.push(innerArr);
                break;
            case LexerToken.rightBracket:
                break;
        }
        return [args, res];
    }

    private beginBody(): SECDArray {
        let res: SECDArray = null;
        let innerArr: SECDArray = new SECDArray();
        switch (this.currTok){
            case LexerToken.leftBracket:
                res = this.expr();
                innerArr = this.beginBody();
                if(innerArr != null)
                    res = res.concat(innerArr).concat(
                        Instruction[Instruction[Instruction.POP]]);
                break;
            case LexerToken.rightBracket:
                break;
        }
        return res;
    }

    private vals(): SECDArray {
        let res: SECDArray = new SECDArray();
        switch (this.currTok) {
            case LexerToken.leftBracket:
            case LexerToken.Str:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Bool:
            case LexerToken.Num:
                this.val();
                this.vals();
                break;
            case LexerToken.rightBracket:
                break;
        }
        return res;
    }

    private funcCall(): SECDArray {
        let res: SECDArray = new SECDArray();
        this.iden();
        this.funcArgs();
        return res;
    }

    private functionArgs(): SECDArray{
        let res: SECDArray = new SECDArray();
        let innerArr: SECDArray;
        res.push(Instruction[Instruction.NIL]);
        innerArr = this.expr();
        return res.concat(this.funcArgs()).concat(innerArr);
    }

    private funcArgs(): SECDArray {
        let res: SECDArray = new SECDArray();
        switch (this.currTok){
            case LexerToken.leftBracket:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Str:
            case LexerToken.Bool:
            case LexerToken.Num:
                res = this.expr();
                res.push(Instruction[Instruction.CONS]);
                res = this.funcArgs().concat(res);
                break;
            case LexerToken.rightBracket:
                break;
        }
        return res;
    }

    private num(): SECDArray {
        let res: SECDArray = new SECDArray();
        res.push(Instruction[Instruction.LDC]);
        res.push(this.lexer.getCurrNumber());
        return res
    }

    private lambda(args: string[]): SECDArray{
        let res: SECDArray = new SECDArray();
        let innerArray: SECDArray;
        this.symbTable = this.symbTable.push(new SymbTable(args));
        res.push(Instruction[Instruction.LDF]);
        innerArray = this.expr();
        innerArray.push(Instruction[Instruction.RTN]);
        res.push(innerArray);
        this.symbTable = this.symbTable.pop();
        return res;
    }
}