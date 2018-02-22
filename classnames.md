# Breaking changes
- .param has been renamed to .param-name

# Classnames
membername
: The name of an exported member.

arraytype
: Tag contains type parameter(s) of an array type.

typeparams
: Tag contains type parameters of custom parameterized type.

parameterized-type
: Tag contains parameterized type name.

type
: Tag contains a full type reference.

paramlist
: Tag contains a list of parameter types for a function type.

param-name
: The name (not including type) of a function parameter.
Was previously `param`.

param
: Tag contains a parameter, including parameter type, name, and default value.

rest-param
: Tag contains a rest parameter. Attached to `.param` element.


defaultvalue
: The default value of a function parameter.

# Data attributes
data-typename
: The name of a simple type (i.e. not containing type parameters).
Attached to the `.type` container tag.

data-arity
: The arity of a paramlist element.
If any parameter in the paramlist is a rest parameter, this value
is set to `*`.

data-optional
: Attached to a .type tag if the type is an optional wrapped type.
