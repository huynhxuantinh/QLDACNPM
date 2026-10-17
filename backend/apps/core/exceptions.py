from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


class Conflict(APIException):
    status_code = 409
    default_detail = "Dữ liệu đang được sử dụng nên không thể thực hiện thao tác."
    default_code = "conflict"


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
