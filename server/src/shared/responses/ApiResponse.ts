export class ApiResponse<T> {
    constructor(
        public success: boolean,
        public message: string,
        public data?: T,
        public errors?: unknown,
        public meta?: Record<string, unknown>
    ) {}

    static success<T>(message: string, data?: T) {
        return new ApiResponse(true, message, data);
    }

    static error(message: string, errors?: unknown) {
        return new ApiResponse(false, message, undefined, errors);
    }
}