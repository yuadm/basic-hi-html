-- Phase 1: Create questionnaires and questions for existing compliance types

-- First, let's create questionnaires for the three main compliance types
-- We need to get the compliance type IDs first, so let's insert questionnaires for Spot Check, Supervision, and Annual Appraisal

-- Create questionnaire for Spot Check
INSERT INTO compliance_questionnaires (name, description, compliance_type_id, is_active)
SELECT 'Spot Check Form', 'Standard spot check observation form', id, true
FROM compliance_types WHERE name = 'Spot Check';

-- Create questionnaire for Supervision  
INSERT INTO compliance_questionnaires (name, description, compliance_type_id, is_active)
SELECT 'Supervision Form', 'Quarterly supervision assessment form', id, true
FROM compliance_types WHERE name = 'Supervision';

-- Create questionnaire for Annual Appraisal
INSERT INTO compliance_questionnaires (name, description, compliance_type_id, is_active)
SELECT 'Annual Appraisal Form', 'Annual performance appraisal form', id, true
FROM compliance_types WHERE name = 'Annual Appraisal';

-- Now create questions for Spot Check (matching SpotCheckFormDialog.tsx)
INSERT INTO compliance_questions (question_text, question_type, is_required, order_index) VALUES
('Service User''s Name', 'text', true, 1),
('Care Worker 1 Name', 'text', true, 2),
('Care Worker 2 Name (optional)', 'text', false, 3),
('Date of spot check', 'text', true, 4),
('Time of spot check (From)', 'text', true, 5), 
('Time of spot check (To)', 'text', true, 6),
('Spot Check carried out by', 'text', true, 7),
('Care Worker arrives at the Service User''s home on time', 'yes_no', true, 8),
('Care Worker has keys for entry/Alerts the Service User upon arrival / key safe number', 'yes_no', true, 9),
('Care Worker is wearing a valid and current ID badge', 'yes_no', true, 10),
('Care Worker practices safe hygiene (use of PPE clothing, gloves/aprons etc.)', 'yes_no', true, 11),
('Care Worker checks Service User''s care plan upon arrival', 'yes_no', true, 12),
('Equipment (hoists etc) used properly', 'yes_no', true, 13),
('Care Worker practices proper food safety and hygiene principles', 'yes_no', true, 14),
('Care Worker is vigilant for hazards in the Service User''s home', 'yes_no', true, 15),
('Care Worker communicates with the Service User (tasks to be done, maintaining confidentiality)', 'yes_no', true, 16),
('Care Worker asks Service User if he/she is satisfied with the service', 'yes_no', true, 17),
('Care Worker completes Daily Report forms satisfactorily', 'yes_no', true, 18),
('Snacks left for the Service User are covered and stored properly', 'yes_no', true, 19),
('Care Worker leaves premises, locking doors behind him/her', 'yes_no', true, 20);

-- Create questions for Supervision (matching SupervisionFormDialog.tsx)
INSERT INTO compliance_questions (question_text, question_type, is_required, order_index) VALUES
('Date of the Supervision', 'text', true, 101),
('Employee Signature', 'text', true, 102),
('HOW ARE YOU (e.g., feelings, motivation, morale, issues to discuss)', 'text', true, 103),
('Company and Statutory Procedural Guidelines and Policy discussions', 'text', true, 104),
('Staff Issues (Teamwork, Supervision, observation, performance etc)', 'text', true, 105),
('Training and development (e.g., Training needs, application of what learnt)', 'text', true, 106),
('KEY AREAS OF RESPONSIBILITY (e.g., how is it going, any development needed)', 'text', true, 107),
('Other issues', 'text', true, 108),
('Annual Leave - Taken', 'text', false, 109),
('Annual Leave - Booked', 'text', false, 110),
('How many service users do you visit?', 'number', true, 111),
('Service User Names (comma separated)', 'text', true, 112),
('Office Use - Employee Name', 'text', false, 113),
('Office Use - Project', 'text', false, 114),
('Office Use - Supervisor', 'text', false, 115),
('Office Use - Date', 'text', false, 116),
('Office Use - Actions (JSON format)', 'text', false, 117);

-- Create questions for Annual Appraisal (matching AnnualAppraisalForm.tsx)
INSERT INTO compliance_questions (question_text, question_type, is_required, order_index) VALUES
('Job Title', 'text', true, 201),
('Appraisal Date', 'text', true, 202),
('Quality of work - Meeting Standards', 'multiple_choice', true, 203),
('Quality of work - Accuracy', 'multiple_choice', true, 204), 
('Quality of work - Attention to detail', 'multiple_choice', true, 205),
('Productivity - Meeting deadlines', 'multiple_choice', true, 206),
('Productivity - Time management', 'multiple_choice', true, 207),
('Productivity - Work completion', 'multiple_choice', true, 208),
('Communication - With colleagues', 'multiple_choice', true, 209),
('Communication - With management', 'multiple_choice', true, 210),
('Communication - Written communication', 'multiple_choice', true, 211),
('Initiative - Problem solving', 'multiple_choice', true, 212),
('Initiative - Taking initiative', 'multiple_choice', true, 213),
('Initiative - Adaptability', 'multiple_choice', true, 214),
('Manager Comments', 'text', false, 215),
('Employee Comments', 'text', false, 216),
('Manager Signature', 'text', true, 217),
('Employee Signature', 'text', true, 218),
('Action Plan - Development', 'text', false, 219),
('Action Plan - Training', 'text', false, 220),
('Action Plan - Career', 'text', false, 221);

-- Add options for multiple choice questions (Annual Appraisal ratings)
UPDATE compliance_questions 
SET options = '["Excellent", "Good", "Satisfactory", "Needs Improvement", "Unsatisfactory"]'::jsonb
WHERE question_text LIKE '%Quality of work%' 
   OR question_text LIKE '%Productivity%' 
   OR question_text LIKE '%Communication%' 
   OR question_text LIKE '%Initiative%';

-- Now link questions to questionnaires
-- Link Spot Check questions (1-20) to Spot Check questionnaire
INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
SELECT cq.id, q.id, q.order_index
FROM compliance_questionnaires cq
JOIN compliance_types ct ON cq.compliance_type_id = ct.id
JOIN compliance_questions q ON q.order_index BETWEEN 1 AND 20
WHERE ct.name = 'Spot Check';

-- Link Supervision questions (101-117) to Supervision questionnaire  
INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
SELECT cq.id, q.id, q.order_index - 100
FROM compliance_questionnaires cq
JOIN compliance_types ct ON cq.compliance_type_id = ct.id
JOIN compliance_questions q ON q.order_index BETWEEN 101 AND 117
WHERE ct.name = 'Supervision';

-- Link Annual Appraisal questions (201-221) to Annual Appraisal questionnaire
INSERT INTO compliance_questionnaire_questions (questionnaire_id, question_id, order_index)
SELECT cq.id, q.id, q.order_index - 200
FROM compliance_questionnaires cq
JOIN compliance_types ct ON cq.compliance_type_id = ct.id
JOIN compliance_questions q ON q.order_index BETWEEN 201 AND 221
WHERE ct.name = 'Annual Appraisal';