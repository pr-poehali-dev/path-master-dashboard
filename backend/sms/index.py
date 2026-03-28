import os
import json
import urllib.request
import urllib.parse

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}


def make_response(status_code, body_dict):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body_dict),
    }


def handler(event, context):
    method = event.get("httpMethod", "GET").upper()

    # Handle preflight OPTIONS request
    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": "",
        }

    # Health-check GET /
    if method == "GET":
        return make_response(200, {"ok": True, "service": "sms"})

    # Only POST is allowed beyond this point
    if method != "POST":
        return make_response(405, {"ok": False, "error": "Method not allowed"})

    # Parse request body
    try:
        raw_body = event.get("body") or ""
        if isinstance(raw_body, dict):
            body = raw_body
        else:
            body = json.loads(raw_body) if raw_body else {}
    except Exception:
        return make_response(400, {"ok": False, "error": "Invalid JSON body"})

    phone = (body.get("phone") or "").strip()
    message = (body.get("message") or "").strip()

    if not phone:
        return make_response(400, {"ok": False, "error": "Field 'phone' is required"})

    if not message:
        return make_response(400, {"ok": False, "error": "Field 'message' is required"})

    api_key = os.environ.get("SMSRU_API_KEY", "")
    if not api_key:
        return make_response(500, {"ok": False, "error": "SMSRU_API_KEY is not configured"})

    # Build SMS.ru API request
    params = urllib.parse.urlencode({
        "api_id": api_key,
        "to": phone,
        "msg": message,
        "json": 1,
    })
    url = f"https://sms.ru/sms/send?{params}"

    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except Exception as e:
        return make_response(502, {"ok": False, "error": f"SMS.ru request failed: {str(e)}"})

    # SMS.ru returns status_code 100 for success
    sms_data = data.get("sms", {})
    # sms_data is a dict keyed by phone number
    phone_result = sms_data.get(phone, {})
    status_code = phone_result.get("status_code")

    if status_code == 100:
        return make_response(200, {"ok": True})
    else:
        status_text = phone_result.get("status_text", data.get("status_text", "Unknown error"))
        return make_response(200, {"ok": False, "error": status_text})
