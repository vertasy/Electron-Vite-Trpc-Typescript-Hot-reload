CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`mimeType` text NOT NULL,
	`type` text NOT NULL,
	`thumbnailId` text,
	`ChunkCount` integer DEFAULT 0 NOT NULL,
	`personId` text,
	`embedding` blob,
	`caption` text,
	`messageId` text NOT NULL,
	`attachmentId` text,
	`url` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`thumbnailId`) REFERENCES `thumbnails`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `files_message_id_idx` ON `files` (`messageId`);--> statement-breakpoint
CREATE INDEX `files_attachment_id_idx` ON `files` (`attachmentId`);--> statement-breakpoint
CREATE INDEX `files_url_idx` ON `files` (`url`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`clientId` text NOT NULL,
	`guildId` text NOT NULL,
	`channelId` text NOT NULL,
	`botToken` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Default Name' NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `thumbnails` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`personId` text,
	`embedding` blob,
	`caption` text,
	`messageId` text NOT NULL,
	`attachmentId` text,
	`url` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `thumbnails_message_id_idx` ON `thumbnails` (`messageId`);--> statement-breakpoint
CREATE INDEX `thumbnails_attachment_id_idx` ON `thumbnails` (`attachmentId`);--> statement-breakpoint
CREATE INDEX `thumbnails_url_idx` ON `thumbnails` (`url`);