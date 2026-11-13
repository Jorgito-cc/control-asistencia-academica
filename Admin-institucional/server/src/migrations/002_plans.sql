INSERT INTO platform_plans (id, name, description, limit_students, database_gb, backup)
VALUES
    ('basico', 'Básico', 'Para una institución que empieza a registrar asistencia.', 100, 10, 'Semanal'),
    ('estandar', 'Estándar', 'Para una institución con más estudiantes y registros.', 1000, 50, 'Diario'),
    ('avanzado', 'Avanzado', 'Para una institución con mayor volumen de asistencia.', 5000, 200, 'Diario con retención ampliada');
