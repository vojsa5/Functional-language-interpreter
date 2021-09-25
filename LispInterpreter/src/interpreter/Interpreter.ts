import {SECDArray} from "../parser/SECDArray"
import {Instruction} from "../instructions/Instructions";
import {Logger} from "../logger/Logger";


export class Interpreter{
    logger: Logger

    constructor(instructions: SECDArray) {
        this._code = instructions
        this._stack = new SECDArray()
        this._dump = new SECDArray()
        this._environment = new SECDArray()
        this.environment.push(new SECDArray())
        this.logger = new Logger()
    }

    get stack(): SECDArray {
        return this._stack
    }

    set stack(value: SECDArray) {
        this._stack = value
    }

    get code(): SECDArray {
        return this._code
    }

    set code(value: SECDArray) {
        this._code = value
    }

    get dump(): SECDArray {
        return this._dump
    }

    set dump(value: SECDArray) {
        this._dump = value
    }

    get environment(): SECDArray {
        return this._environment
    }

    set environment(value: SECDArray) {
        this._environment = value
    }
    private _stack: SECDArray
    private _code: SECDArray
    private _dump: SECDArray
    private _environment: SECDArray

    private cloneArray(arr: SECDArray){
        let other = new SECDArray()
        arr.forEach(val => other.push(val))
        return other
    }

    private evaluateUnaryExpression(arr: number | string | boolean | SECDArray, instruction: Instruction) {
        this.logger.info("evaluating unary expression on target: " + arr)
        //@ts-ignore
        switch (Instruction[instruction] as Instruction) {
            case Instruction.CONSP:
                this.stack.push(Array.isArray(arr))
                break;
            case Instruction.CAR:
                if(Array.isArray(arr))
                    this.stack.push(arr.shift())
                //else Runtime Error
                break;
            case Instruction.CDR:
                if(Array.isArray(arr))
                    arr.shift()
                //else Runtime Error
                this.stack.push(arr)
                break;
        }
    }

    private evaluateBinaryExpression(num1: number | string | boolean | SECDArray, num2: number | string | boolean | SECDArray, instruction: Instruction) {
        if(typeof num1 != "number" || typeof num2 != "number")
            return//Runtime Error
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2)
        //@ts-ignore
        switch (Instruction[instruction] as Instruction) {
            case Instruction.ADD:
                this.stack.push(num1 + num2)
                break
            case Instruction.SUB:
                this.stack.push(num1 - num2)
                break
            case Instruction.MUL:
                this.stack.push(num1 * num2)
                break
            case Instruction.DIV:
                this.stack.push(num1 / num2)
                break
            case Instruction.EQ:
                this.stack.push(num1 == num2)
                break
            case Instruction.NE:
                this.stack.push(num1 != num2)
                break
            case Instruction.LT:
                this.stack.push(num1 < num2)
                break
            case Instruction.LE:
                this.stack.push(num1 <= num2)
                break
            case Instruction.HT:
                this.stack.push(num1 > num2)
                break
            case Instruction.HE:
                this.stack.push(num1 >= num2)
                break
        }
    }

    private evaluateIf(expr: number | string | boolean | SECDArray, branch1: number | string | boolean | SECDArray, branch2: number | string | boolean | SECDArray){
        if(!Array.isArray(branch1) || !Array.isArray(branch2))
            return //Runtime Error
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2)
        this.dump.push(this.cloneArray(this.code))
        if(expr)
            this._code = this.cloneArray(branch1)
        else
            this._code = this.cloneArray(branch2)
    }

    private evaluateLoad(num1: number, num2: number){
        let x = this.environment.length - num1 - 1
        let innerArr = this.environment[x]
        if(Array.isArray(innerArr))
            return innerArr[innerArr.length - num2 - 1]
        //Runtime Error
    }

    public detectAction(){
        let code: SECDArray = this.code
        if(code.length == 0) {
            console.log(this.stack.pop())
            return
        }
        let tmpArr = new SECDArray()
        let tmpArr2, instruction
        instruction = code.shift()
        //@ts-ignore
        switch (Instruction[instruction] as Instruction) {
            case Instruction.LDC:
                tmpArr.push(code.shift())
                this.stack.push(tmpArr[0])
                break
            case Instruction.LD:
                tmpArr.push(code.shift())
                tmpArr2 = this.evaluateLoad(tmpArr[0][0], tmpArr[0][1])
                this.logger.info("loading value: " + tmpArr2)
                this.stack.push(tmpArr2)
                break
            case Instruction.SEL:
                this.evaluateIf(this.stack.pop(), code.shift(), code.shift())
                break
            case Instruction.JOIN:
                tmpArr2 = this.dump.pop()
                this._code = tmpArr2
                break
            case Instruction.NIL:
                //this.logger.info("loading empty list")
                this.stack.push(new SECDArray())
                break
            case Instruction.DUM:
                this.environment.push(new SECDArray())
                break
            case Instruction.CONSP:
            case Instruction.CAR:
            case Instruction.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instruction)
                break
            case Instruction.ADD:
            case Instruction.SUB:
            case Instruction.MUL:
            case Instruction.DIV:
            case Instruction.EQ:
            case Instruction.NE:
            case Instruction.LT:
            case Instruction.LE:
            case Instruction.HT:
            case Instruction.HE:
                this.evaluateBinaryExpression(this.stack.pop(), this.stack.pop(), instruction)
                break
            case Instruction.CONS:
                tmpArr.push(this.stack.pop())
                tmpArr2 = this.stack.pop()
                tmpArr2.push(tmpArr.pop())
                this.stack.push(tmpArr2)
                break
            case Instruction.LDF:
                tmpArr.push(this.code.shift())
                tmpArr.push(this.environment)
                this.logger.info("loading function: " + tmpArr[0]  /*+ " in environment: " + tmpArr[1]*/)
                this.stack.push(tmpArr)
                break
            case Instruction.AP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                this.dump.push(this.cloneArray(this.stack))
                this.dump.push(this.cloneArray(this.code))
                this.dump.push(this.cloneArray(this.environment))
                this.code        = this.cloneArray(tmpArr[0][0])
                this.environment = this.cloneArray(tmpArr[0][1])
                this.environment.push(tmpArr[1])
                this.stack.length = 0
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "")
                break
            case Instruction.RAP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                this._environment[this.environment.length - 1] = tmpArr[1]
                tmpArr.push(this.environment.pop())
                this.dump.push(this.cloneArray(this.stack))
                this.dump.push(this.cloneArray(this.code))
                this.dump.push(this.cloneArray(this.environment))
                this.environment.push(tmpArr.pop())
                this.code        = tmpArr[0][0]
                this.stack.length = 0
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "")
                break
            case Instruction.RTN:
                tmpArr.push(this.stack.pop())
                this.stack       = new SECDArray()
                this.environment = new SECDArray()
                this.code        = new SECDArray()
                this.environment = this.environment.concat(this.dump.pop())
                this.code        = this.code.concat(this.dump.pop())
                this.stack       = this.stack.concat(this.dump.pop())
                this.stack.push(tmpArr[0])
                this.logger.info("Returning from function, result: " + tmpArr[0])
                break
            case Instruction.DEFUN:
                if(Array.isArray(this.environment[0]))
                    this.environment[0].push(this.stack.pop())
                //else Runtime Error
                break
            default:
                console.log("error")
        }
        this.detectAction()
    }
}