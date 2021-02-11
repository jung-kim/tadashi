# Singletons

Singletons are logic unit that can have one and only one version of itself per instance.  Singletons do **NOT** depends on each others, but may depends on other helpers, models or simpletons.

Singletons may depends on simpletons
Singletons do **NOT** depends on other singletons
Singletons do **NOT** depends on view-controls
Singletons do **NOT** depends on browser components such as `dom` or `window`.
