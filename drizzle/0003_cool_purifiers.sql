CREATE TABLE `protective_equipment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cost` text,
	`availability` text,
	`weight_kg` real,
	`dex_penalty` integer DEFAULT 0 NOT NULL,
	`agi_penalty` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `protective_equipment_name_unique` ON `protective_equipment` (`name`);--> statement-breakpoint
CREATE TABLE `protective_equipment_pt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `protective_equipment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `protective_equipment_pt_equipment_id_unique` ON `protective_equipment_pt` (`equipment_id`);--> statement-breakpoint
CREATE TABLE `protective_index` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`damage_type` text NOT NULL,
	`ip_value` integer NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `protective_equipment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_protective_index_unique` ON `protective_index` (`equipment_id`,`damage_type`);