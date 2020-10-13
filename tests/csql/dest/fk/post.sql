CREATE TABLE `db_post` (
	`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	`title` VARCHAR(100) NOT NULL,
	`content` VARCHAR(100) NOT NULL,
	`user_id` BIGINT UNSIGNED NOT NULL,
	`reviewer_id` BIGINT UNSIGNED NOT NULL,
	`cmt_c` INT UNSIGNED NOT NULL DEFAULT 0,
	`datetime` DATETIME NOT NULL,
	`date` DATE NOT NULL,
	`time` TIME NOT NULL,
	`n_datetime` DATETIME NULL DEFAULT NULL,
	`n_date` DATE NULL DEFAULT NULL,
	`n_time` TIME NULL DEFAULT NULL,
	`my_user_id` BIGINT UNSIGNED NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT FOREIGN KEY(`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY(`reviewer_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY(`my_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
)
CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci
;
