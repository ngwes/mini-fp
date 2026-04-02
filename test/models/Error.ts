export class ErrorResult{
    private constructor(
        public code:string,
        public message:string
    ){}

    static with(code:string, message:string){
        return new ErrorResult(code, message);
    }
}