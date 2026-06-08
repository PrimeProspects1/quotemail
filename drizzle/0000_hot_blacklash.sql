CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`fullAddress` text NOT NULL,
	`street` varchar(255),
	`city` varchar(128),
	`state` varchar(64),
	`zip` varchar(16),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`source` enum('pin_drop','address_search','csv_import') DEFAULT 'address_search',
	`measuredSqFt` decimal(10,2),
	`roofSquares` decimal(8,2),
	`pitch` enum('flat','4/12','6/12','8/12','10/12+'),
	`satelliteImageUrl` text,
	`estimatePrice` decimal(10,2),
	`qrScanned` boolean DEFAULT false,
	`calledIn` boolean DEFAULT false,
	`converted` boolean DEFAULT false,
	`jobValue` decimal(10,2),
	`polygonPoints` json,
	`status` enum('pending','measured','estimated','ordered','mailed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`notes` text,
	`status` enum('draft','measuring','ready','ordered','printing','delivered') NOT NULL DEFAULT 'draft',
	`totalAddresses` int DEFAULT 0,
	`totalCost` decimal(10,2) DEFAULT '0.00',
	`estimatedPipelineValue` decimal(12,2) DEFAULT '0.00',
	`orderedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractor_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`phone` varchar(32),
	`licenseNumber` varchar(64),
	`logoUrl` text,
	`logoKey` text,
	`website` varchar(255),
	`tagline` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractor_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `contractor_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `pitch_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flatRate` decimal(8,2) DEFAULT '350.00',
	`pitch4Rate` decimal(8,2) DEFAULT '400.00',
	`pitch6Rate` decimal(8,2) DEFAULT '450.00',
	`pitch8Rate` decimal(8,2) DEFAULT '500.00',
	`pitch10Rate` decimal(8,2) DEFAULT '575.00',
	`flatMultiplier` decimal(4,2) DEFAULT '1.00',
	`pitch4Multiplier` decimal(4,2) DEFAULT '1.05',
	`pitch6Multiplier` decimal(4,2) DEFAULT '1.12',
	`pitch8Multiplier` decimal(4,2) DEFAULT '1.20',
	`pitch10Multiplier` decimal(4,2) DEFAULT '1.30',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pitch_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `pitch_rates_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `response_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`addressId` int NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('qr_scan','call','conversion') NOT NULL,
	`notes` text,
	`jobValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `response_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
