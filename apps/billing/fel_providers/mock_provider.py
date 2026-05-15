"""Mock FEL provider for development and testing."""
import uuid
from datetime import datetime

from .base import FELCancellationResult, FELCertificationResult, FELProvider


class MockFELProvider(FELProvider):
    """Mock provider that always succeeds — use for development only."""

    @property
    def provider_name(self) -> str:
        return "MOCK"

    def certify(self, xml: str) -> FELCertificationResult:
        return FELCertificationResult(
            success=True,
            uuid=str(uuid.uuid4()).upper(),
            series="A",
            number=str(int(datetime.now().timestamp())),
            signed_xml=xml,
        )

    def cancel(self, fel_uuid: str, reason: str) -> FELCancellationResult:
        return FELCancellationResult(
            success=True,
            cancel_uuid=str(uuid.uuid4()).upper(),
        )

    def check_status(self, fel_uuid: str) -> dict:
        return {"status": "CERTIFIED", "uuid": fel_uuid}
