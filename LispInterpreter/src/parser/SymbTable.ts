import {SECDArray} from "./SECDArray";


export class SymbTable{
    symbols: Array<string>;
    prev: SymbTable;

    constructor(args: string[]) {
        this.symbols = args;
    }

    push(other: SymbTable): SymbTable{
        other.prev = this;
        return other;
    }

    pop(): SymbTable{
        return this.prev;
    }

    add(val: string){
        this.symbols.push(val);
    }

    rem(val: string){
        this.symbols.filter(symbol => symbol != val);
    }

    getPos(val: string): SECDArray{
        let res: SECDArray;
        res = new SECDArray();
        let numbers = this.getPosInner(val, 0);
        res.push(numbers[0]);
        res.push(numbers[1]);
        return res;
    }

    private getPosInner(val: string, cnt: number): [number, number]{
        let res = this.symbols.findIndex(symbol => symbol == val);
        if(res < 0){
            if(this.prev)
                return this.prev.getPosInner(val, cnt + 1);
            return null;
        }
        return [cnt, res];
    }
}