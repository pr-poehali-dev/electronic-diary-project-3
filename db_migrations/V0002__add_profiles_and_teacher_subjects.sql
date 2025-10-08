ALTER TABLE users ADD COLUMN avatar_color VARCHAR(7) DEFAULT '#2563EB';
ALTER TABLE users ADD COLUMN avatar_emoji VARCHAR(10) DEFAULT '👤';

CREATE TABLE teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id),
    subject_id INTEGER REFERENCES subjects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id)
);