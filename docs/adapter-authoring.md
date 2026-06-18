# Adapter Authoring

Adapters add deterministic support for new ecosystems. Keep adapters conservative:

- Detect manifests and lockfiles.
- Extract user-visible commands.
- Avoid executing project code during audit.
- Add fixtures before adding fixes.
- Mark new adapters `experimental` until two independent fixtures pass.
