"""Custom renderer to wrap successful responses in the standard format."""
from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    """Wraps successful responses in {success: true, data: ...}."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response") if renderer_context else None

        if response and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and "success" in data:
            return super().render(data, accepted_media_type, renderer_context)

        wrapped = {"success": True, "data": data}
        return super().render(wrapped, accepted_media_type, renderer_context)
