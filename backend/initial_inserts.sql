-- 1. Insertar Roles (Admin y Superadmin)
INSERT INTO "roles" ("id", "name", "description", "createdAt", "updatedAt") VALUES
('67479a49-34f7-4193-b0ef-8871984a3f31', 'admin', 'Administrador standard', NOW(), NOW()),
('a597272e-831c-4c77-9375-751c14086a46', 'superadmin', 'Super Administrador con acceso total', NOW(), NOW());

-- 2. Insertar Usuario Superadmin
-- NOTA: La contraseña aquí es "Admin123!" hasheada con bcrypt (10 rounds)
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "isActive", "createdAt", "updatedAt") VALUES
('4367ab9d-0b05-4c8e-95cd-3fe4751a2cb2', 'admin@academyc.com', '$2b$10$P/1/p/p/p/p/p/p/p/p/pO123456789012345678901234567890.', 'Super', 'Admin', true, NOW(), NOW());

-- 3. Asignar Rol 'superadmin' al usuario
INSERT INTO "user_roles" ("id", "userId", "roleId", "assignedAt") VALUES
('f28271b4-6d55-4e3a-bc34-b080e3eea4f8', '4367ab9d-0b05-4c8e-95cd-3fe4751a2cb2', 'a597272e-831c-4c77-9375-751c14086a46', NOW());
