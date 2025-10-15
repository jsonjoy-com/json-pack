# Missing NFS Features Overview

The current code base implements NFSv4.0 semantics. Bringing it to feature parity with NFSv4.1 and NFSv4.2 requires the enhancements summarized below. Use this document as a high-level checklist for product managers, architects, and engineers.

## Legend

- **Status**: ✔️ complete · ⚠️ planned · ❌ missing
- **Impact**: H (high), M (medium), L (low) effort/risk assessment

## NFSv4.1 Gaps

| Feature Area | Status | Impact | Notes |
|--------------|:------:|:------:|-------|
| Session protocol (`EXCHANGE_ID`, `CREATE_SESSION`, `SEQUENCE`, replay cache) | ❌ | H | Must replace legacy `SETCLIENTID` handshake, manage slot tables, introduce session persistence, replay detection, and trunking support per RFC 5661 §18. |
| Backchannel callbacks | ❌ | M | Needed for delegations and pNFS recalls. Requires callback transport negotiation and request dispatch. |
| pNFS layouts and device management | ❌ | H | Implement `GETDEVICELIST`, `GETDEVICEINFO`, `LAYOUTGET/RETURN/COMMIT/ERROR/STATS`, plus registry for device IDs and layout drivers. |
| Layout-aware client tooling | ❌ | M | Client helpers must negotiate layouts, interpret device info, and choose data paths. |
| Recovery improvements (`RECLAIM_COMPLETE`, `FREE_STATEID`, `TEST_STATEID`) | ❌ | M | Enables robust crash recovery and state reclamation. |
| Secret state verification (`SET_SSV`) | ❌ | M | Required for secure session re-establishment. |
| Attribute expansion (layout hints, fs status, etc.) | ❌ | M | Update bitmaps and server responses to include new attributes; affects GETATTR/SETATTR flows. |
| Observability for sessions/pNFS | ❌ | L | Needed to monitor slot exhaustion, recalls, and layout churn. |

## NFSv4.2 Gaps

| Feature Area | Status | Impact | Notes |
|--------------|:------:|:------:|-------|
| Sparse file enhancements (`READ_PLUS`, `ALLOCATE`, `DEALLOCATE`) | ❌ | H | Requires encoder/decoder updates and filesystem support for hole punching and zero-cost reads. |
| Application I/O hints (`IO_ADVISE`, `SEEK`) | ❌ | M | Guides caching and positioning; backend hooks to adjust behavior. |
| Server-side clone/copy (`COPY`, `COPY_NOTIFY`, `OFFLOAD_STATUS`, `CLONE`, `OFFLOAD_CANCEL`) | ❌ | H | Demands asynchronous copy manager, inter-server RPCSEC_GSSv3 support, and backend integration. |
| Extended attributes (`GETXATTR`, `SETXATTR`, `LISTXATTR`, `REMOVEXATTR`) | ❌ | M | Provide POSIX-like xattr functionality with size/error handling. |
| Application Data Block (ADB) support | ❌ | M | Adds data integrity metadata for READ_PLUS transfers. |
| Labeled NFS (`sec_label`, MAC enforcement, operating modes) | ❌ | H | Mandates policy integration, attribute handling, and mode negotiation. |
| Observability for copy/sparse/xattr flows | ❌ | L | Logging/metrics for new operations to aid debugging. |
| Documentation updates | ⚠️ | L | Track new configuration steps, operational guidance, and compatibility matrices. |

## Cross-Cutting Concerns

- **Testing**: Integration suites must be expanded to cover sessions, pNFS, sparse files, server-side copy, xattrs, and labeled access control.
- **Security**: RPCSEC_GSSv3 support is mandatory for secure copy-offload; policy checks must extend to sec_label and SSV workflows.
- **Performance**: Slot table sizing, layout caching, and clone/copy offload should be tuned for high-throughput workloads.

## Next Steps

1. Execute the task breakdowns in `v4.1-implementation-plan.md` and `v4.2-implementation-plan.md`.
2. Prioritize high-impact items (sessions, pNFS, server-side copy) to unlock interoperability with modern NFS clients.
3. Coordinate with operations teams to validate required filesystem/backing service capabilities.
4. Maintain an updated gap tracker as features graduate from planned to completed.
