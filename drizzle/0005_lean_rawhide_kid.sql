CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64),
	`displayName` varchar(100),
	`sessionId` int,
	`type` enum('feedback','idea','bug','request') NOT NULL DEFAULT 'feedback',
	`content` text NOT NULL,
	`status` enum('new','noted','planned','done','wontfix') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
