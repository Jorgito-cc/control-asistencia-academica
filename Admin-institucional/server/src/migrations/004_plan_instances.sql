CREATE TABLE platform_plan_instances (
    plan_id TEXT NOT NULL REFERENCES platform_plans(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('frontend', 'backend', 'database')),
    vcpu INTEGER NOT NULL CHECK (vcpu > 0),
    ram_gib NUMERIC(6, 2) NOT NULL CHECK (ram_gib > 0),
    system_disk_gb INTEGER NOT NULL CHECK (system_disk_gb > 0),
    aws_type TEXT NOT NULL CHECK (btrim(aws_type) <> ''),
    azure_type TEXT NOT NULL CHECK (btrim(azure_type) <> ''),
    PRIMARY KEY (plan_id, role)
);

INSERT INTO platform_plan_instances (plan_id, role, vcpu, ram_gib, system_disk_gb, aws_type, azure_type)
VALUES
    ('basico', 'frontend', 2, 1, 32, 't3.micro', 'Standard_B2ts_v2'),
    ('basico', 'backend', 2, 4, 32, 't3.medium', 'Standard_B2ls_v2'),
    ('basico', 'database', 2, 4, 32, 't3.medium', 'Standard_B2ls_v2'),
    ('estandar', 'frontend', 2, 4, 32, 't3.medium', 'Standard_B2ls_v2'),
    ('estandar', 'backend', 2, 8, 32, 't3.large', 'Standard_B2s_v2'),
    ('estandar', 'database', 2, 8, 32, 't3.large', 'Standard_B2s_v2'),
    ('avanzado', 'frontend', 2, 8, 32, 't3.large', 'Standard_B2s_v2'),
    ('avanzado', 'backend', 4, 16, 64, 't3.xlarge', 'Standard_B4s_v2'),
    ('avanzado', 'database', 4, 16, 64, 't3.xlarge', 'Standard_B4s_v2');
