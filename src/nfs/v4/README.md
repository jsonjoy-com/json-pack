# NFSv4 Protocol Implementation

This directory contains an implementation of the NFSv4 protocol data structures based on RFC 7530 and RFC 7531.

## Overview

NFSv4 is a distributed file system protocol that integrates:
- Traditional file access operations
- File locking (integrated, unlike NFSv3 which used separate NLM protocol)
- Mount protocol (integrated, unlike NFSv3 which used separate MOUNT protocol)
- Strong security with RPCSEC_GSS
- COMPOUND operations for reduced latency
- Client caching and delegations
- Internationalization support

## References

- [RFC 7530](https://tools.ietf.org/html/rfc7530): NFSv4 Protocol
- [RFC 7531](https://tools.ietf.org/html/rfc7531): NFSv4 XDR Description
