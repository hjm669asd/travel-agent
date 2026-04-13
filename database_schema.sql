-- 旅行社区数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS travel_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_community;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    bio TEXT DEFAULT NULL COMMENT '个人简介',
    is_admin BOOLEAN DEFAULT FALSE COMMENT '是否管理员',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 旅游日记表
CREATE TABLE IF NOT EXISTS diaries (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日记ID',
    user_id INT NOT NULL COMMENT '发布用户ID',
    title VARCHAR(200) NOT NULL COMMENT '日记标题',
    content TEXT NOT NULL COMMENT '日记正文',
    location VARCHAR(100) NOT NULL COMMENT '旅行地点',
    travel_date DATE NOT NULL COMMENT '旅行日期',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    like_count INT DEFAULT 0 COMMENT '点赞次数',
    is_published BOOLEAN DEFAULT TRUE COMMENT '是否发布',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_location (location),
    INDEX idx_travel_date (travel_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅游日记表';

-- 日记图片表
CREATE TABLE IF NOT EXISTS diary_images (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '图片ID',
    diary_id INT NOT NULL COMMENT '所属日记ID',
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
    INDEX idx_diary_id (diary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日记图片表';

-- 地点评分表
CREATE TABLE IF NOT EXISTS ratings (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评分ID',
    user_id INT NOT NULL COMMENT '评分用户ID',
    location VARCHAR(100) NOT NULL COMMENT '地点名称',
    score TINYINT NOT NULL COMMENT '评分(1-5)',
    comment TEXT DEFAULT NULL COMMENT '简短评价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评分时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_location (user_id, location),
    INDEX idx_location (location),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='地点评分表';

-- 日记点赞表
CREATE TABLE IF NOT EXISTS diary_likes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '点赞ID',
    diary_id INT NOT NULL COMMENT '日记ID',
    user_id INT NOT NULL COMMENT '点赞用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_diary_user (diary_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日记点赞表';

-- 插入默认管理员账户 (密码: admin123)
INSERT INTO users (username, email, password_hash, is_admin)
VALUES ('admin', 'admin@travel.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bUJ.7POanoNoCZ6', TRUE)
ON DUPLICATE KEY UPDATE username=username;
