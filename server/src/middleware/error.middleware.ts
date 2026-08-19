import { Request, Response, NextFunction } from "express";
import { AppError } from "@shared/errors/AppError";
import { ApiResponse } from "@shared/responses/ApiResponse";
import { HttpStatus } from "@shared/constants/httpStatus";
import { logger } from "@shared/logger/logger";

export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof AppError) {
        logger.warn(err.message);

        return res.status(err.statusCode).json(
            ApiResponse.error(err.message)
        );
    }

    logger.error("Unhandled Error", err);

    return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
            ApiResponse.error(
                "Internal Server Error"
            )
        );
}