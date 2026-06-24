"""Schemas for simulated payment checkout."""

import re
from datetime import datetime
from pydantic import BaseModel, field_validator


class CheckoutRequest(BaseModel):
    plan_id: int
    card_number: str       # цифры или с пробелами
    card_holder: str
    expiry: str            # формат MM/YY
    cvc: str

    @field_validator("card_number")
    @classmethod
    def validate_card(cls, v: str) -> str:
        digits = re.sub(r"\s+", "", v)
        if not digits.isdigit() or not (13 <= len(digits) <= 19):
            raise ValueError("Номер карты должен содержать от 13 до 19 цифр")
        if not _luhn(digits):
            raise ValueError("Номер карты не прошёл проверку Луна")
        return digits

    @field_validator("card_holder")
    @classmethod
    def validate_holder(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Укажите имя держателя карты")
        if not re.match(r"^[A-Za-zА-Яа-яЁё\s\-\.]+$", v):
            raise ValueError("Имя держателя содержит недопустимые символы")
        return v

    @field_validator("expiry")
    @classmethod
    def validate_expiry(cls, v: str) -> str:
        m = re.match(r"^(\d{2})\s*/\s*(\d{2})$", v.strip())
        if not m:
            raise ValueError("Срок действия должен быть в формате MM/YY")
        month, year = int(m.group(1)), int(m.group(2)) + 2000
        if not (1 <= month <= 12):
            raise ValueError("Некорректный месяц")
        now = datetime.now()
        if (year, month) < (now.year, now.month):
            raise ValueError("Срок действия карты истёк")
        return f"{month:02d}/{year % 100:02d}"

    @field_validator("cvc")
    @classmethod
    def validate_cvc(cls, v: str) -> str:
        if not re.fullmatch(r"\d{3,4}", v):
            raise ValueError("CVC должен содержать 3 или 4 цифры")
        return v


class CheckoutResponse(BaseModel):
    success: bool
    subscription_id: int
    payment_id: int
    transaction_id: str
    amount: float
    card_last4: str
    status: str


def _luhn(card: str) -> bool:
    total, alt = 0, False
    for ch in reversed(card):
        n = int(ch)
        if alt:
            n *= 2
            if n > 9:
                n -= 9
        total += n
        alt = not alt
    return total % 10 == 0
