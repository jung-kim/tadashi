# Code structure

Here are the few design considerations for this concoction of ideas are these.

- utilization of signals to simplify broadcast communications and async executions.
- strict dependency considerations to reduce chicken and egg problems.
- singletons everywhere, view-controlls, singletons and singletons, all are singeltons.

## organizations

### filenames

- objects that are meant to be created with "new" starts with uppper case.
- all singletons, which includes view-controlls and singletons, starts with lower case.

### folders

Codes are organized by function and typs of dependency they are allowed to have.

- [events](./events/README.md)
    - view controls that handles dom manipulations
- [helpers](./helpers/README.md)
    - various utility functions
- [models](./models/README.md)
    - classes that describes object structures
- [singletons](./singletons/README.md)
    - isolated shared logic units.
