ALTER TABLE `cloudroom_threads` RENAME TO `osmodeck_threads`;--> statement-breakpoint
ALTER TABLE `cloudroom_commands` RENAME TO `osmodeck_commands`;--> statement-breakpoint
DROP INDEX IF EXISTS `cloudroom_threads_start_request_id_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `cloudroom_threads_session_id_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `cloudroom_commands_thread_created_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `osmodeck_threads_start_request_id_unique` ON `osmodeck_threads` (`start_request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `osmodeck_threads_session_id_unique` ON `osmodeck_threads` (`session_id`);--> statement-breakpoint
CREATE INDEX `osmodeck_commands_thread_created_idx` ON `osmodeck_commands` (`thread_id`,`created_at`);
