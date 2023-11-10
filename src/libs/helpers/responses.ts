import { Response } from "express";
export class SuccessResponse {
  code: number;
  data?: any;
  message?: string;
  constructor(code: number, data: any = null, message = "success") {
    this.code = code;
    this.data = data;
    this.message = message;
  }
  public send(res: Response): Response {
    return res.status(this.code).json({
      message: this.message,
      status: true,
      code: this.code,
      data: this.data,
    });
  }
}

export class BadRequestResponse {
  message: string;
  code: number;
  constructor(message: string, code = 400) {
    this.code = code;
    this.message = message;
  }
  public send(res: Response): Response {
    return res.status(this.code).json({
      message: this.message,
      status: false,
      code: this.code,
    });
  }
}

export class NotFoundResponse {
  code: number;
  message: string;
  constructor(message = "Not Found", code = 404) {
    this.code = code;
    this.message = message;
  }
  public send(res: Response): Response {
    return res.status(this.code).json({
      message: this.message,
      status: false,
      code: this.code,
    });
  }
}
