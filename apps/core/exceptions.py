"""Custom exception handler for SistemaOVO — standard error format."""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Return errors in the standard format: {success: false, error: {...}}."""
    response = exception_handler(exc, context)

    if response is not None:
        error_code = getattr(exc, "default_code", "error")
        if isinstance(exc.detail, dict):
            message = exc.detail
        elif isinstance(exc.detail, list):
            message = exc.detail
        else:
            message = str(exc.detail)

        response.data = {
            "success": False,
            "error": {
                "code": error_code.upper() if isinstance(error_code, str) else "ERROR",
                "message": message,
            },
        }

    return response


class BusinessLogicError(APIException):
    """Raised when a business rule is violated."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "BUSINESS_LOGIC_ERROR"
    default_detail = "Operación no permitida."


class CreditLimitExceeded(BusinessLogicError):
    default_code = "CREDIT_LIMIT_EXCEEDED"
    default_detail = "El cliente supera su límite de crédito."


class InsufficientStock(BusinessLogicError):
    default_code = "INSUFFICIENT_STOCK"
    default_detail = "Stock insuficiente para completar la operación."
