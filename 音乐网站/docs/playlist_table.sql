-- 播放队列表 (Play Queue)
-- 用于存储用户的播放队列/播放列表

CREATE TABLE IF NOT EXISTS `play_queue` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `song_id` INT NOT NULL COMMENT '歌曲ID',
    `position` INT NOT NULL COMMENT '在队列中的位置',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_user_song` (`user_id`, `song_id`),
    INDEX `idx_user_position` (`user_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户播放队列表';

-- 示例: 添加歌曲到播放队列
-- INSERT INTO `play_queue` (`user_id`, `song_id`, `position`) VALUES (1, 1001, 1);

-- 示例: 获取用户的播放队列
-- SELECT pq.*, s.song, s.singer, s.img, s.url
-- FROM `play_queue` pq
-- LEFT JOIN `songs` s ON pq.song_id = s.id
-- WHERE pq.user_id = 1
-- ORDER BY pq.position ASC;

-- 示例: 删除队列中的某首歌
-- DELETE FROM `play_queue` WHERE `user_id` = 1 AND `song_id` = 1001;

-- 示例: 清空用户播放队列
-- DELETE FROM `play_queue` WHERE `user_id` = 1;

-- 示例: 批量添加歌曲到队列
-- INSERT INTO `play_queue` (`user_id`, `song_id`, `position`)
-- SELECT 1, id, @row := @row + 1
-- FROM `songs`, (SELECT @row := 0) r
-- WHERE id IN (1001, 1002, 1003);
