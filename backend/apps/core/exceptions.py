from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    original_data = response.data
    default_code = getattr(exc, "default_code", "api_error")

    if isinstance(original_data, dict) and "detail" in original_data:
        message = str(original_data["detail"])
        details = {}
    else:
        message = (
            "Dữ liệu không hợp lệ."
            if isinstance(exc, ValidationError)
            else "Yêu cầu không thể xử lý."
        )
        details = original_data

    response.data = {
        "code": default_code,
        "message": message,
        "details": details,
    }
    return response
