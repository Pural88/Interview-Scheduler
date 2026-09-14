// Node.js gives us an Error class. Here we make our own class that
// inherits from it so thrown errors carry an HTTP status code and a
// consistent shape the client can rely on.

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        } else{
            Error.captureStackTrace(this , this.constructor)

        }

    }

    // `message` is inherited from Error and is non-enumerable, so
    // JSON.stringify would silently drop it and clients would see no
    // reason for the failure. Serialise it explicitly.
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            errors: this.errors,
        }
    }
}


export { ApiError };
