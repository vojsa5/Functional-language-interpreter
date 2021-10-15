import {SECDArray} from "../utility/SECDArray"
import {Logger} from "../logger/Logger";
import {SECDValue} from "../utility/SECDValue";
import {InstructionShortcut} from "../instructions/InstructionShortcut";
import {Instruction} from "../instructions/Instruction";
import {EmptyNode, Node, ValueNode} from "../AST/AST";


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

    private push(arr: SECDArray, val: number | string | boolean | Instruction, node?: Node): number{
        if(node == undefined)
            node = new EmptyNode()
        return arr.push(new SECDValue(val, node))
    }

    private cloneArray(arr: SECDArray){
        let other = new SECDArray()
        arr.forEach(val => other.push(val))
        return other
    }

    private evaluateUnaryExpression(arr: SECDValue | SECDArray, instructionShortcut: InstructionShortcut) {
        this.logger.info("evaluating unary expression on target: " + arr)
        //@ts-ignore
        switch (instructionShortcut._shortcut) {
            case InstructionShortcut.CONSP:
                this.push(this.stack, Array.isArray(arr))
                break;
            case InstructionShortcut.CAR:
                if(Array.isArray(arr))
                    this.stack.push(arr.shift())
                //else Runtime Error
                break;
            case InstructionShortcut.CDR:
                if(Array.isArray(arr))
                    arr.shift()
                //else Runtime Error
                this.stack.push(<SECDValue> arr)
                break;
        }
    }

    private evaluateBinaryExpression(num1: SECDValue | SECDArray, num2: SECDValue | SECDArray, instructionShortcut: InstructionShortcut) {
        let val1 = (<SECDValue> num1).val.val
        let val2 = (<SECDValue> num2).val.val
        if(typeof val1 != "number" || typeof val2 != "number")
            return//Runtime Error
        this.logger.info("evaluating binary expression on targets: " + val1 + " and " + val2)
        //@ts-ignore
        switch (instructionShortcut._shortcut) {
            case InstructionShortcut.ADD:
                this.push(this.stack, (val1 + val2), new ValueNode(val1 + val2))
                break
            case InstructionShortcut.SUB:
                this.push(this.stack, (val1 - val2), new ValueNode(val1 - val2))
                break
            case InstructionShortcut.MUL:
                this.push(this.stack, (val1 * val2), new ValueNode(val1 * val2))
                break
            case InstructionShortcut.DIV:
                this.push(this.stack, (val1 / val2), new ValueNode(val1 / val2))
                break
            case InstructionShortcut.EQ:
                this.push(this.stack, (val1 == val2), new ValueNode(val1 == val2))
                break
            case InstructionShortcut.NE:
                this.push(this.stack, (val1 != val2), new ValueNode(val1 != val2))
                break
            case InstructionShortcut.LT:
                this.push(this.stack, (val1 < val2), new ValueNode(val1 < val2))
                break
            case InstructionShortcut.LE:
                this.push(this.stack, (val1 <= val2), new ValueNode(val1 <= val2))
                break
            case InstructionShortcut.HT:
                this.push(this.stack, (val1 > val2), new ValueNode(val1 > val2))
                break
            case InstructionShortcut.HE:
                this.push(this.stack, (val1 >= val2), new ValueNode(val1 >= val2))
                break
        }
    }

    private evaluateIf(expr: SECDValue | SECDArray, branch1: SECDValue | SECDArray, branch2: SECDValue | SECDArray){
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
        console.assert(code instanceof SECDArray)
        if(code.length == 0) {
            console.log(this.stack.pop())
            return
        }
        let output = code.getNode()
        let tmpArr = new SECDArray()
        let tmpArr2, instructionShortcut
        instructionShortcut = (<SECDValue> code.shift()).val
        //@ts-ignore
        switch (instructionShortcut.val._shortcut) {
            case InstructionShortcut.LDC:
                instructionShortcut = code.shift()
                this.push(tmpArr, (<ValueNode> instructionShortcut.val.node).value)
                this.stack.push(tmpArr[0])
                break
            case InstructionShortcut.LD:
                tmpArr.push(code.shift())
                tmpArr2 = this.evaluateLoad(tmpArr[0][0], tmpArr[0][1])
                this.logger.info("loading value: " + tmpArr2)
                this.stack.push(tmpArr2)
                break
            case InstructionShortcut.SEL:
                this.evaluateIf(this.stack.pop(), code.shift(), code.shift())
                break
            case InstructionShortcut.JOIN:
                tmpArr2 = this.dump.pop()
                this._code = tmpArr2
                break
            case InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                this.stack.push(new SECDArray())
                break
            case InstructionShortcut.DUM:
                this.environment.push(new SECDArray())
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instructionShortcut.val)
                break
            case InstructionShortcut.ADD:
            case InstructionShortcut.SUB:
            case InstructionShortcut.MUL:
            case InstructionShortcut.DIV:
            case InstructionShortcut.EQ:
            case InstructionShortcut.NE:
            case InstructionShortcut.LT:
            case InstructionShortcut.LE:
            case InstructionShortcut.HT:
            case InstructionShortcut.HE:
                this.evaluateBinaryExpression(this.stack.pop(), this.stack.pop(), instructionShortcut.val)
                break
            case InstructionShortcut.CONS:
                tmpArr.push(this.stack.pop())
                tmpArr2 = this.stack.pop()
                tmpArr2.push(tmpArr.pop())
                this.stack.push(tmpArr2)
                break
            case InstructionShortcut.LDF:
                tmpArr.push(this.code.shift())
                tmpArr.push(this.environment)
                this.logger.info("loading function: " + tmpArr[0]  /*+ " in environment: " + tmpArr[1]*/)
                this.stack.push(tmpArr)
                break
            case InstructionShortcut.AP:
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
            case InstructionShortcut.RAP:
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
            case InstructionShortcut.RTN:
                tmpArr.push(this.stack.pop())
                this.stack       = new SECDArray()
                this.environment = new SECDArray()
                this.code        = new SECDArray()
                this.environment = this.environment.concat(<SECDArray> this.dump.pop())
                this.code        = this.code.concat(<SECDArray> this.dump.pop())
                this.stack       = this.stack.concat(<SECDArray> this.dump.pop())
                this.stack.push(tmpArr[0])
                this.logger.info("Returning from function, result: " + tmpArr[0])
                break
            case InstructionShortcut.DEFUN:
                if(Array.isArray(this.environment[0]))
                    this.environment[0].push(this.stack.pop())
                //else Runtime Error
                break
            default:
                console.log("error")
                //Runtime Error
        }
        this.detectAction()
    }
}