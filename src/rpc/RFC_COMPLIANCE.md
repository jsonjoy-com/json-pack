# RFC Compliance Documentation

This RPC implementation supports all three major RPC RFCs:

- **RFC 1057** (1988) - RPC: Remote Procedure Call, Version 2
- **RFC 1831** (1995) - RPC: Remote Procedure Call Protocol Specification Version 2
- **RFC 5531** (2009) - RPC: Remote Procedure Call Protocol Specification Version 2 (Internet Standard)

## Changes from RFC 1057 to Full RFC Compliance

### 1. Authentication Flavors (RFC 1831/5531)

#### RFC 1057 (Original)

- AUTH_NULL (0)
- AUTH_UNIX (1)
- AUTH_SHORT (2)
- AUTH_DES (3)

#### RFC 1831 (Updated naming)

- AUTH_NONE (0) - renamed from AUTH_NULL
- AUTH_SYS (1) - renamed from AUTH_UNIX
- AUTH_SHORT (2)
- AUTH_DES (3) - refined but optional

#### RFC 5531 (Additional flavors)

- AUTH_NONE (0)
- AUTH_SYS (1)
- AUTH_SHORT (2)
- AUTH_DH (3) - Diffie-Hellman (obsolete, insecure per RFC 2695)
- AUTH_KERB (4) - Kerberos
- AUTH_RSA (5)
- RPCSEC_GSS (6) - GSS-based security with integrity/privacy (RFC 2203, RFC 5403)

**Implementation Note**: The code maintains backward compatibility by keeping AUTH_NULL as an alias for AUTH_NONE, and AUTH_UNIX as an alias for AUTH_SYS. AUTH_DES is also an alias for AUTH_DH.

### 2. Authentication Status Values (RFC 5531)

#### RFC 1057

- AUTH_BADCRED (1)
- AUTH_REJECTEDCRED (2)
- AUTH_BADVERF (3)
- AUTH_REJECTEDVERF (4)
- AUTH_TOOWEAK (5)

#### RFC 5531 (Additional values)

- AUTH_OK (0) - Added for completeness
- AUTH_INVALIDRESP (6)
- AUTH_FAILED (7)
- AUTH_KERB_GENERIC (8)
- AUTH_TIMEEXPIRE (9)
- AUTH_TKT_FILE (10)
- AUTH_DECODE (11)
- AUTH_NET_ADDR (12)
- RPCSEC_GSS_CREDPROBLEM (13) - RPCSEC_GSS credential problem
- RPCSEC_GSS_CTXPROBLEM (14) - RPCSEC_GSS context problem

### 3. Accept Status Values (RFC 5531)

#### RFC 1057

- SUCCESS (0)
- PROG_UNAVAIL (1)
- PROG_MISMATCH (2)
- PROC_UNAVAIL (3)
- GARBAGE_ARGS (4)

#### RFC 5531 (Addition)

- SYSTEM_ERR (5) - Added for issues like memory allocation failures

### 4. Data Size Limits

#### RFC 1057

- Opaque authentication bodies: Limited by XDR
- Fragment sizes: Limited by implementation

#### RFC 1831/5531

- Opaque authentication bodies: Up to 400 bytes
- Fragment sizes: Up to 2^31-1 bytes for stream transports (TCP)

**Implementation**: The decoder enforces the 400-byte limit for auth bodies. Fragment size limits for record marking are enforced by the separate `rm` module.

### 5. Batching and Broadcast (RFC 1831)

RFC 1831 explicitly formalized:

- **Batching**: Pipelining sequences of calls without immediate replies over reliable transports
- **Broadcast/Multicast RPC**: Support for multicast RPC over packet-based protocols like UDP

**Implementation Note**: This codec handles message encoding/decoding. Batching and broadcast semantics are implemented at the transport layer by the application.

### 6. Security Considerations (RFC 5531)

RFC 5531 emphasizes:

- AUTH_NONE and AUTH_SYS are weak and SHOULD NOT be used for modifiable data
- Future Standards Track RPC programs MUST support RPCSEC_GSS
- External security measures (e.g., privileged ports) may be necessary

**Implementation Note**: This codec provides the wire format for all authentication flavors. Security policy enforcement is the responsibility of the application layer.

## Program Number Ranges

### RFC 1057

- Simple assignment scheme

### RFC 1831

- 0x00000000-0x1fffffff: Defined by Sun/central authority
- 0x20000000-0x3fffffff: User-defined
- 0x40000000-0x5fffffff: Transient
- 0x60000000-0xffffffff: Reserved

### RFC 5531 (IANA Administration)

- Assignment authority transferred to IANA
- Formal policies: First Come First Served for small blocks, Specification Required for larger ones
- 0x20000000-0x3fffffff: Site-specific use
- Appendix C lists Sun-assigned numbers (e.g., portmapper=100000, NFS=100003)

**Implementation Note**: Program number validation and assignment is not enforced by this codec.

## XDR References

- **RFC 1057**: References original XDR specification
- **RFC 1831**: References RFC 1832 (XDR update)
- **RFC 5531**: References RFC 4506 (STD 67)

This implementation follows XDR encoding as specified in these standards.

## Transport Independence

All RFC versions maintain transport independence. The RPC protocol:

- Does NOT provide reliability (must be provided by transport or application)
- Does NOT attach specific semantics to remote procedures
- Supports both connection-oriented (TCP) and connectionless (UDP) transports

**Record Marking**: For TCP and other stream-oriented transports, RFC 1057 Section 10 specifies a record marking standard. This is implemented in the separate `rm` module (`src/rm/`).

## Compatibility

The implementation is designed to be compatible with all three RFC versions:

- Uses RPC_VERSION = 2 (compatible with all versions)
- Supports all authentication flavors (old and new names)
- Handles all error conditions defined across all RFCs
- Enforces size limits as specified in later RFCs

## References

1. RFC 1057 - RPC: Remote Procedure Call, Version 2 (June 1988)
2. RFC 1831 - RPC: Remote Procedure Call Protocol Specification Version 2 (August 1995)
3. RFC 5531 - RPC: Remote Procedure Call Protocol Specification Version 2 (May 2009)
4. RFC 2203 - RPCSEC_GSS Protocol Specification
5. RFC 5403 - RPCSEC_GSS Version 2
6. RFC 2623 - NFS Version 2 and Version 3 Security Issues and the NFS Protocol's Use of RPCSEC_GSS and Kerberos V5
