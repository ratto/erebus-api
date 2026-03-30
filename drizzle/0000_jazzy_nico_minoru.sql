CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`grupo` text,
	`atributo_base` text,
	`apenas_com_treinamento` integer DEFAULT false NOT NULL,
	`sinergia` text,
	`descricao` text NOT NULL
);
