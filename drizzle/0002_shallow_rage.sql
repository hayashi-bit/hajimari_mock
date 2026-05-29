ALTER TABLE `chat_sessions` ADD `mode` varchar(50);--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `keywords` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `strengths` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `uncertainties` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `nextTheme` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `summary` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `summaryGeneratedAt` timestamp;