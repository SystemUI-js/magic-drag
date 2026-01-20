# Research

## Decision: BroadcastChannel usage patterns

### Rationale
- Use a stable, explicit channel name and keep it consistent across tabs.
- Call `close()` when the channel is no longer needed to allow cleanup.
- Validate message shapes and handle `messageerror` to detect bad payloads.
- Avoid large payloads and consider throttling high-frequency updates.

### Alternatives considered
- SharedWorker messaging (rejected: heavier setup and not aligned with current API)
- LocalStorage event polling (rejected: lower fidelity and higher latency)
