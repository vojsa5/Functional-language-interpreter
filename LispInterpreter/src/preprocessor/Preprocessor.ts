import {Parser} from "../parser/Parser";
import {SECDArray} from "../parser/SECDArray";
import {LexerToken} from "../lexer/LexerTokens";


export class Preprocessor extends Parser{

    constructor() {
        super();
    }

    loadInstructions(): SECDArray {
        this.currTok = this.lexer.getNextToken();
        let res = this.topLevel();
        this.push(res, this.lexer.getPreprocessorString());
        return res;
    }

    compileBackQuote(): SECDArray {
        if(!this.lexer.isEvaluating)
            return;//TODO ParserError
        this.lexer.isEvaluating = false;
        this.compare(LexerToken.backQuote);
        let res = this.expr();
        this.lexer.isEvaluating = true;
        let str = this.lexer.getPreprocessorString();
        if(str.length > 0 && this.currTok)
            str = str.substring(0, str.length - 1);
        this.push(res, str);
        return res;
    }

    compileComma(): SECDArray {
        if(this.lexer.isEvaluating)
            return;//TODO ParserError
        this.lexer.isEvaluating = true;
        let res: SECDArray = new SECDArray();
        let str = this.lexer.getPreprocessorString();
        if(str.length > 0)
            str = str.substring(0, str.length - 1);
        this.push(res, str);
        this.compare(LexerToken.comma);
        res.push(this.expr());
        this.lexer.resetPreprocessorStr();
        this.lexer.isEvaluating = false;
        return res;
    }

}