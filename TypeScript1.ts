interface Test {
    (a: string,... args: any[]); 
}
function test(a: string, args: any[]) {
    console.log(arguments);
}
var x: Test = function () {

}
x("x", 1, 2, 3, 4);
