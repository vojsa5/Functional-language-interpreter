import {Parser} from "./src/parser/Parser";
import {Interpreter} from "./src/interpreter/Interpreter";




let parser = new Parser();


console.log(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
let interpreter = new Interpreter(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
interpreter.detectAction();

console.log(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
interpreter = new Interpreter(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
interpreter.detectAction();

console.log(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
interpreter = new Interpreter(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
interpreter.detectAction();

console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
interpreter = new Interpreter(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
interpreter.detectAction();

console.log(parser.parse("(letrec((fact) " +
                                    "((lambda(n)" +
                                        "(if (= n 0)" +
                                            "1" +
                                            "(* n (fact (- n 1)))))))" +
                                "(fact 2))"));
interpreter = new Interpreter(parser.parse("(letrec((fact) " +
                                                            "((lambda(n)" +
                                                                "(if (= n 0)" +
                                                                    "1" +
                                                                    "(* n (fact (- n 1)))))))" +
                                                        "(fact 2))"));
interpreter.detectAction();

console.log(parser.parse("'(1 2 3)"));
/*
console.log(parser.parse("(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
let interpreter = new Interpreter(parser.parse(
                            "(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
interpreter.detectAction();*/
/*
let preprocessor: Preprocessor = new Preprocessor();
console.log(preprocessor.parse("(def-macro macro()" +
                                        "`(+ ,(if (= 1 2)" +
                                            "`(cdr '(5 2 1))" +
                                            "'(5 2 1)" +
                                        ") 5))"));*/
