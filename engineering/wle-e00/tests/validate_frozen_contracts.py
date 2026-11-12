"""WLE-E00: validate unmodified WLE-P1B rc1 JSON Schemas and their fixtures."""
import json
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parent.parent
names = ("command-envelope", "contract-appointment", "domain-event", "external-reference", "programme-baseline")
result = {"valid_pass": 0, "invalid_rejected": 0, "schema_errors": 0}
for name in names:
    path = BASE / "contracts/schemas" / f"{name}.schema.json"
    schema = json.loads(path.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    valid = json.loads((BASE / "fixtures/valid" / f"{name}.json").read_text())
    errors = list(validator.iter_errors(valid))
    if errors:
        raise AssertionError(f"VALID fixture {name} rejected: {errors[0].message}")
    result["valid_pass"] += 1
    print(f"PASS  valid/{name}.json")
for path in sorted((BASE / "fixtures/invalid").glob("*.json")):
    prefix = path.stem.split('_')[0]
    if prefix not in names:
        raise AssertionError(f"Invalid fixture unknown contract {path}")
    schema = json.loads((BASE / "contracts/schemas" / f"{prefix}.schema.json").read_text())
    candidate = json.loads(path.read_text())
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = list(validator.iter_errors(candidate))
    if not errors:
        raise AssertionError(f"INVALID fixture unexpectedly accepted: {path.name}")
    result["invalid_rejected"] += 1
    print(f"PASS  reject invalid/{path.name}: {errors[0].message[:85]}")
print('CONTRACT_RESULTS', json.dumps(result, sort_keys=True))
