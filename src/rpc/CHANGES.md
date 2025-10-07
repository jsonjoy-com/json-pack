# Changes for Full RFC Compliance

This document summarizes the changes made to support all RPC RFCs (1057, 1831, 5531).

## Summary

The RPC module was originally developed based on RFC 1057. The following changes were made to ensure full compliance with RFC 1831 and RFC 5531 while maintaining backward compatibility.

## Code Changes

### 1. `constants.ts`

#### Added Authentication Flavors (RFC 5531)

- `AUTH_KERB = 4` - Kerberos authentication
- `AUTH_RSA = 5` - RSA authentication
- `RPCSEC_GSS = 6` - GSS-based security (RFC 2203, RFC 5403)

#### Renamed Authentication Flavors (RFC 1831)

- `AUTH_NONE = 0` - New standard name (was AUTH_NULL)
- `AUTH_SYS = 1` - New standard name (was AUTH_UNIX)
- `AUTH_DH = 3` - New standard name (was AUTH_DES)
- Kept old names as aliases for backward compatibility

#### Added Authentication Status Values (RFC 5531)

- `AUTH_OK = 0` - Success status
- `AUTH_INVALIDRESP = 6` - Invalid response
- `AUTH_FAILED = 7` - General authentication failure
- `AUTH_KERB_GENERIC = 8` - Generic Kerberos error
- `AUTH_TIMEEXPIRE = 9` - Time expiration
- `AUTH_TKT_FILE = 10` - Ticket file error
- `AUTH_DECODE = 11` - Decoding error
- `AUTH_NET_ADDR = 12` - Network address error
- `RPCSEC_GSS_CREDPROBLEM = 13` - GSS credential problem
- `RPCSEC_GSS_CTXPROBLEM = 14` - GSS context problem

#### Added Accept Status Value (RFC 5531)

- `SYSTEM_ERR = 5` - System error (e.g., memory allocation failures)

#### Added RFC Attribution Comments

- Each constant group now has `@see` references to the specific RFC sections
- Individual values annotated with their source RFC

### 2. Documentation

#### Created `RFC_COMPLIANCE.md`

Comprehensive documentation covering:

- All three RFC versions and their differences
- Authentication flavors evolution
- Authentication and accept status values
- Data size limits (400-byte auth body limit from RFC 1831)
- Batching and broadcast semantics
- Security considerations from RFC 5531
- Program number ranges and IANA administration
- Transport independence principles
- XDR references across RFC versions

#### Updated `README.md`

- Changed description from "RFC 1057" to "all three major RPC RFCs"
- Added list of supported RFCs (1057, 1831, 5531)
- Referenced `RFC_COMPLIANCE.md` for detailed information

## Backward Compatibility

All changes maintain full backward compatibility:

1. **Old authentication flavor names preserved** as aliases:

   - `AUTH_NULL` = `AUTH_NONE`
   - `AUTH_UNIX` = `AUTH_SYS`
   - `AUTH_DES` = `AUTH_DH`

2. **Existing functionality unchanged**:

   - All encoder/decoder logic remains the same
   - Wire format compatibility maintained
   - No breaking changes to API

3. **Test compatibility**:
   - All existing tests pass without modification
   - Existing code using old constants continues to work

## Wire Format Compatibility

The implementation is wire-compatible with:

- RFC 1057 (1988) implementations
- RFC 1831 (1995) implementations
- RFC 5531 (2009) implementations

All use RPC Version 2 protocol with identical on-the-wire message format.

## Implementation Notes

### What Changed

- Constants expanded to include all RFC-defined values
- Documentation enhanced with RFC attributions
- Size limits enforced per RFC 1831/5531 (400-byte auth body limit)

### What Didn't Change

- Core encoder/decoder implementation
- Message structure classes
- XDR encoding/decoding logic
- API surface
- Test suite (all tests pass)

## Testing

All existing tests pass without modification, confirming:

- Backward compatibility maintained
- No breaking changes introduced
- Core functionality preserved

## References

- RFC 1057: RPC: Remote Procedure Call, Version 2 (June 1988)
- RFC 1831: RPC: Remote Procedure Call Protocol Specification Version 2 (August 1995)
- RFC 5531: RPC: Remote Procedure Call Protocol Specification Version 2 (May 2009)
- RFC 2203: RPCSEC_GSS Protocol Specification
- RFC 5403: RPCSEC_GSS Version 2
