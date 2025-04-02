-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  rules TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create learner_badges table
CREATE TABLE IF NOT EXISTS learner_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  badge_id INT NOT NULL,
  learner_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  FOREIGN KEY (learner_id) REFERENCES learners(id),
  UNIQUE KEY unique_learner_badge (learner_id, badge_id)
);

-- Insert default badges
INSERT INTO badges (name, image, rules, category) VALUES
-- Learning Marathon badges
('3-Day Streak', '3-day-streak.png', 'Complete quizzes for 3 consecutive days', 'streak'),
('7-Day Streak', '7-day-streak.png', 'Complete quizzes for 7 consecutive days', 'streak'),
('30-Day Streak', '30-day-streak.png', 'Complete quizzes for 30 consecutive days', 'streak'),

-- Sharp Shooter badges
('3 in a Row', '3-in-a-row.png', 'Answer 3 questions correctly in a row', 'accuracy'),
('5 in a Row', '5-in-a-row.png', 'Answer 5 questions correctly in a row', 'accuracy'),
('10 in a Row', '10-in-a-row.png', 'Answer 10 questions correctly in a row', 'accuracy'),

-- Subject badges
('Physical Sciences Master', 'physical-sciences.png', 'Answer 50 Physical Sciences questions correctly', 'subject'),
('Mathematics Master', 'mathematics.png', 'Answer 50 Mathematics questions correctly', 'subject'),
('Agricultural Sciences Master', 'agricultural-sciences.png', 'Answer 50 Agricultural Sciences questions correctly', 'subject'),
('Economics Master', 'economics.png', 'Answer 50 Economics questions correctly', 'subject'),
('Geography Master', 'geography.png', 'Answer 50 Geography questions correctly', 'subject'),
('Life Sciences Master', 'life-sciences.png', 'Answer 50 Life Sciences questions correctly', 'subject'),
('Mathematics Literacy Master', 'mathematics-literacy.png', 'Answer 50 Mathematics Literacy questions correctly', 'subject'),
('History Master', 'history.png', 'Answer 50 History questions correctly', 'subject'),
('Tourism Master', 'tourism.png', 'Answer 50 Tourism questions correctly', 'subject'),
('Business Studies Master', 'business-studies.png', 'Answer 50 Business Studies questions correctly', 'subject'); 