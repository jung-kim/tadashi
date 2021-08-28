# Singletons

Singletons are logic units that can have one and only one version of itself per instance.

Singletons do may depends on view-controls (but becareful of the circular dependencies)
Singletons do **NOT** depends on view-controls
Singletons do **NOT** depends on browser components such as `dom` or `window`.
