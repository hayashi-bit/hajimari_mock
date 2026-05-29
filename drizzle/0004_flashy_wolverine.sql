ALTER TABLE `business_profiles` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `chat_sessions` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `business_profiles` ADD `deviceId` varchar(64);--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `deviceId` varchar(64);