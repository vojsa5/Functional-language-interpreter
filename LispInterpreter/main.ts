import {Parser} from "./src/parser/Parser";




var parser: Parser;
parser = new Parser();
console.log(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
console.log(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
console.log(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
console.log(parser.parse("(letrec((fact) " +
                                    "((lambda(n)" +
                                        "(if (= n 0)" +
                                            "1" +
                                            "(* n (fact (- n 1)))))))" +
                                "(fact 2))"));
console.log(parser.parse("'(1 2 3)"));