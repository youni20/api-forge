"""
Test suite for the IBAN / BIC / VAT Validator API.

Hits the live deployed Worker directly (not RapidAPI's gateway), so no API
key is needed here. This checks your own code is correct; it does not test
RapidAPI's auth layer, that was already confirmed working in Studio.

Run with:
    pip install pytest requests
    pytest test_api.py -v

Or directly:
    python test_api.py
"""

import requests

BASE_URL = "https://iban-vat-validator.youni.workers.dev"


def get(path, **params):
    resp = requests.get(f"{BASE_URL}{path}", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health_endpoint_is_up():
    data = get("/health")
    assert data["status"] == "ok"
    assert "endpoints" in data


# ---------------------------------------------------------------------------
# IBAN
# ---------------------------------------------------------------------------

def test_iban_valid_german():
    data = get("/iban/validate", value="DE89370400440532013000")
    assert data["valid"] is True
    assert data["country"] == "DE"
    assert data["checks"]["checksum"] is True


def test_iban_valid_uk():
    data = get("/iban/validate", value="GB29NWBK60161331926819")
    assert data["valid"] is True
    assert data["country"] == "GB"


def test_iban_invalid_checksum():
    # Last digit altered from a known-valid IBAN, checksum must fail.
    data = get("/iban/validate", value="DE89370400440532013001")
    assert data["valid"] is False
    assert data["checks"]["checksum"] is False


def test_iban_wrong_length():
    data = get("/iban/validate", value="DE8937040044053201300")  # one digit short
    assert data["valid"] is False
    assert data["checks"]["length"] is False


def test_iban_unknown_country():
    data = get("/iban/validate", value="ZZ89370400440532013000")
    assert data["valid"] is False
    assert data["checks"]["knownCountry"] is False


def test_iban_garbage_input():
    data = get("/iban/validate", value="not-an-iban")
    assert data["valid"] is False
    assert data["checks"]["format"] is False


# ---------------------------------------------------------------------------
# BIC / SWIFT
# ---------------------------------------------------------------------------

def test_bic_valid_11_char():
    data = get("/bic/validate", value="DEUTDEFF500")
    assert data["valid"] is True
    assert data["bankCode"] == "DEUT"
    assert data["countryCode"] == "DE"
    assert data["locationCode"] == "FF"
    assert data["branchCode"] == "500"


def test_bic_valid_8_char():
    data = get("/bic/validate", value="DEUTDEFF")
    assert data["valid"] is True
    assert data["branchCode"] is None


def test_bic_invalid_length():
    data = get("/bic/validate", value="TOO")
    assert data["valid"] is False


# ---------------------------------------------------------------------------
# VAT
# ---------------------------------------------------------------------------

def test_vat_valid_gb_checksum():
    # Self-derived valid checksum: 8*1+7*2+6*3+5*4+4*5+3*6+2*7=112, 112+82=194=97*2
    data = get("/vat/validate", country="GB", value="GB123456782")
    assert data["valid"] is True
    assert data["checks"]["checksum"] is True


def test_vat_invalid_gb_checksum():
    data = get("/vat/validate", country="GB", value="GB553557881")
    assert data["valid"] is False
    assert data["checks"]["checksum"] is False


def test_vat_valid_de_format_only():
    # DE has no checksum implemented, format validity is all that's checked.
    data = get("/vat/validate", country="DE", value="DE123456789")
    assert data["valid"] is True
    assert data["checks"]["checksum"] is None


def test_vat_unknown_country():
    data = get("/vat/validate", country="ZZ", value="ZZ123456789")
    assert data["valid"] is False
    assert data["checks"]["knownCountry"] is False


# ---------------------------------------------------------------------------
# Allow running directly with `python test_api.py` without pytest installed
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    tests = [obj for name, obj in list(globals().items()) if name.startswith("test_")]
    passed, failed = 0, 0
    for test in tests:
        try:
            test()
            print(f"PASS  {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL  {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"ERROR {test.__name__}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
