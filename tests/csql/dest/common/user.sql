CREATE TABLE `user` (
	`a` VARCHAR(100) NOT NULL,
	`b` VARCHAR(100) NULL DEFAULT NULL,
	`c` VARCHAR(100) NOT NULL DEFAULT 'haha',
	`d` INT UNSIGNED NOT NULL DEFAULT 432,
	`e` BIGINT UNSIGNED NOT NULL
)
CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci
;
