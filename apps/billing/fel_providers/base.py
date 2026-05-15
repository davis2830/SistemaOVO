"""FEL Provider interface — adapter pattern for multiple certificadores."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class FELCertificationResult:
    """Result of a FEL certification attempt."""
    success: bool
    uuid: str = ""
    series: str = ""
    number: str = ""
    signed_xml: str = ""
    error_message: str = ""
    raw_response: str = ""


@dataclass
class FELCancellationResult:
    """Result of a FEL cancellation attempt."""
    success: bool
    cancel_uuid: str = ""
    error_message: str = ""
    raw_response: str = ""


class FELProvider(ABC):
    """
    Abstract base for FEL certification providers.
    Implement this for each certificador (Infile, Digifact, G4S, etc.)
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'INFILE', 'DIGIFACT')."""

    @abstractmethod
    def certify(self, xml: str) -> FELCertificationResult:
        """Send XML to the certificador and return the result."""

    @abstractmethod
    def cancel(self, fel_uuid: str, reason: str) -> FELCancellationResult:
        """Cancel a previously certified invoice."""

    @abstractmethod
    def check_status(self, fel_uuid: str) -> dict:
        """Check the status of a certified document."""
