import { Request, Response, NextFunction } from "express";
import { BadRequestResponse, NotFoundResponse } from "./responses";

enum ErrorType {
  BAD_REQUEST = "BadRequestError",
  NOT_FOUND = "NotFoundError",
  UN_AUTHORIZED = "UnAuthorized",
}

export class AppError {
  res: Response;
  code: number;
  message: string;
  constructor(res: Response, code: number, message: string) {
    this.res = res;
    this.code = code;
    this.message = message;
  }
}

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string = "error",
    public code: number = 400
  ) {
    super(type);
  }

  public static handle(err: ApiError, res: Response): Response {
    switch (err.type) {
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.NOT_FOUND:
        return new NotFoundResponse(err.message).send(res);
      case ErrorType.UN_AUTHORIZED:
        return new BadRequestResponse(err.message, err.code).send(res);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export const CatchErrorHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class UNAUTHORIZED extends ApiError {
  constructor(message = "UnAuthorized Resource") {
    super(ErrorType.UN_AUTHORIZED, message, 403);
  }
}
