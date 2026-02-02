"""
Lambda handler for delivery-radius-calculator.

This module provides the main entry point for AWS Lambda invocations.
"""

import json
from datetime import UTC, datetime

from src.osrm_client import get_drive_times_batch


def lambda_handler(event: dict, context) -> dict:
    """
    Main Lambda handler function.

    Args:
        event: API Gateway event dictionary
        context: Lambda context object

    Returns:
        API Gateway response dictionary
    """
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    # CORS headers for all responses
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }

    # Handle OPTIONS (CORS preflight)
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": "",
        }

    # Route requests
    if path == "/health" or path == "/":
        return health_check()

    if path == "/api/drive-times" and http_method == "POST":
        return handle_drive_times(event)

    # Default 404 for unknown paths
    return {
        "statusCode": 404,
        "headers": cors_headers,
        "body": json.dumps({"error": "Not found", "path": path}),
    }


def health_check() -> dict:
    """
    Health check endpoint.

    Returns:
        API Gateway response with health status
    """
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(
            {
                "status": "healthy",
                "timestamp": datetime.now(UTC).isoformat(),
                "service": "delivery-radius-calculator",
            }
        ),
    }


def handle_drive_times(event: dict) -> dict:
    """
    Handle drive time calculation requests.

    Expects POST body:
    {
        "pairs": [
            {"source_lat": 47.6, "source_lng": -122.3, "dest_lat": 47.7, "dest_lng": -122.4},
            ...
        ]
    }

    Returns:
    {
        "results": [
            {"index": 0, "drive_time_minutes": 15.5, "status": "ok"},
            {"index": 1, "drive_time_minutes": null, "status": "error", "message": "..."},
            ...
        ],
        "errors": []
    }
    """
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    try:
        # Parse request body
        body = event.get("body", "{}")
        if isinstance(body, str):
            body = json.loads(body)

        pairs = body.get("pairs", [])

        if not pairs:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "No coordinate pairs provided"}),
            }

        # Limit batch size to prevent timeout
        max_pairs = 50
        if len(pairs) > max_pairs:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({
                    "error": f"Too many pairs. Maximum is {max_pairs}, received {len(pairs)}"
                }),
            }

        # Validate pairs
        for i, pair in enumerate(pairs):
            required_fields = ['source_lat', 'source_lng', 'dest_lat', 'dest_lng']
            for field in required_fields:
                if field not in pair:
                    return {
                        "statusCode": 400,
                        "headers": cors_headers,
                        "body": json.dumps({
                            "error": f"Missing field '{field}' in pair at index {i}"
                        }),
                    }

        # Get drive times
        results = get_drive_times_batch(pairs)

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "results": results,
                "errors": []
            }),
        }

    except json.JSONDecodeError as e:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": f"Invalid JSON: {str(e)}"}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": f"Internal error: {str(e)}"}),
        }
