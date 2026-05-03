CREATE TABLE `combat_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`atributo_ataque` text,
	`atributo_defesa` text,
	`aprimoramento_requerido` text,
	`descricao` text NOT NULL
);
