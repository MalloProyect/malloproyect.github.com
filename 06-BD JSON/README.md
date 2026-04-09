

## Funcionalidades

- Listado de empleados en tabla.
- Carga inicial desde `employees.json`.
- Agregar empleados con validaciones.
- Campo opcional para URL de imagen.
- Eliminar empleados.
- Modificar empleados registrados
- Persistencia en `localStorage` (navegador).


## Nota

Los navegadores no permiten escribir directamente en un archivo JSON local desde JavaScript del lado cliente.
Por eso, `employees.json` se usa como fuente inicial y los cambios se guardan en `localStorage`.
