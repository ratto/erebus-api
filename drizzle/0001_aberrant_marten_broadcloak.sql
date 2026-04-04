CREATE TABLE `weapons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`categoria` text NOT NULL,
	`dano` text NOT NULL,
	`iniciativa` text NOT NULL,
	`fonte` text NOT NULL,
	`tipo` text NOT NULL,
	`tipo_dano` text,
	`ocultabilidade` text,
	`alcance_medio` text,
	`alcance_max` text,
	`calibre` text,
	`alcance_efetivo` text,
	`rof` text,
	`pente` text
);
