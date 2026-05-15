"""Credit accounts and payments — simplified accounts receivable."""
from decimal import Decimal

from django.conf import settings
from django.db import models, transaction

from apps.core.exceptions import BusinessLogicError
from apps.core.models import ActiveManager, TimeStampedModel


class CreditAccount(TimeStampedModel):
    """
    Credit account per client.
    One client can have one credit account with a credit limit.
    """

    client = models.OneToOneField(
        "clients.Client", on_delete=models.PROTECT, related_name="credit_account",
    )
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Positive = client owes money.",
    )
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "credit_accounts"
        ordering = ["client__name"]

    def __str__(self):
        return f"Crédito: {self.client.name} (Q{self.current_balance}/{self.credit_limit})"

    @property
    def available_credit(self) -> Decimal:
        return max(self.credit_limit - self.current_balance, Decimal("0"))

    @property
    def utilization_pct(self) -> float:
        if self.credit_limit == 0:
            return 0.0
        return float(self.current_balance / self.credit_limit * 100)


class CreditTransaction(TimeStampedModel):
    """
    Each financial event on a credit account.
    CHARGE increases balance (sale on credit).
    PAYMENT decreases balance.
    ADJUSTMENT can go either way.
    """

    TYPE_CHOICES = [
        ("CHARGE", "Cargo"),
        ("PAYMENT", "Pago"),
        ("ADJUSTMENT", "Ajuste"),
    ]

    PAYMENT_METHODS = [
        ("EFECTIVO", "Efectivo"),
        ("CHEQUE", "Cheque"),
        ("TRANSFERENCIA", "Transferencia"),
        ("DEPOSITO", "Depósito"),
    ]

    account = models.ForeignKey(
        CreditAccount, on_delete=models.PROTECT, related_name="transactions",
    )
    transaction_type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHODS, blank=True, default="",
    )
    reference_type = models.CharField(max_length=20, blank=True, default="", help_text="e.g. INVOICE, MANUAL")
    reference_id = models.UUIDField(null=True, blank=True, help_text="ID of source document.")
    reference_number = models.CharField(max_length=50, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "credit_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type} Q{self.amount} → {self.account.client.name}"


class CreditService:
    """Service layer for credit account operations."""

    @staticmethod
    @transaction.atomic
    def charge(*, account: CreditAccount, amount: Decimal,
               reference_type: str = "", reference_id=None, reference_number: str = "",
               notes: str = "", user=None) -> CreditTransaction:
        """Add a charge (debit) to the credit account."""
        locked = CreditAccount.objects.select_for_update().get(pk=account.pk)
        if amount > locked.available_credit:
            raise BusinessLogicError(
                f"Crédito insuficiente: disponible Q{locked.available_credit}, solicitado Q{amount}"
            )
        locked.current_balance += amount
        locked.save(update_fields=["current_balance", "updated_at"])

        return CreditTransaction.objects.create(
            account=locked,
            transaction_type="CHARGE",
            amount=amount,
            balance_after=locked.current_balance,
            reference_type=reference_type,
            reference_id=reference_id,
            reference_number=reference_number,
            notes=notes,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    @transaction.atomic
    def payment(*, account: CreditAccount, amount: Decimal, payment_method: str,
                reference_number: str = "", notes: str = "", user=None) -> CreditTransaction:
        """Record a payment (credit) against the credit account."""
        locked = CreditAccount.objects.select_for_update().get(pk=account.pk)
        locked.current_balance -= amount
        if locked.current_balance < 0:
            locked.current_balance = Decimal("0")
        locked.save(update_fields=["current_balance", "updated_at"])

        return CreditTransaction.objects.create(
            account=locked,
            transaction_type="PAYMENT",
            amount=amount,
            balance_after=locked.current_balance,
            payment_method=payment_method,
            reference_number=reference_number,
            notes=notes,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    @transaction.atomic
    def adjustment(*, account: CreditAccount, amount: Decimal, notes: str,
                   user=None) -> CreditTransaction:
        """Manual adjustment. Positive increases debt, negative decreases it."""
        if not notes.strip():
            raise ValueError("Los ajustes requieren justificación.")
        locked = CreditAccount.objects.select_for_update().get(pk=account.pk)
        locked.current_balance += amount
        if locked.current_balance < 0:
            locked.current_balance = Decimal("0")
        locked.save(update_fields=["current_balance", "updated_at"])

        return CreditTransaction.objects.create(
            account=locked,
            transaction_type="ADJUSTMENT",
            amount=amount,
            balance_after=locked.current_balance,
            notes=notes,
            created_by=user,
            updated_by=user,
        )
